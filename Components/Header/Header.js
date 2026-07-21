async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

export const Header = {
  async mount(target, appConfig) {
    target.innerHTML = await fetchText("./Components/Header/Header.html");
    const appName = target.querySelector("[data-app-name]");
    if (appName) appName.textContent = appConfig.appName;
  },

  setPage(page) {
    const title = document.querySelector("[data-page-title]");
    if (title) title.textContent = page.label;
  }
};
