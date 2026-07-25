import { Theme } from "./Theme.js";
import { Router } from "./Router.js";
import { Header } from "../Components/Header/Header.js";
import { Navigation } from "../Components/Navigation/Navigation.js";
import { Storage } from "./Storage.js";

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}

function applyAppIdentity(appConfig) {
  document.title = appConfig.appName;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", appConfig.description);
}

async function startApp() {
  const shell = document.querySelector("#app");

  try {
    const [appConfig, navigationConfig] = await Promise.all([
      loadJson("./Config/App.json"),
      loadJson("./Config/Navigation.json")
    ]);

    if (!Array.isArray(navigationConfig.items) || navigationConfig.items.length !== 5) {
      throw new Error("Navigation.json must contain exactly five items.");
    }

    Storage.setNamespace(appConfig.appCode);
    applyAppIdentity(appConfig);
    await Theme.init();
    await Header.mount(document.querySelector("#app-header"), appConfig);
    await Navigation.mount(
      document.querySelector("#bottom-navigation"),
      navigationConfig.items,
      Router.navigate
    );

    Router.init(navigationConfig.items, page => {
      Header.setPage(page);
      Navigation.setActive(page.id);
    }, appConfig);

    shell.dataset.ready = "true";
    shell.setAttribute("aria-busy", "false");
    registerServiceWorker();
  } catch (error) {
    console.error(error);
    document.querySelector("#page-content").innerHTML = `
      <section class="page-section error-panel">
        <p class="eyebrow">Template error</p>
        <h1>The app could not start</h1>
        <p>${error.message}</p>
        <p class="muted">Run this project through a web server rather than opening index.html directly.</p>
      </section>`;
    shell.setAttribute("aria-busy", "false");
  }
}

startApp();
