let navigationItems = [];
let activePageCleanup = null;
let routeChangeCallback = null;
let appName = "Frever";

function normaliseRoute(value) {
  return value.replace(/^#\/?/, "").trim();
}

function findRoute(route) {
  return navigationItems.find(item => item.id === route) ?? navigationItems[0];
}

async function fetchText(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.text();
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pageTitleMarkup(page, metadata) {
  const showTitle = metadata.showTitle !== false && page.id !== "home";
  if (!showTitle) return "";

  return `
    <section class="page-title-block page-title-only">
      <h1>${escapeHtml(metadata.title || page.label)}</h1>
    </section>`;
}

async function renderRoute(route) {
  const page = findRoute(route);
  const content = document.querySelector("#page-content");

  if (!content) throw new Error("Page content container was not found.");

  if (activePageCleanup) {
    try {
      await activePageCleanup();
    } catch (error) {
      console.warn("Page cleanup failed", error);
    }
    activePageCleanup = null;
  }

  content.setAttribute("aria-busy", "true");
  content.innerHTML = `
    <div class="loading-state" role="status" aria-live="polite">
      <span class="loading-spinner" aria-hidden="true"></span>
      <span>Loading ${escapeHtml(page.label)}…</span>
    </div>`;

  const base = `./Pages/${page.folder}/${page.file}`;

  try {
    const [html, metadata, module] = await Promise.all([
      fetchText(`${base}.html`),
      fetchJson(`${base}.json`),
      import(new URL(`../Pages/${page.folder}/${page.file}.js`, import.meta.url).href)
    ]);

    content.innerHTML = `${pageTitleMarkup(page, metadata)}${html}`;
    content.dataset.page = page.id;
    document.title = `${metadata.title} · ${appName}`;

    if (typeof module.init === "function") {
      const cleanup = await module.init({
        page,
        metadata,
        navigate: Router.navigate
      });
      if (typeof cleanup === "function") activePageCleanup = cleanup;
    }

    content.setAttribute("aria-busy", "false");
    content.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    routeChangeCallback?.(page);
  } catch (error) {
    console.error(error);
    content.innerHTML = `
      <section class="page-section error-panel">
        <p class="eyebrow">Page error</p>
        <h1>This page could not be loaded</h1>
        <p>${escapeHtml(error.message)}</p>
        <button class="button button-primary" type="button" data-retry-route="${escapeHtml(page.id)}">Try again</button>
      </section>`;
    content.querySelector("[data-retry-route]")?.addEventListener("click", () => renderRoute(page.id));
    content.setAttribute("aria-busy", "false");
  }
}

function handleHashChange() {
  const route = normaliseRoute(window.location.hash) || navigationItems[0]?.id;
  renderRoute(route);
}

export const Router = {
  init(items, onRouteChange, appConfig = {}) {
    appName = appConfig.appName || "Frever";
    navigationItems = [...items].sort((a, b) => a.position - b.position);
    routeChangeCallback = onRouteChange;
    window.addEventListener("hashchange", handleHashChange);

    if (!window.location.hash) {
      window.history.replaceState(null, "", `#${navigationItems[0].id}`);
    }
    handleHashChange();
  },

  navigate(route) {
    const target = findRoute(route);
    if (normaliseRoute(window.location.hash) === target.id) {
      renderRoute(target.id);
      return;
    }
    window.location.hash = target.id;
  },

  getCurrentRoute() {
    return normaliseRoute(window.location.hash);
  }
};
