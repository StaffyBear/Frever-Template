import { Auth } from "../../Core/Auth.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function errorMarkup(message) {
  return `
    <span class="auth-result-icon auth-result-error" aria-hidden="true">!</span>
    <h1>We could not confirm this email</h1>
    <p>${escapeHtml(message)}</p>
    <form class="form-stack" data-resend-form>
      <label class="form-field">
        <span>Email address</span>
        <input type="email" name="email" autocomplete="email" required>
      </label>
      <button class="button button-primary" type="submit">Send a new confirmation email</button>
    </form>
    <div data-confirm-status></div>
    <a class="text-button" href="./#settings">Return to Frever</a>`;
}

export async function init() {
  const page = document.querySelector("[data-confirm-email-page]");
  const content = page.querySelector("[data-confirm-email-content]");
  const parameters = new URLSearchParams(window.location.search);
  const tokenHash = parameters.get("token_hash");
  const type = parameters.get("type");

  if (!tokenHash || type !== "email") {
    content.innerHTML = errorMarkup("This confirmation link is incomplete or invalid.");
  }

  page.addEventListener("click", async event => {
    const button = event.target.closest("[data-confirm-email-button]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "Confirming…";

    try {
      await Auth.verifyEmailToken(tokenHash);
      window.history.replaceState({}, document.title, window.location.pathname);
      content.innerHTML = `
        <span class="auth-result-icon auth-result-success" aria-hidden="true">✓</span>
        <h1>Email confirmed</h1>
        <p>Your Frever account is ready and you are now signed in.</p>
        <a class="button button-primary" href="./#home">Continue to Frever</a>`;
    } catch (error) {
      content.innerHTML = errorMarkup(error.message || "The link may have expired or already been used.");
    }
  });

  page.addEventListener("submit", async event => {
    const form = event.target.closest("[data-resend-form]");
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector("button");
    const status = page.querySelector("[data-confirm-status]");
    button.disabled = true;
    try {
      const email = String(new FormData(form).get("email") || "").trim();
      await Auth.resendConfirmation(email);
      status.innerHTML = '<div class="form-status form-status-success">A new confirmation email has been sent.</div>';
    } catch (error) {
      status.innerHTML = `<div class="form-status form-status-error">${escapeHtml(error.message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });
}
