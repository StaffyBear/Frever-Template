import { Theme } from "./Theme.js";
import { Router } from "./Router.js";
import { Header } from "../Components/Header/Header.js";
import { Navigation } from "../Components/Navigation/Navigation.js";
import { Storage } from "./Storage.js";
import { Auth } from "./Auth.js";
import { Database } from "./Database.js";
import { Modal } from "../Components/Modal/Modal.js";

const BUILD_VERSION = "0.2.2";
let authSyncInProgress = false;
let shellMounted = false;
let authenticationCleanup = null;
let appConfig = null;
let navigationConfig = null;

async function loadJson(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}v=${BUILD_VERSION}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function fetchText(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}v=${BUILD_VERSION}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
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

function applyAppIdentity(config) {
  document.title = config.appName;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", config.description);
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

function showOnly(target) {
  const shell = document.querySelector("#app");
  const authGate = document.querySelector("#auth-gate");
  const showApp = target === "app";

  shell.hidden = !showApp;
  shell.setAttribute("aria-hidden", String(!showApp));
  authGate.hidden = showApp;
  authGate.setAttribute("aria-hidden", String(showApp));
}

async function mountAuthentication() {
  const authGate = document.querySelector("#auth-gate");
  const content = document.querySelector("#auth-gate-content");
  showOnly("auth");

  if (authenticationCleanup) {
    try { await authenticationCleanup(); } catch (error) { console.warn(error); }
    authenticationCleanup = null;
  }

  authGate.setAttribute("aria-busy", "true");
  const versionQuery = `?v=${encodeURIComponent(appConfig.version || BUILD_VERSION)}`;
  const [html, module] = await Promise.all([
    fetchText("./Pages/Authentication/Authentication.html"),
    import(`${new URL("../Pages/Authentication/Authentication.js", import.meta.url).href}${versionQuery}`)
  ]);

  content.innerHTML = html;
  if (typeof module.init === "function") {
    const cleanup = await module.init({ root: content, appConfig });
    if (typeof cleanup === "function") authenticationCleanup = cleanup;
  }

  authGate.setAttribute("aria-busy", "false");
  document.title = `Sign in · ${appConfig.appName}`;
}

async function mountAppShell() {
  if (!shellMounted) {
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

    shellMounted = true;
  }

  if (authenticationCleanup) {
    try { await authenticationCleanup(); } catch (error) { console.warn(error); }
    authenticationCleanup = null;
  }

  showOnly("app");
  document.querySelector("#app").dataset.ready = "true";
  document.querySelector("#app").setAttribute("aria-busy", "false");
  await syncSignedInPreferences();
}

async function handleAuthenticationState(user) {
  if (user) {
    await mountAppShell();
    return;
  }

  Modal.close("signed-out");
  if (window.location.hash && window.location.hash !== "#home") {
    window.history.replaceState(null, "", "#home");
  }
  await mountAuthentication();
}

async function startApp() {
  const shell = document.querySelector("#app");
  const authGate = document.querySelector("#auth-gate");

  try {
    [appConfig, navigationConfig] = await Promise.all([
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

    if (!Auth.isEnabled()) {
      throw new Error("Supabase authentication must be enabled before this app can be used.");
    }

    window.addEventListener("frever:auth-changed", event => {
      handleAuthenticationState(event.detail?.user ?? null).catch(error => {
        console.error("Authentication state change failed", error);
      });
    });

    await handleAuthenticationState(Auth.getCurrentUser());
    registerServiceWorker(appConfig.version);
  } catch (error) {
    console.error(error);
    showOnly("auth");
    document.querySelector("#auth-gate-content").innerHTML = `
      <section class="authentication-page">
        <div class="authentication-card error-panel">
          <p class="eyebrow">Template error</p>
          <h1>The app could not start</h1>
          <p>${String(error.message || error)}</p>
          <p class="muted">Run this project through a web server rather than opening index.html directly.</p>
        </div>
      </section>`;
    authGate.setAttribute("aria-busy", "false");
    shell.setAttribute("aria-busy", "false");
  }
}

startApp();
