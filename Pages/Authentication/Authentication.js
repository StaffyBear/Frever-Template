import { Auth } from "../../Core/Auth.js";

async function loadJson(path) {
  const version = window.FREVER_APP_VERSION;
  const versionedPath = version ? `${path}?v=${encodeURIComponent(version)}` : path;
  const response = await fetch(versionedPath, { cache: "no-store" });
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

function statusMarkup(message, type = "info") {
  if (!message) return "";
  return `<div class="form-status form-status-${type}" role="status">${escapeHtml(message)}</div>`;
}

function setBusy(form, busy) {
  form.querySelectorAll("button, input").forEach(control => {
    control.disabled = busy;
  });
  form.setAttribute("aria-busy", String(busy));
}

function providerButton(provider, label) {
  return `<button class="button button-secondary oauth-button" type="button" data-oauth-provider="${provider}">${label}</button>`;
}

function providerMarkup(providers) {
  const buttons = [
    providers.google ? providerButton("google", "Continue with Google") : "",
    providers.microsoft ? providerButton("azure", "Continue with Microsoft") : "",
    providers.apple ? providerButton("apple", "Continue with Apple") : ""
  ].filter(Boolean).join("");

  if (!buttons) return "";
  return `<div class="oauth-stack">${buttons}</div><div class="auth-divider"><span>or use email</span></div>`;
}

function signInMarkup(providers, message = "", statusType = "info", email = "") {
  return `
    <div class="auth-page-copy">
      <h2>Sign in</h2>
      <p>Use the same Frever account across all Frever apps.</p>
    </div>
    ${statusMarkup(message, statusType)}
    ${providerMarkup(providers)}
    <form class="form-stack" data-auth-form="signin">
      <label class="form-field">
        <span>Email address</span>
        <input name="email" type="email" autocomplete="email" required value="${escapeHtml(email)}">
      </label>
      <label class="form-field">
        <span>Password</span>
        <input name="password" type="password" autocomplete="current-password" required>
      </label>
      <button class="button button-primary button-full" type="submit">Sign in</button>
    </form>
    <p class="auth-switch-copy">New to Frever? <button class="text-button" type="button" data-auth-view="signup">Create an account</button></p>`;
}

function signUpMarkup(providers, message = "", statusType = "info", email = "") {
  return `
    <div class="auth-page-copy">
      <h2>Create account</h2>
      <p>Your account will work across Frever apps.</p>
    </div>
    ${statusMarkup(message, statusType)}
    ${providerMarkup(providers)}
    <form class="form-stack" data-auth-form="signup">
      <label class="form-field">
        <span>Email address</span>
        <input name="email" type="email" autocomplete="email" required value="${escapeHtml(email)}">
      </label>
      <label class="form-field">
        <span>Password</span>
        <input name="password" type="password" autocomplete="new-password" minlength="8" required>
      </label>
      <label class="form-field">
        <span>Confirm password</span>
        <input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required>
      </label>
      <button class="button button-primary button-full" type="submit">Create account</button>
    </form>
    <p class="auth-switch-copy">Already registered? <button class="text-button" type="button" data-auth-view="signin">Sign in</button></p>`;
}

export async function init({ root, appConfig }) {
  const panel = root.querySelector("[data-authentication-panel]");
  const logo = root.querySelector("[data-auth-logo]");
  const name = root.querySelector("[data-auth-app-name]");
  if (!panel) throw new Error("Authentication panel was not found.");

  if (logo) {
    logo.src = appConfig.logo;
    logo.alt = `${appConfig.appName} logo`;
  }
  if (name) name.textContent = appConfig.appName;

  const providers = await loadJson("./Config/AuthProviders.json");
  let view = "signin";
  let lastEmail = "";

  const render = (message = "", statusType = "info") => {
    panel.innerHTML = view === "signup"
      ? signUpMarkup(providers, message, statusType, lastEmail)
      : signInMarkup(providers, message, statusType, lastEmail);
  };

  const clickHandler = async event => {
    const viewButton = event.target.closest("[data-auth-view]");
    if (viewButton) {
      view = viewButton.dataset.authView;
      render();
      return;
    }

    const providerButtonElement = event.target.closest("[data-oauth-provider]");
    if (!providerButtonElement) return;

    providerButtonElement.disabled = true;
    try {
      await Auth.signInWithOAuth(providerButtonElement.dataset.oauthProvider);
    } catch (error) {
      render(error.message || "Social sign-in could not be started.", "error");
    }
  };

  const submitHandler = async event => {
    const form = event.target.closest("[data-auth-form]");
    if (!form) return;
    event.preventDefault();

    // Read the values before disabling the form. Disabled inputs are excluded
    // from FormData, which previously made every submission appear empty.
    const values = Object.fromEntries(new FormData(form).entries());
    const email = String(values.email || "").trim();
    const password = String(values.password || "");
    lastEmail = email;

    setBusy(form, true);

    try {
      if (!email || !password) throw new Error("Enter your email address and password.");

      if (form.dataset.authForm === "signin") {
        await Auth.signIn({ email, password });
        return;
      }

      const confirmPassword = String(values.confirmPassword || "");
      if (password.length < 8) throw new Error("Password must contain at least 8 characters.");
      if (password !== confirmPassword) throw new Error("The passwords do not match.");

      const data = await Auth.signUp({ email, password });
      if (!data.session) {
        render(
          "Your account was created, but Supabase is requiring email confirmation. Turn off Confirm email while email delivery is disabled.",
          "error"
        );
      }
    } catch (error) {
      render(error.message || "Authentication failed.", "error");
    }
  };

  panel.addEventListener("click", clickHandler);
  panel.addEventListener("submit", submitHandler);
  render();

  return () => {
    panel.removeEventListener("click", clickHandler);
    panel.removeEventListener("submit", submitHandler);
  };
}
