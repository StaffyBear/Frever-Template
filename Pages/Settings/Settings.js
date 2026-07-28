import { Theme } from "../../Core/Theme.js";
import { Storage } from "../../Core/Storage.js";
import { Auth } from "../../Core/Auth.js";
import { Database } from "../../Core/Database.js";
import { Modal } from "../../Components/Modal/Modal.js";
import { showToast } from "../../Components/Toast/Toast.js";

async function loadJson(path) {
  const version = window.FREVER_APP_VERSION;
  const versionedPath = version ? `${path}?v=${encodeURIComponent(version)}` : path;
  const response = await fetch(versionedPath, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function configurableHomeItems(items) {
  return items
    .filter(item => item.id !== "home" && item.id !== "settings" && item.showOnHome !== false)
    .sort((a, b) => a.position - b.position);
}

function defaultHomeTiles(items) {
  return configurableHomeItems(items).map(item => item.id);
}

function defaultNavigationButtons(items) {
  return items
    .filter(item => !item.fixed && item.showInNavigation !== false)
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
    .map(item => item.id);
}

function checkboxList(items, selectedIds, name) {
  return items.map(item => `
    <label class="modal-option-card">
      <input type="checkbox" name="${name}" value="${escapeHtml(item.id)}" ${selectedIds.includes(item.id) ? "checked" : ""}>
      <span>${escapeHtml(item.label)}</span>
    </label>
  `).join("");
}

function statusMarkup(message, type = "info") {
  if (!message) return "";
  return `<div class="form-status form-status-${type}" role="status">${escapeHtml(message)}</div>`;
}

function appearancePreviewOption(value, label, description) {
  return `
    <label class="appearance-preview-card" data-appearance-card="${value}">
      <input type="radio" name="appearance-preview" value="${value}">
      <span class="appearance-preview-window appearance-preview-${value}" aria-hidden="true">
        <span class="appearance-preview-header">
          <span class="appearance-preview-logo"></span>
          <span class="appearance-preview-title-line"></span>
        </span>
        <span class="appearance-preview-content">
          <span class="appearance-preview-tile is-accent"></span>
          <span class="appearance-preview-tile"></span>
          <span class="appearance-preview-tile"></span>
        </span>
        <span class="appearance-preview-navigation">
          <span></span><span></span><span></span>
        </span>
      </span>
      <span class="appearance-preview-copy">
        <strong>${label}</strong>
        <small>${description}</small>
      </span>
    </label>`;
}


async function openAccount() {
  const user = Auth.getCurrentUser();
  if (!user) return;

  let profile = null;
  try {
    profile = await Database.getProfile();
  } catch (error) {
    console.warn("Could not load profile", error);
  }

  const displayName = profile?.display_name || user.user_metadata?.display_name || "";
  const content = await Modal.open({
    title: "Account",
    content: `
      <div class="modal-stack">
        <div class="account-summary">
          <span class="account-avatar" aria-hidden="true">👤</span>
          <div>
            <strong>${escapeHtml(displayName || "Frever user")}</strong>
            <span>${escapeHtml(user.email || "")}</span>
          </div>
        </div>

        <form class="form-stack" data-account-form>
          <label class="form-field">
            <span>Display name <small>(optional)</small></span>
            <input name="displayName" type="text" autocomplete="name" maxlength="80" value="${escapeHtml(displayName)}">
          </label>
          <label class="form-field">
            <span>Email address</span>
            <input type="email" value="${escapeHtml(user.email || "")}" disabled>
          </label>
          <button class="button button-primary" type="submit">Save account details</button>
        </form>
        <div data-account-status></div>
      </div>`
  });

  content.addEventListener("submit", async event => {
    const form = event.target.closest("[data-account-form]");
    if (!form) return;
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    const status = content.querySelector("[data-account-status]");
    button.disabled = true;

    try {
      const values = Object.fromEntries(new FormData(form).entries());
      await Database.updateProfile({ displayName: String(values.displayName || "") });
      status.innerHTML = statusMarkup("Account details updated.", "success");
    } catch (error) {
      status.innerHTML = statusMarkup(error.message || "Could not update account details.", "error");
    } finally {
      button.disabled = false;
    }
  });
}

async function openHomeLayout(navigationItems) {
  const originalAppearance = Theme.getCurrent().savedAppearance;
  const defaults = defaultHomeTiles(navigationItems);
  const storedHomeTiles = Storage.get("homeTiles", defaults);
  const saved = Array.isArray(storedHomeTiles)
    ? storedHomeTiles.filter(id => defaults.includes(id))
    : defaults;

  if (!Array.isArray(storedHomeTiles) || JSON.stringify(saved) !== JSON.stringify(storedHomeTiles)) {
    Storage.set("homeTiles", saved);
  }

  const selectableItems = configurableHomeItems(navigationItems);
  let selectedAppearance = originalAppearance;

  const content = await Modal.open({
    title: "Home Layout",
    onClose: reason => {
      if (reason !== "save") Theme.cancelPreview();
    },
    content: `
      <div class="modal-stack">
        <section class="modal-section">
          <h3>Appearance</h3>
          <p>Choose an appearance to preview it before saving.</p>
          <div class="appearance-preview-grid" data-appearance-options>
            ${appearancePreviewOption("system", "System", "Matches this device")}
            ${appearancePreviewOption("light", "Light", "Light background")}
            ${appearancePreviewOption("dark", "Dark", "Dark background")}
          </div>
        </section>

        <section class="modal-section">
          <h3>Homepage tiles</h3>
          <p>Choose which app pages are shown. Settings is always included and cannot be removed.</p>
          <div class="modal-option-grid" data-home-options>
            ${checkboxList(selectableItems, saved, "home-tile")}
          </div>
        </section>

        <div class="modal-action-row modal-action-row-split">
          <button class="button button-secondary" type="button" data-cancel-home-layout>Cancel</button>
          <button class="button button-primary" type="button" data-save-home-layout>Save layout</button>
        </div>
      </div>`
  });

  const updateAppearanceOptions = () => {
    content.querySelectorAll("[data-appearance-card]").forEach(card => {
      const selected = card.dataset.appearanceCard === selectedAppearance;
      card.classList.toggle("is-selected", selected);
      const input = card.querySelector('input[name="appearance-preview"]');
      if (input) input.checked = selected;
    });
  };
  updateAppearanceOptions();

  content.addEventListener("change", event => {
    if (!event.target.matches('input[name="appearance-preview"]')) return;
    selectedAppearance = event.target.value;
    Theme.previewAppearance(selectedAppearance);
    updateAppearanceOptions();
  });

  content.addEventListener("click", async event => {
    if (event.target.closest("[data-cancel-home-layout]")) {
      Modal.close("cancel");
      return;
    }

    const saveButton = event.target.closest("[data-save-home-layout]");
    if (!saveButton) return;

    saveButton.disabled = true;
    const selectedTiles = [...content.querySelectorAll('input[name="home-tile"]:checked')]
      .map(input => input.value)
      .filter(id => defaults.includes(id));

    Storage.set("homeTiles", selectedTiles);
    Theme.setAppearance(selectedAppearance);
    window.dispatchEvent(new CustomEvent("frever:home-layout-changed"));

    try {
      await Database.saveCurrentAppSettings();
      Modal.close("save");
      showToast("Home layout updated", "success");
    } catch (error) {
      saveButton.disabled = false;
      showToast(`Saved on this device, but cloud sync failed: ${error.message}`, "error");
    }
  });
}

async function openNavigation(navigationItems) {
  const configurableItems = navigationItems
    .filter(item => !item.fixed && item.showInNavigation !== false)
    .sort((a, b) => a.position - b.position);
  const defaults = defaultNavigationButtons(navigationItems);
  const storedNavigationButtons = Storage.get("navigationButtons", defaults);
  const saved = Array.isArray(storedNavigationButtons) ? storedNavigationButtons : defaults;

  const content = await Modal.open({
    title: "Navigation Buttons",
    content: `
      <div class="modal-stack">
        <section class="modal-section">
          <p>Home and Settings are always shown. Choose exactly three other pages.</p>
          <div class="modal-option-grid" data-navigation-options>
            ${checkboxList(configurableItems, saved, "navigation-button")}
          </div>
        </section>

        <div class="modal-action-row modal-action-row-split">
          <button class="button button-secondary" type="button" data-cancel-navigation>Cancel</button>
          <button class="button button-primary" type="button" data-save-navigation>Save navigation</button>
        </div>
      </div>`
  });

  const updateDisabledState = () => {
    const checked = [...content.querySelectorAll('input[name="navigation-button"]:checked')];
    const atLimit = checked.length >= 3;
    content.querySelectorAll('input[name="navigation-button"]').forEach(input => {
      input.disabled = atLimit && !input.checked;
    });
  };
  updateDisabledState();

  content.addEventListener("change", event => {
    if (event.target.matches('input[name="navigation-button"]')) updateDisabledState();
  });

  content.addEventListener("click", async event => {
    if (event.target.closest("[data-cancel-navigation]")) {
      Modal.close("cancel");
      return;
    }

    const saveButton = event.target.closest("[data-save-navigation]");
    if (!saveButton) return;

    const selected = [...content.querySelectorAll('input[name="navigation-button"]:checked')]
      .map(input => input.value);

    if (selected.length !== 3) {
      showToast("Choose exactly three navigation pages", "error");
      return;
    }

    saveButton.disabled = true;
    Storage.set("navigationButtons", selected);
    window.dispatchEvent(new CustomEvent("frever:navigation-changed"));

    try {
      await Database.saveCurrentAppSettings();
      Modal.close("save");
      showToast("Navigation updated", "success");
    } catch (error) {
      saveButton.disabled = false;
      showToast(`Saved on this device, but cloud sync failed: ${error.message}`, "error");
    }
  });
}

async function openBackup() {
  const user = Auth.getCurrentUser();
  const content = await Modal.open({
    title: "Back up",
    content: user
      ? `
        <div class="modal-stack">
          <div class="account-summary compact">
            <span class="account-avatar" aria-hidden="true">☁</span>
            <div>
              <strong>Cloud synchronisation is active</strong>
              <span>${escapeHtml(user.email)}</span>
            </div>
          </div>
          <p>Your appearance, Homepage tiles and bottom-navigation choices are saved to your Frever account.</p>
          <div class="modal-note">App-specific records will use their own Supabase tables when each app is built.</div>
          <button class="button button-primary" type="button" data-sync-now>Sync now</button>
          <div data-backup-status></div>
        </div>`
      : `
        <div class="modal-stack">
          <p>Your settings are currently stored only on this device.</p>
          <div class="modal-note">Open Account and sign in to synchronise appearance, Homepage tiles and navigation choices.</div>
        </div>`
  });

  content.addEventListener("click", async event => {
    const button = event.target.closest("[data-sync-now]");
    if (!button) return;
    button.disabled = true;
    const status = content.querySelector("[data-backup-status]");
    try {
      await Database.saveCurrentAppSettings();
      status.innerHTML = statusMarkup("Settings synchronised.", "success");
    } catch (error) {
      status.innerHTML = statusMarkup(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });
}

async function openAbout(appConfig) {
  await Modal.open({
    title: "About",
    content: `
      <div class="modal-stack">
        <div class="about-brand">
          <img src="${escapeHtml(appConfig.logo)}" alt="" class="about-logo">
          <div>
            <h3>${escapeHtml(appConfig.appName)}</h3>
            <p>${escapeHtml(appConfig.description)}</p>
          </div>
        </div>
        <div class="modal-info-list">
          <div><span>Version</span><strong>${escapeHtml(appConfig.version)}</strong></div>
          <div><span>App code</span><strong>${escapeHtml(appConfig.appCode)}</strong></div>
          <div><span>Database</span><strong>${Auth.isEnabled() ? "Connected" : "Not connected"}</strong></div>
          <div><span>Account</span><strong>${Auth.getCurrentUser() ? "Signed in" : "Signed out"}</strong></div>
        </div>
      </div>`
  });
}

async function openSignOut() {
  const content = await Modal.open({
    title: "Sign out",
    content: `
      <div class="modal-stack">
        <p>Sign out of your Frever account on this device?</p>
        <div class="modal-action-row modal-action-row-split">
          <button class="button button-secondary" type="button" data-cancel-signout>Cancel</button>
          <button class="button button-primary" type="button" data-confirm-signout>Sign out</button>
        </div>
      </div>`
  });

  content.addEventListener("click", async event => {
    if (event.target.closest("[data-cancel-signout]")) {
      Modal.close("cancel");
      return;
    }

    const button = event.target.closest("[data-confirm-signout]");
    if (!button) return;
    button.disabled = true;

    try {
      await Auth.signOut();
      Modal.close("signed-out");
    } catch (error) {
      button.disabled = false;
      showToast(error.message || "Could not sign out", "error");
    }
  });
}

export async function init() {
  const page = document.querySelector('[data-page="settings"]');
  const [appConfig, navigationConfig] = await Promise.all([
    loadJson("./Config/App.json"),
    loadJson("./Config/Navigation.json")
  ]);


  const clickHandler = async event => {
    const tile = event.target.closest("[data-settings-panel]");
    if (!tile) return;

    switch (tile.dataset.settingsPanel) {
      case "account":
        await openAccount();
        break;
      case "home-layout":
        await openHomeLayout(navigationConfig.items);
        break;
      case "navigation":
        await openNavigation(navigationConfig.items);
        break;
      case "backup":
        await openBackup();
        break;
      case "about":
        await openAbout(appConfig);
        break;
      case "sign-out":
        await openSignOut();
        break;
      default:
        break;
    }
  };

  page.addEventListener("click", clickHandler);
  return () => {
    Modal.close("route-change");
    Theme.cancelPreview();
    page.removeEventListener("click", clickHandler);
  };
}
