import { Theme } from "../../Core/Theme.js";
import { Storage } from "../../Core/Storage.js";
import { Modal } from "../../Components/Modal/Modal.js";
import { showToast } from "../../Components/Toast/Toast.js";

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
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

async function openAccount(appConfig) {
  await Modal.open({
    title: "Account",
    content: `
      <div class="modal-stack">
        <p>Your Frever account will be connected during the Supabase authentication stage.</p>
        <div class="modal-info-list">
          <div><span>App</span><strong>${escapeHtml(appConfig.appName)}</strong></div>
          <div><span>Database</span><strong>Not connected</strong></div>
          <div><span>Account status</span><strong>Template mode</strong></div>
        </div>
      </div>
    `
  });
}

async function openHomeLayout(navigationItems) {
  const originalAppearance = Theme.getCurrent().savedAppearance;
  const defaults = defaultHomeTiles(navigationItems);
  const storedHomeTiles = Storage.get("homeTiles", defaults);
  const saved = Array.isArray(storedHomeTiles)
    ? storedHomeTiles.filter(id => defaults.includes(id))
    : defaults;
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
          <p>Select an option to preview it immediately. Save the layout to keep the change.</p>
          <div class="segmented-control" data-modal-appearance>
            <button type="button" data-appearance="system">System</button>
            <button type="button" data-appearance="light">Light</button>
            <button type="button" data-appearance="dark">Dark</button>
          </div>
        </section>

        <section class="modal-section">
          <h3>Homepage tiles</h3>
          <p>Choose which app pages are shown. Settings is always included.</p>
          <div class="modal-option-grid" data-home-options>
            ${checkboxList(selectableItems, saved, "home-tile")}
          </div>
        </section>

        <div class="modal-action-row modal-action-row-split">
          <button class="button button-secondary" type="button" data-cancel-home-layout>Cancel</button>
          <button class="button button-primary" type="button" data-save-home-layout>Save layout</button>
        </div>
      </div>
    `
  });

  const updateAppearanceButtons = () => {
    content.querySelectorAll("[data-appearance]").forEach(button => {
      const selected = button.dataset.appearance === selectedAppearance;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };
  updateAppearanceButtons();

  content.addEventListener("click", event => {
    const appearanceButton = event.target.closest("[data-appearance]");
    if (appearanceButton) {
      selectedAppearance = appearanceButton.dataset.appearance;
      Theme.previewAppearance(selectedAppearance);
      updateAppearanceButtons();
      return;
    }

    if (event.target.closest("[data-cancel-home-layout]")) {
      Modal.close("cancel");
      return;
    }

    if (event.target.closest("[data-save-home-layout]")) {
      const selectedTiles = [...content.querySelectorAll('input[name="home-tile"]:checked')]
        .map(input => input.value);

      Storage.set("homeTiles", selectedTiles);
      Theme.setAppearance(selectedAppearance);
      window.dispatchEvent(new CustomEvent("frever:home-layout-changed"));
      Modal.close("save");
      showToast("Home layout updated", "success");
    }
  });
}

async function openNavigation(navigationItems) {
  const configurableItems = navigationItems
    .filter(item => !item.fixed)
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
      </div>
    `
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

  content.addEventListener("click", event => {
    if (event.target.closest("[data-cancel-navigation]")) {
      Modal.close("cancel");
      return;
    }

    if (!event.target.closest("[data-save-navigation]")) return;

    const selected = [...content.querySelectorAll('input[name="navigation-button"]:checked')]
      .map(input => input.value);

    if (selected.length !== 3) {
      showToast("Choose exactly three navigation pages", "error");
      return;
    }

    Storage.set("navigationButtons", selected);
    window.dispatchEvent(new CustomEvent("frever:navigation-changed"));
    Modal.close("save");
    showToast("Navigation updated", "success");
  });
}

async function openBackup() {
  await Modal.open({
    title: "Back up",
    content: `
      <div class="modal-stack">
        <p>Cloud back up will be added after Supabase is connected.</p>
        <div class="modal-note">
          Your current appearance, Homepage and navigation choices are stored locally on this device.
        </div>
      </div>
    `
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
          <div><span>Database</span><strong>Not connected</strong></div>
        </div>
      </div>
    `
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
        await openAccount(appConfig);
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
