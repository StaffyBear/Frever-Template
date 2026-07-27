import { Theme } from "./Theme.js";
import { Router } from "./Router.js";
import { Header } from "../Components/Header/Header.js";
import { Navigation } from "../Components/Navigation/Navigation.js";
import { Storage } from "./Storage.js";
import { Auth } from "./Auth.js";
import { Database } from "./Database.js";

const BUILD_VERSION = "0.2.0";
let authSyncInProgress = false;

async function loadJson(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}v=${BUILD_VERSION}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function registerServiceWorker(version) {
  if (!("serviceWorker" in navigator)) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloadingForUpdate = false;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register(
      `./service-worker.js?v=${encodeURIComponent(version)}`,
      { updateViaCache: "none" }
    );
    await registration.update();
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}

function applyAppIdentity(appConfig) {
  document.title = appConfig.appName;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", appConfig.description);
}

async function syncSignedInPreferences() {
  if (authSyncInProgress || !Auth.getCurrentUser() || !Database.isEnabled()) return;
  authSyncInProgress = true;
  try {
    await Database.syncUserPreferences();
  } catch (error) {
    console.warn("Could not synchronise Frever settings", error);
    window.dispatchEvent(new CustomEvent("frever:settings-sync-error", {
      detail: { error }
    }));
  } finally {
    authSyncInProgress = false;
  }
}

async function startApp() {
  const shell = document.querySelector("#app");

  try {
    const [appConfig, navigationConfig] = await Promise.all([
      loadJson("./Config/App.json"),
      loadJson("./Config/Navigation.json")
    ]);

    if (!Array.isArray(navigationConfig.items) || navigationConfig.items.length < 5) {
      throw new Error("Navigation.json must contain Home, Settings and at least three app pages.");
    }

    if (!navigationConfig.items.some(item => item.id === "home") ||
        !navigationConfig.items.some(item => item.id === "settings")) {
      throw new Error("Navigation.json must contain fixed Home and Settings pages.");
    }

    window.FREVER_APP_VERSION = appConfig.version || BUILD_VERSION;
    Storage.setNamespace(appConfig.appCode);
    applyAppIdentity(appConfig);

    await Theme.init();
    await Auth.init();
    Database.init({
      supabaseClient: Auth.getClient(),
      code: appConfig.appCode
    });

    await syncSignedInPreferences();

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

    window.addEventListener("frever:auth-changed", event => {
      if (event.detail?.user) syncSignedInPreferences();
    });

    shell.dataset.ready = "true";
    shell.setAttribute("aria-busy", "false");
    registerServiceWorker(appConfig.version);
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
