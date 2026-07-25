import { Storage } from "../../Core/Storage.js";

const ICONS = {
  home: "⌂",
  grid: "▦",
  list: "☷",
  chart: "▥",
  settings: "⚙"
};

async function loadNavigation() {
  const response = await fetch("./Config/Navigation.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load Config/Navigation.json");
  return response.json();
}

function defaultHomeTiles(items) {
  return items
    .filter(item => item.id !== "home" && item.showOnHome !== false)
    .sort((a, b) => a.position - b.position)
    .map(item => item.id);
}

function renderTiles(grid, items) {
  const defaults = defaultHomeTiles(items);
  const stored = Storage.get("homeTiles", defaults);
  const selected = Array.isArray(stored) ? stored : defaults;
  const visibleItems = items
    .filter(item => selected.includes(item.id))
    .sort((a, b) => a.position - b.position);

  if (!visibleItems.length) {
    grid.innerHTML = `
      <div class="empty-home-layout">
        <p>No Homepage tiles are selected.</p>
        <button class="button button-primary" type="button" data-open-page="settings">Open Settings</button>
      </div>`;
    return;
  }

  grid.innerHTML = visibleItems.map((item, index) => `
    <button class="home-menu-tile${index === 0 ? " is-featured" : ""}" type="button" data-open-page="${item.id}">
      <span class="home-menu-icon" aria-hidden="true">${ICONS[item.icon] ?? ICONS.grid}</span>
      <strong>${item.label}</strong>
    </button>
  `).join("");
}

export async function init({ navigate }) {
  const page = document.querySelector('[data-page="home"]');
  const grid = page?.querySelector("[data-home-tiles]");
  const navigation = await loadNavigation();

  if (grid) renderTiles(grid, navigation.items);

  const clickHandler = event => {
    const button = event.target.closest("[data-open-page]");
    if (button) navigate(button.dataset.openPage);
  };

  const layoutHandler = () => {
    if (grid) renderTiles(grid, navigation.items);
  };

  page?.addEventListener("click", clickHandler);
  window.addEventListener("frever:home-layout-changed", layoutHandler);

  return () => {
    page?.removeEventListener("click", clickHandler);
    window.removeEventListener("frever:home-layout-changed", layoutHandler);
  };
}
