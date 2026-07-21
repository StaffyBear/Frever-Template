import { Theme } from "../../Core/Theme.js";
import { showToast } from "../../Components/Toast/Toast.js";

async function loadAppConfig() {
  const response = await fetch("./Config/App.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load App.json");
  return response.json();
}

function renderAccentOptions(container, colours, currentAccent) {
  container.innerHTML = Object.entries(colours).map(([key, colour]) => `
    <button class="accent-option ${key === currentAccent ? "is-selected" : ""}" type="button" data-accent="${key}" aria-pressed="${key === currentAccent}">
      <span class="accent-swatch" style="--swatch:${colour.accent}"></span>
      <span>${colour.name}</span>
    </button>`).join("");
}

function updateSelectedStates(page) {
  const current = Theme.getCurrent();

  page.querySelectorAll("[data-accent]").forEach(button => {
    const selected = button.dataset.accent === current.accent;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  page.querySelectorAll("[data-appearance]").forEach(button => {
    const selected = button.dataset.appearance === current.appearance;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

export async function init() {
  const page = document.querySelector('[data-page="settings"]');
  const colours = Theme.getAccentColours();
  const current = Theme.getCurrent();
  const accentContainer = page.querySelector("[data-accent-options]");
  const appConfig = await loadAppConfig();

  renderAccentOptions(accentContainer, colours, current.accent);
  page.querySelector("[data-settings-app-name]").textContent = appConfig.appName;
  page.querySelector("[data-settings-version]").textContent = appConfig.version;
  updateSelectedStates(page);

  const clickHandler = event => {
    const accentButton = event.target.closest("[data-accent]");
    const appearanceButton = event.target.closest("[data-appearance]");
    const resetButton = event.target.closest("[data-reset-theme]");

    if (accentButton) {
      Theme.setAccent(accentButton.dataset.accent);
      updateSelectedStates(page);
      showToast("Accent colour updated", "success");
    }

    if (appearanceButton) {
      Theme.setAppearance(appearanceButton.dataset.appearance);
      updateSelectedStates(page);
      showToast("Appearance updated", "success");
    }

    if (resetButton) {
      Theme.reset();
      updateSelectedStates(page);
      showToast("Theme reset to app defaults", "success");
    }
  };

  page.addEventListener("click", clickHandler);
  return () => page.removeEventListener("click", clickHandler);
}
