import { Auth } from "../../Core/Auth.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetRequestMarkup(message) {
  return `
    <span class="auth-result-icon auth-result-error" aria-hidden="true">!</span>
    <h1>We could not open this reset link</h1>
    <p>${escapeHtml(message)}</p>
    <form class="form-stack" data-new-reset-form>
      <label class="form-field">
        <span>Email address</span>
        <input type="email" name="email" autocomplete="email" required>
      </label>
      <button class="button button-primary" type="submit">Send a new reset email</button>
    </form>
    <div data-reset-status></div>
    <a class="text-button" href="./#settings">Return to Frever</a>`;
}

function passwordFormMarkup() {
  return `
    <span class="auth-result-icon" aria-hidden="true">🔒</span>
    <h1>Choose a new password</h1>
    <form class="form-stack" data-password-form>
      <label class="form-field">
        <span>New password</span>
        <input type="password" name="password" autocomplete="new-password" minlength="8" required>
      </label>
      <label class="form-field">
        <span>Confirm new password</span>
        <input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required>
      </label>
      <button class="button button-primary" type="submit">Save new password</button>
    </form>
    <div data-password-status></div>`;
}

export async function init() {
  const page = document.querySelector("[data-reset-password-page]");
  const content = page.querySelector("[data-reset-password-content]");
  const parameters = new URLSearchParams(window.location.search);
  const tokenHash = parameters.get("token_hash");
  const type = parameters.get("type");

  if (!tokenHash || type !== "recovery") {
    content.innerHTML = resetRequestMarkup("This password-reset link is incomplete or invalid.");
  }

  page.addEventListener("click", async event => {
    const button = event.target.closest("[data-verify-recovery]");
    if (!button) return;
    button.disabled = true;
    button.textContent = "Checking…";

    try {
      await Auth.verifyRecoveryToken(tokenHash);
      window.history.replaceState({}, document.title, window.location.pathname);
      content.innerHTML = passwordFormMarkup();
    } catch (error) {
      content.innerHTML = resetRequestMarkup(error.message || "The link may have expired or already been used.");
    }
  });

  page.addEventListener("submit", async event => {
    const passwordForm = event.target.closest("[data-password-form]");
    if (passwordForm) {
      event.preventDefault();
      const button = passwordForm.querySelector("button");
      const status = page.querySelector("[data-password-status]");
      const values = Object.fromEntries(new FormData(passwordForm).entries());
      const password = String(values.password || "");
      button.disabled = true;
      try {
        if (password !== String(values.confirmPassword || "")) {
          throw new Error("The passwords do not match.");
        }
        await Auth.updatePassword(password);
        content.innerHTML = `
          <span class="auth-result-icon auth-result-success" aria-hidden="true">✓</span>
          <h1>Password updated</h1>
          <p>Your new password has been saved and you are signed in.</p>
          <a class="button button-primary" href="./#home">Continue to Frever</a>`;
      } catch (error) {
        status.innerHTML = `<div class="form-status form-status-error">${escapeHtml(error.message)}</div>`;
        button.disabled = false;
      }
      return;
    }

    const resetForm = event.target.closest("[data-new-reset-form]");
    if (!resetForm) return;
    event.preventDefault();
    const button = resetForm.querySelector("button");
    const status = page.querySelector("[data-reset-status]");
    button.disabled = true;
    try {
      const email = String(new FormData(resetForm).get("email") || "").trim();
      await Auth.requestPasswordReset(email);
      status.innerHTML = '<div class="form-status form-status-success">A new password-reset email has been sent.</div>';
    } catch (error) {
      status.innerHTML = `<div class="form-status form-status-error">${escapeHtml(error.message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });
}
