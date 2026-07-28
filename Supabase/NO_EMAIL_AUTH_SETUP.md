# Frever v0.2.3 — authentication without email delivery

No new SQL is required for v0.2.3.

In Supabase open **Authentication → Sign In / Providers → Email** and confirm:

1. Email provider is enabled.
2. New user sign-ups are allowed.
3. **Confirm email** is disabled during this temporary development phase.

With Confirm email disabled, registration creates a session immediately and opens the app.

Password-reset controls are intentionally unavailable until custom SMTP is configured.
