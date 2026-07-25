async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

export const Header = {
  async mount(target, appConfig) {
    target.innerHTML = await fetchText("./Components/Header/Header.html");

    const appName = target.querySelector("[data-app-name]");
    const appLogo = target.querySelector("[data-app-logo]");

    if (appName) appName.textContent = appConfig.appName;
    if (appLogo) {
      appLogo.src = appConfig.logo;
      appLogo.alt = `${appConfig.appName} logo`;
    }
  },

  setPage() {
    // The shared logo and app name remain visible on every page.
    // Each inner page supplies its own page title where needed.
  }
};
