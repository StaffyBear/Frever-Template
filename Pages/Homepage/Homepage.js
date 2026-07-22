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

export async function init({ navigate }) {
  const page = document.querySelector('[data-page="home"]');
  const grid = page?.querySelector("[data-home-tiles]");

  if (grid) {
    const navigation = await loadNavigation();
    const items = navigation.items
      .filter(item => item.id !== "home")
      .sort((a, b) => a.position - b.position);

    grid.innerHTML = items.map((item, index) => `
      <button class="home-menu-tile${index === 0 ? " is-featured" : ""}" type="button" data-open-page="${item.id}">
        <span class="home-menu-icon" aria-hidden="true">${ICONS[item.icon] ?? ICONS.grid}</span>
        <strong>${item.label}</strong>
      </button>
    `).join("");
  }

  const handler = event => {
    const button = event.target.closest("[data-open-page]");
    if (button) navigate(button.dataset.openPage);
  };

  page?.addEventListener("click", handler);
  return () => page?.removeEventListener("click", handler);
}
