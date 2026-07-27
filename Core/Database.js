import { Storage } from "./Storage.js";
import { Theme } from "./Theme.js";

let client = null;
let appCode = null;

function requireClient() {
  if (!client) throw new Error("Supabase database is not connected.");
  return client;
}

async function currentUser() {
  if (!client) return null;
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

function localSettingsSnapshot() {
  return {
    appearance: Theme.getCurrent().savedAppearance,
    homeTiles: Storage.get("homeTiles", null),
    navigationButtons: Storage.get("navigationButtons", null)
  };
}

function cleanSettings(value) {
  const settings = value && typeof value === "object" ? value : {};
  const cleaned = {};

  if (["system", "light", "dark"].includes(settings.appearance)) {
    cleaned.appearance = settings.appearance;
  }

  if (Array.isArray(settings.homeTiles)) {
    cleaned.homeTiles = settings.homeTiles.filter(item => typeof item === "string");
  }

  if (Array.isArray(settings.navigationButtons)) {
    cleaned.navigationButtons = settings.navigationButtons.filter(item => typeof item === "string");
  }

  return cleaned;
}

function applySettingsLocally(settings) {
  const cleaned = cleanSettings(settings);

  if (cleaned.appearance) Storage.set("appearance", cleaned.appearance);
  if (cleaned.homeTiles) Storage.set("homeTiles", cleaned.homeTiles);
  if (cleaned.navigationButtons) Storage.set("navigationButtons", cleaned.navigationButtons);

  Theme.refreshFromStorage();
  window.dispatchEvent(new CustomEvent("frever:home-layout-changed"));
  window.dispatchEvent(new CustomEvent("frever:navigation-changed"));
  window.dispatchEvent(new CustomEvent("frever:settings-synced", {
    detail: { settings: cleaned }
  }));

  return cleaned;
}

export const Database = {
  init({ supabaseClient, code }) {
    client = supabaseClient ?? null;
    appCode = code || null;
  },

  isEnabled() {
    return Boolean(client && appCode);
  },

  async getProfile() {
    const user = await currentUser();
    if (!user) return null;

    const { data, error } = await requireClient()
      .from("frever_profiles")
      .select("user_id, display_name, avatar_url, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile({ displayName }) {
    const user = await currentUser();
    if (!user) throw new Error("Sign in before updating your profile.");

    const payload = {
      user_id: user.id,
      display_name: displayName?.trim() || null
    };

    const { data, error } = await requireClient()
      .from("frever_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select("user_id, display_name, avatar_url, created_at, updated_at")
      .single();

    if (error) throw error;
    return data;
  },

  async getAppSettings() {
    const user = await currentUser();
    if (!user || !appCode) return null;

    const { data, error } = await requireClient()
      .from("frever_app_settings")
      .select("settings, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("app_code", appCode)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async saveCurrentAppSettings() {
    const user = await currentUser();
    if (!user || !appCode) {
      return { saved: false, reason: "signed-out" };
    }

    const settings = cleanSettings(localSettingsSnapshot());
    const { data, error } = await requireClient()
      .from("frever_app_settings")
      .upsert({
        user_id: user.id,
        app_code: appCode,
        settings
      }, {
        onConflict: "user_id,app_code"
      })
      .select("settings, updated_at")
      .single();

    if (error) throw error;
    return { saved: true, data };
  },

  async syncUserPreferences() {
    const user = await currentUser();
    if (!user || !appCode) return { synced: false, reason: "signed-out" };

    const cloud = await this.getAppSettings();
    if (cloud?.settings && Object.keys(cloud.settings).length) {
      const settings = applySettingsLocally(cloud.settings);
      return { synced: true, source: "cloud", settings, updatedAt: cloud.updated_at };
    }

    const saved = await this.saveCurrentAppSettings();
    return {
      synced: Boolean(saved.saved),
      source: "local",
      settings: localSettingsSnapshot(),
      updatedAt: saved.data?.updated_at ?? null
    };
  },

  applySettingsLocally
};
