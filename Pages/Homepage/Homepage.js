import { Storage } from "../../Core/Storage.js";

const ICONS = {
  home: "⌂",
  grid: "▦",
  list: "☷",
  chart: "▥",
  settings: "⚙"
};

async function loadNavigation() {
  const version = window.FREVER_APP_VERSION;
  const path = version
    ? `./Config/Navigation.json?v=${encodeURIComponent(version)}`
    : "./Config/Navigation.json";
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load Config/Navigation.json");
  return response.json();
}

function configurableHomeItems(items) {
  return items
    .filter(item => item.id !== "home" && item.id !== "settings" && item.showOnHome !== false)
    .sort((a, b) => a.position - b.position);
}

function defaultHomeTiles(items) {
  return configurableHomeItems(items).map(item => item.id);
}

function renderTiles(grid, items) {
  const defaults = defaultHomeTiles(items);
  const stored = Storage.get("homeTiles", defaults);
  const selected = Array.isArray(stored)
    ? stored.filter(id => defaults.includes(id))
    : defaults;

  // Clean up values saved by older template versions. Home and Settings are fixed.
  if (!Array.isArray(stored) || JSON.stringify(selected) !== JSON.stringify(stored)) {
    Storage.set("homeTiles", selected);
  }

  const settings = items.find(item => item.id === "settings");
  const visibleItems = [
    ...configurableHomeItems(items).filter(item => selected.includes(item.id)),
    ...(settings ? [settings] : [])
  ];

  grid.innerHTML = visibleItems.map(item => `
    <button class="home-menu-tile" type="button" data-open-page="${item.id}">
      <span class="home-menu-icon" aria-hidden="true">${ICONS[item.icon] ?? ICONS.grid}</span>
      <strong>${item.label}</strong>
    </button>`).join("");
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
