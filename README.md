# Frever App Template v0.2.4

A reusable Frever shell with a required Supabase account session.

## Authentication flow

- Signed-out users see a dedicated Sign in / Create account page.
- The app header, Homepage, pages, Settings and bottom navigation remain hidden until sign-in succeeds.
- Registration uses email, password and password confirmation only.
- The Account Settings tile opens a pop-up for optional profile details.
- The Sign out Settings tile is always available while inside the app.
- Signing out returns the user to the Sign in / Create account page.
- Sessions persist through Supabase Auth.

## Temporary no-email setup

No new SQL migration is required for v0.2.3.

In Supabase open **Authentication → Sign In / Providers → Email** and confirm:

1. Email provider is enabled.
2. New user sign-ups are allowed.
3. **Confirm email** is disabled while custom email delivery is deferred.

Password-reset controls remain hidden until SMTP/email delivery is configured.

## Page structure

The public authentication screen follows the same page-file convention:

```text
Pages/
└── Authentication/
    ├── Authentication.html
    ├── Authentication.json
    └── Authentication.js
```

It is not part of `Config/Navigation.json`, the Homepage tiles or bottom navigation.

## Social providers

`Config/AuthProviders.json` contains prepared switches for Google, Microsoft and Apple. Leave a provider set to `false` until its OAuth application and Supabase provider configuration are complete.

## Upload

1. Upload all v0.2.4 files over the current GitHub repository.
2. Wait for GitHub Pages to finish deploying.
3. Open `update.html` once to clear the previous service-worker cache.
4. Test registration, sign out and sign in.

Passwords are managed by Supabase Auth and never appear in the editable Frever tables.

## v0.2.4 visual update

- Lightened the dark-mode page background so the header, page and tiles are visually distinct.
- Added colourful configurable Homepage tile icons through `Config/Navigation.json`.
- Increased Homepage tile height and icon prominence.
- No SQL changes are required.
