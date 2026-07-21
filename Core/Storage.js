let prefix = "frever-template:";

export const Storage = {
  setNamespace(appCode) {
    const safeCode = String(appCode || "template")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    prefix = `frever-${safeCode}:`;
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`${prefix}${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn(`Could not read local setting: ${key}`, error);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`${prefix}${key}`, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Could not save local setting: ${key}`, error);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(`${prefix}${key}`);
  },

  clearAppSettings() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(prefix))
      .forEach(key => localStorage.removeItem(key));
  }
};
