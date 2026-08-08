const CACHE_NAME = "frever-template-v0.2.4.0";
const APP_FILES = [
  "./",
  "./index.html",
  "./confirm-email.html",
  "./reset-password.html",
  "./update.html",
  "./manifest.webmanifest",
  "./Styles/Theme.css",
  "./Styles/App.css",
  "./Styles/Components.css",
  "./Styles/Forms.css",
  "./Styles/Navigation.css",
  "./Styles/Pages.css",
  "./Styles/Responsive.css",
  "./Styles/Auth.css",
  "./Core/App.js",
  "./Core/Router.js",
  "./Core/Theme.js",
  "./Core/Storage.js",
  "./Core/Auth.js",
  "./Core/Database.js",
  "./Core/StandaloneAuthPage.js",
  "./Components/Header/Header.html",
  "./Components/Header/Header.json",
  "./Components/Header/Header.js",
  "./Components/Navigation/Navigation.html",
  "./Components/Navigation/Navigation.json",
  "./Components/Navigation/Navigation.js",
  "./Components/Toast/Toast.js",
  "./Components/Modal/Modal.html",
  "./Components/Modal/Modal.json",
  "./Components/Modal/Modal.js",
  "./Config/App.json",
  "./Config/Navigation.json",
  "./Config/Theme.json",
  "./Config/AccentColours.json",
  "./Config/Supabase.json",
  "./Config/AuthProviders.json",
  "./Pages/Homepage/Homepage.html",
  "./Pages/Homepage/Homepage.json",
  "./Pages/Authentication/Authentication.html",
  "./Pages/Authentication/Authentication.json",
  "./Pages/Authentication/Authentication.js",
  "./Pages/Homepage/Homepage.js",
  "./Pages/PageOne/PageOne.html",
  "./Pages/PageOne/PageOne.json",
  "./Pages/PageOne/PageOne.js",
  "./Pages/PageTwo/PageTwo.html",
  "./Pages/PageTwo/PageTwo.json",
  "./Pages/PageTwo/PageTwo.js",
  "./Pages/PageThree/PageThree.html",
  "./Pages/PageThree/PageThree.json",
  "./Pages/PageThree/PageThree.js",
  "./Pages/Settings/Settings.html",
  "./Pages/Settings/Settings.json",
  "./Pages/Settings/Settings.js",
  "./Pages/ConfirmEmail/ConfirmEmail.html",
  "./Pages/ConfirmEmail/ConfirmEmail.json",
  "./Pages/ConfirmEmail/ConfirmEmail.js",
  "./Pages/ResetPassword/ResetPassword.html",
  "./Pages/ResetPassword/ResetPassword.json",
  "./Pages/ResetPassword/ResetPassword.js",
  "./Assets/Icons/icon-192.png",
  "./Assets/Icons/icon-512.png",
  "./Assets/Logos/frever-mark.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.status === 200 && response.type !== "opaque") {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(event.request));
});
