# Frever App Template v0.2.0

A clean reusable Frever shell with Supabase email/password authentication.

## Added in v0.2.0

- Create account with display name, email and password.
- Email confirmation through a dedicated branded Frever page.
- Sign in, persistent browser session and sign out.
- Forgotten-password email and dedicated reset page.
- Profile display name stored in `frever_profiles`.
- Appearance, Homepage tiles and navigation choices synchronised through `frever_app_settings` after sign-in.
- Account, Back up and About Settings pop-ups now show live Supabase status.
- The browser uses the Supabase publishable key only. No secret or service-role key is included.

## Required setup order

1. Run `Supabase/002_frever_auth_and_preferences.sql` in the Supabase SQL Editor.
2. Follow `Supabase/EMAIL_AND_URL_SETUP.md` exactly.
3. Upload all v0.2.0 files over the current GitHub repository.
4. Wait for GitHub Pages to deploy.
5. Open `update.html` once to clear the previous app cache.
6. Test account creation using an email address you can access.

## Supabase configuration

The public browser connection is stored in:

`Config/Supabase.json`

The current template uses:

- Project URL: `https://supvcezvctjquoqkvyhy.supabase.co`
- A Supabase publishable key
- Production redirect base: `https://staffybear.github.io/Frever-Template/`

When copying the template to a real app, update `authRedirectBaseUrl` to that app's final address and add its confirmation/reset URLs to the Supabase allow list.

## Authentication pages

The two public entry pages are:

- `confirm-email.html`
- `reset-password.html`

Their actual page files remain in the agreed structure:

```text
Pages/
├── ConfirmEmail/
│   ├── ConfirmEmail.html
│   ├── ConfirmEmail.json
│   └── ConfirmEmail.js
└── ResetPassword/
    ├── ResetPassword.html
    ├── ResetPassword.json
    └── ResetPassword.js
```

They do not appear on the Homepage or bottom navigation.

## Shared settings stored in Supabase

Each signed-in user's row in `frever_app_settings` contains JSON similar to:

```json
{
  "appearance": "system",
  "homeTiles": ["page-one", "page-two", "page-three"],
  "navigationButtons": ["page-one", "page-two", "page-three"]
}
```

Passwords are managed by Supabase Auth and never appear in the editable Frever tables.

## Local testing

Run through a web server:

```bash
python -m http.server 8000
```

Add the local confirmation and reset URLs listed in `Supabase/EMAIL_AND_URL_SETUP.md` before testing email links locally.
