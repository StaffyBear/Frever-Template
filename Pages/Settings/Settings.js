import { Theme } from "../../Core/Theme.js";
import { showToast } from "../../Components/Toast/Toast.js";

async function loadAppConfig() {
  const response = await fetch("./Config/App.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load App.json");
  return response.json();
}

function updateSelectedState(page) {
  const current = Theme.getCurrent();

  page.querySelectorAll("[data-appearance]").forEach(button => {
    const selected = button.dataset.appearance === current.appearance;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

export async function init() {
  const page = document.querySelector('[data-page="settings"]');
  const appConfig = await loadAppConfig();

  page.querySelector("[data-settings-app-name]").textContent = appConfig.appName;
  page.querySelector("[data-settings-version]").textContent = appConfig.version;
  updateSelectedState(page);

  const clickHandler = event => {
    const appearanceButton = event.target.closest("[data-appearance]");
    if (!appearanceButton) return;

    Theme.setAppearance(appearanceButton.dataset.appearance);
    updateSelectedState(page);
    showToast("Appearance updated", "success");
  };

  page.addEventListener("click", clickHandler);
  return () => page.removeEventListener("click", clickHandler);
}
