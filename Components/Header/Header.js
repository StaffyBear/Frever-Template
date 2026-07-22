async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

export const Header = {
  async mount(target, appConfig) {
    target.innerHTML = await fetchText("./Components/Header/Header.html");

    const appName = target.querySelector("[data-app-name]");
    const appDescription = target.querySelector("[data-app-description]");

    if (appName) appName.textContent = appConfig.appName;
    if (appDescription) appDescription.textContent = appConfig.description;
  },

  setPage() {
    // The compact app header remains consistent across every page.
    // Page titles are displayed within each page's own HTML file.
  }
};
