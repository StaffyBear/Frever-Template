import { Storage } from "./Storage.js";
import { Theme } from "./Theme.js";
import { Auth } from "./Auth.js";

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

async function loadText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

async function start() {
  const root = document.querySelector("#standalone-auth-app");
  try {
    const appConfig = await loadJson("./Config/App.json");
    window.FREVER_APP_VERSION = appConfig.version || "0.2.2";
    Storage.setNamespace(appConfig.appCode);
    await Theme.init();
    await Auth.init();

    document.title = `${root.dataset.pageTitle || "Account"} · ${appConfig.appName}`;
    root.querySelector("[data-brand-logo]").src = appConfig.logo;
    root.querySelector("[data-brand-name]").textContent = appConfig.appName;

    const folder = root.dataset.pageFolder;
    const file = root.dataset.pageFile;
    const base = `./Pages/${folder}/${file}`;
    const version = encodeURIComponent(window.FREVER_APP_VERSION);
    const [html, metadata, module] = await Promise.all([
      loadText(`${base}.html?v=${version}`),
      loadJson(`${base}.json?v=${version}`),
      import(`${new URL(`../Pages/${folder}/${file}.js`, import.meta.url).href}?v=${version}`)
    ]);

    const content = root.querySelector("[data-standalone-content]");
    content.innerHTML = html;
    document.title = `${metadata.title} · ${appConfig.appName}`;
    await module.init?.({ appConfig, metadata });
    root.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error(error);
    root.querySelector("[data-standalone-content]").innerHTML = `
      <section class="auth-action-card">
        <span class="auth-result-icon" aria-hidden="true">!</span>
        <h1>This page could not load</h1>
        <p>${String(error.message || error)}</p>
        <a class="button button-primary" href="./">Return to Frever</a>
      </section>`;
    root.setAttribute("aria-busy", "false");
  }
}

start();
