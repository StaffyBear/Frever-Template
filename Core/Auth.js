// Authentication intentionally remains disconnected in template v0.1.
// Supabase sign-in, registration, reset-password and session handling
// will be added after the app shell has been tested.

export const Auth = {
  isEnabled: false,
  getCurrentUser() {
    return null;
  }
};
