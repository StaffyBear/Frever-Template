import { Storage } from "./Storage.js";

let themeConfig = null;
let accentColours = null;
let mediaQuery = null;
let mediaListener = null;

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
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

    const appearance = Storage.get("appearance", themeConfig.defaultAppearance);
    applyAppearance(appearance);
    applyAccent();

    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaListener = () => {
      if (Storage.get("appearance", themeConfig.defaultAppearance) === "system") {
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
      appearance: Storage.get("appearance", themeConfig.defaultAppearance),
      resolvedAppearance: document.documentElement.dataset.theme
    };
  },

  setAppearance(preference) {
    if (!["light", "dark", "system"].includes(preference)) {
      throw new Error(`Unknown appearance: ${preference}`);
    }
    Storage.set("appearance", preference);
    applyAppearance(preference);
    notifyThemeChanged();
  }
};
