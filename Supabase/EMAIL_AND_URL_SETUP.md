# Supabase authentication setup for Frever Template v0.2.3

The app code is ready, but Supabase must be told which URLs and email links to use.

## 1. URL Configuration

Open:

`Supabase Dashboard → Authentication → URL Configuration`

Set the Site URL to:

`https://staffybear.github.io/Frever-Template/`

Add these exact Redirect URLs:

- `https://staffybear.github.io/Frever-Template/confirm-email.html`
- `https://staffybear.github.io/Frever-Template/reset-password.html`

Optional for local testing:

- `http://localhost:8000/confirm-email.html`
- `http://localhost:8000/reset-password.html`

## 2. Confirm signup email template

Open:

`Supabase Dashboard → Authentication → Email Templates → Confirm signup`

Use this link in the email body:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">
  Confirm email address
</a>
```

A complete simple template is:

```html
<h2>Confirm your Frever email address</h2>
<p>Open Frever and press the confirmation button to finish creating your account.</p>
<p>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">
    Confirm email address
  </a>
</p>
<p>If you did not create a Frever account, you can ignore this email.</p>
```

## 3. Reset password email template

Open:

`Supabase Dashboard → Authentication → Email Templates → Reset password`

Use this link in the email body:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">
  Reset password
</a>
```

A complete simple template is:

```html
<h2>Reset your Frever password</h2>
<p>Open the secure Frever password-reset page.</p>
<p>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">
    Reset password
  </a>
</p>
<p>If you did not request a password reset, you can ignore this email.</p>
```

## Why the extra confirmation button exists

The email links open a Frever page first. The one-time token is not submitted to Supabase until the person presses Confirm or Continue. This helps prevent email security scanners from consuming a one-time link before the user opens it.
