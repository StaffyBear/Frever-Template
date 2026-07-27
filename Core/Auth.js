let config = null;
let client = null;
let currentSession = null;
let authSubscription = null;
let initialized = false;

async function loadConfig() {
  const version = window.FREVER_APP_VERSION || "0.2.0";
  const response = await fetch(`./Config/Supabase.json?v=${encodeURIComponent(version)}`, {
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Could not load Config/Supabase.json");
  return response.json();
}

function requireClient() {
  if (!client) throw new Error("Supabase is not connected.");
  return client;
}

function normaliseBaseUrl(value) {
  const url = new URL(value, window.location.href);
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  url.hash = "";
  url.search = "";
  return url.href;
}

function redirectUrl(path) {
  const base = config?.authRedirectBaseUrl
    ? normaliseBaseUrl(config.authRedirectBaseUrl)
    : new URL("./", window.location.href).href;
  return new URL(path, base).href;
}

function emitAuthChange(event = "INITIAL_SESSION") {
  window.dispatchEvent(new CustomEvent("frever:auth-changed", {
    detail: {
      event,
      session: currentSession,
      user: currentSession?.user ?? null
    }
  }));
}

export const Auth = {
  async init() {
    if (initialized) return this.getState();

    config = await loadConfig();
    if (!config.enabled) {
      initialized = true;
      return this.getState();
    }

    if (!window.supabase?.createClient) {
      throw new Error("The Supabase browser library could not be loaded.");
    }

    if (!config.projectUrl || !config.publishableKey) {
      throw new Error("Supabase projectUrl and publishableKey are required.");
    }

    client = window.supabase.createClient(config.projectUrl, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "implicit"
      }
    });

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    currentSession = data.session;

    const authState = client.auth.onAuthStateChange((event, session) => {
      currentSession = session;
      emitAuthChange(event);
    });
    authSubscription = authState.data.subscription;
    initialized = true;
    return this.getState();
  },

  destroy() {
    authSubscription?.unsubscribe?.();
    authSubscription = null;
    initialized = false;
  },

  isEnabled() {
    return Boolean(config?.enabled && client);
  },

  getClient() {
    return client;
  },

  getConfig() {
    return config ? structuredClone(config) : null;
  },

  getSession() {
    return currentSession;
  },

  getCurrentUser() {
    return currentSession?.user ?? null;
  },

  getState() {
    return {
      enabled: Boolean(config?.enabled && client),
      session: currentSession,
      user: currentSession?.user ?? null
    };
  },

  getConfirmEmailUrl() {
    return redirectUrl(config.confirmEmailPath || "confirm-email.html");
  },

  getResetPasswordUrl() {
    return redirectUrl(config.resetPasswordPath || "reset-password.html");
  },

  async signUp({ email, password, displayName }) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: this.getConfirmEmailUrl(),
        data: {
          display_name: displayName?.trim() || undefined
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn({ email, password }) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentSession = data.session;
    return data;
  },

  async signOut() {
    const supabaseClient = requireClient();
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    currentSession = null;
  },

  async requestPasswordReset(email) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: this.getResetPasswordUrl()
    });
    if (error) throw error;
    return data;
  },

  async resendConfirmation(email) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: this.getConfirmEmailUrl()
      }
    });
    if (error) throw error;
    return data;
  },

  async verifyEmailToken(tokenHash) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email"
    });
    if (error) throw error;
    currentSession = data.session;
    return data;
  },

  async verifyRecoveryToken(tokenHash) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery"
    });
    if (error) throw error;
    currentSession = data.session;
    return data;
  },

  async updatePassword(password) {
    const supabaseClient = requireClient();
    const { data, error } = await supabaseClient.auth.updateUser({ password });
    if (error) throw error;
    return data;
  }
};
