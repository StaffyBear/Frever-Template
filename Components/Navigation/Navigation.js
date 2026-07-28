import { Storage } from "../../Core/Storage.js";

const ICONS = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/></svg>`,
  list: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v3H5zm0 5.5h14v3H5zM5 16h14v3H5z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16v2H2V3h2zm3-2H5v-5h2zm5 0H9V7h3zm5 0h-3V10h3zm4 0h-2V4h2z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.1 13a7.6 7.6 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.7-1L14.7 3h-4l-.4 3.1a7 7 0 0 0-1.7 1l-2.4-1-2 3.4L6.2 11a7.6 7.6 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.7 1l.4 3.1h4l.4-3.1a7 7 0 0 0 1.7-1l2.4 1 2-3.4zM12.7 15.4a3.5 3.5 0 1 1-1.4-6.8 3.5 3.5 0 0 1 1.4 6.8"/></svg>`
};

let targetElement = null;
let allItems = [];
let navigateTo = null;
let activeRoute = null;
let navigationListenerAdded = false;

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

function defaultMiddleButtons(items) {
  return items
    .filter(item => !item.fixed && item.showInNavigation !== false)
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
    .map(item => item.id);
}

function visibleItems() {
  const home = allItems.find(item => item.id === "home");
  const settings = allItems.find(item => item.id === "settings");
  const defaults = defaultMiddleButtons(allItems);
  const storedValue = Storage.get("navigationButtons", defaults);
  const stored = Array.isArray(storedValue) ? storedValue : defaults;
  const validIds = stored.filter(id => allItems.some(item => item.id === id && !item.fixed && item.showInNavigation !== false));
  const selectedIds = validIds.length === 3 ? validIds : defaults;
  const middle = allItems
    .filter(item => selectedIds.includes(item.id))
    .sort((a, b) => a.position - b.position);

  return [home, ...middle, settings].filter(Boolean);
}

function render() {
  if (!targetElement) return;
  const inner = targetElement.querySelector("[data-navigation-items]");
  if (!inner) return;

  inner.innerHTML = visibleItems().map(item => `
    <button class="nav-item" type="button" data-route="${item.id}" aria-label="${item.label}">
      <span class="nav-icon">${ICONS[item.icon] ?? ICONS.grid}</span>
      <span class="nav-label">${item.label}</span>
    </button>`
  ).join("");

  Navigation.setActive(activeRoute);
}

export const Navigation = {
  async mount(target, items, navigate) {
    targetElement = target;
    allItems = [...items];
    navigateTo = navigate;

    target.innerHTML = await fetchText("./Components/Navigation/Navigation.html");
    target.querySelector("[data-navigation-items]").addEventListener("click", event => {
      const button = event.target.closest("[data-route]");
      if (button) navigateTo(button.dataset.route);
    });

    if (!navigationListenerAdded) {
      window.addEventListener("frever:navigation-changed", render);
      navigationListenerAdded = true;
    }

    render();
  },

  setActive(route) {
    activeRoute = route;
    document.querySelectorAll(".nav-item").forEach(item => {
      const isActive = item.dataset.route === route;
      item.classList.toggle("is-active", isActive);
      if (isActive) item.setAttribute("aria-current", "page");
      else item.removeAttribute("aria-current");
    });
  },

  refresh() {
    render();
  }
};
