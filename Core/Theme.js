import { Storage } from "./Storage.js";

let themeConfig = null;
let accentColours = null;
let mediaQuery = null;
let mediaListener = null;
let previewPreference = null;

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function validateAppearance(preference) {
  if (!["light", "dark", "system"].includes(preference)) {
    throw new Error(`Unknown appearance: ${preference}`);
  }
}

function savedAppearance() {
  return Storage.get("appearance", themeConfig.defaultAppearance);
}

function resolvedAppearance(preference) {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyAppearance(preference) {
  const resolved = resolvedAppearance(preference);
  document.documentElement.dataset.appearancePreference = preference;
  document.documentElement.dataset.theme = resolved;
}

function applyAccent() {
  const key = themeConfig.accent;
  const palette = accentColours[key];
  if (!palette) throw new Error(`Unknown app accent colour: ${key}`);

  const root = document.documentElement;
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-strong", palette.accentStrong);
  root.style.setProperty("--accent-soft", palette.accentSoft);
  root.style.setProperty("--accent-muted", palette.accentMuted);
  root.style.setProperty("--text-on-accent", palette.textOnAccent);
  root.dataset.accent = key;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", palette.accent);
}

function notifyThemeChanged() {
  window.dispatchEvent(new CustomEvent("frever:theme-changed", {
    detail: Theme.getCurrent()
  }));
}

export const Theme = {
  async init() {
    [themeConfig, accentColours] = await Promise.all([
      loadJson("./Config/Theme.json"),
      loadJson("./Config/AccentColours.json")
    ]);

    applyAppearance(savedAppearance());
    applyAccent();

    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaListener = () => {
      const activePreference = previewPreference ?? savedAppearance();
      if (activePreference === "system") {
        applyAppearance("system");
        notifyThemeChanged();
      }
    };
    mediaQuery.addEventListener?.("change", mediaListener);
  },

  getConfig() {
    return structuredClone(themeConfig);
  },

  getCurrent() {
    return {
      accent: themeConfig.accent,
      appearance: previewPreference ?? savedAppearance(),
      savedAppearance: savedAppearance(),
      isPreviewing: previewPreference !== null,
      resolvedAppearance: document.documentElement.dataset.theme
    };
  },

  previewAppearance(preference) {
    validateAppearance(preference);
    previewPreference = preference;
    applyAppearance(preference);
    notifyThemeChanged();
  },

  cancelPreview() {
    if (previewPreference === null) return;
    previewPreference = null;
    applyAppearance(savedAppearance());
    notifyThemeChanged();
  },

  setAppearance(preference) {
    validateAppearance(preference);
    previewPreference = null;
    Storage.set("appearance", preference);
    applyAppearance(preference);
    notifyThemeChanged();
  },

  refreshFromStorage() {
    previewPreference = null;
    applyAppearance(savedAppearance());
    notifyThemeChanged();
  }
};
