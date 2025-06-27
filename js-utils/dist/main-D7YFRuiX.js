var q = /* @__PURE__ */ ((e) => (e.email = "email", e.profile = "profile", e.openid = "openid", e.offline_access = "offline", e))(q || {}), L = /* @__PURE__ */ ((e) => (e.none = "none", e.create = "create", e.login = "login", e))(L || {}), F = /* @__PURE__ */ ((e) => (e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e))(F || {}), J = /* @__PURE__ */ ((e) => (e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e))(J || {}), b = /* @__PURE__ */ ((e) => (e.logout = "logout", e.login = "login", e.register = "registration", e.token = "token", e.profile = "profile", e))(b || {}), S = /* @__PURE__ */ ((e) => (e[e.refreshToken = 0] = "refreshToken", e[e.cookie = 1] = "cookie", e))(S || {});
const E = (e) => {
  const r = (i) => btoa(i).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (e instanceof ArrayBuffer) {
    const i = new Uint8Array(e), a = String.fromCharCode(...i);
    return r(a);
  }
  const s = new TextEncoder().encode(e), n = String.fromCharCode(...s);
  return r(n);
}, P = (e = 28) => {
  if (crypto) {
    const r = new Uint8Array(e / 2);
    return crypto.getRandomValues(r), Array.from(r, B).join("");
  } else
    return H(e);
};
function B(e) {
  return e.toString(16).padStart(2, "0");
}
function H(e = 28) {
  const r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let t = "";
  const s = r.length;
  for (let n = 0; n < e; n++)
    t += r.charAt(Math.floor(Math.random() * s));
  return t;
}
const ne = (e) => {
  e = e.split("?")[1];
  const r = new URLSearchParams(e);
  return {
    accessToken: r.get("access_token"),
    idToken: r.get("id_token"),
    expiresIn: +(r.get("expires_in") || 0)
  };
}, U = (e) => e.replace(/\/$/, ""), G = (e, r = !1) => {
  const t = Array.isArray(e.audience) ? e.audience.join(" ") : e.audience || "", s = {
    login_hint: e.loginHint,
    is_create_org: e.isCreateOrg?.toString(),
    connection_id: e.connectionId,
    redirect_uri: e.redirectURL ? r ? e.redirectURL : U(e.redirectURL) : void 0,
    audience: t,
    scope: e.scope?.join(" ") || "email profile openid offline",
    prompt: e.prompt,
    lang: e.lang,
    org_code: e.orgCode,
    org_name: e.orgName,
    has_success_page: e.hasSuccessPage?.toString(),
    workflow_deployment_id: e.workflowDeploymentId,
    supports_reauth: e.supportsReauth?.toString(),
    plan_interest: e.planInterest,
    pricing_table_key: e.pricingTableKey
  };
  return Object.keys(s).forEach(
    (n) => s[n] === void 0 && delete s[n]
  ), s;
}, R = (e) => typeof e != "object" || e === null ? e : Array.isArray(e) ? e.map((r) => R(r)) : Object.fromEntries(
  Object.entries(e).map(([r, t]) => [
    r.replace(/_([a-z])/g, (s, n) => n.toUpperCase()),
    R(t)
  ])
), W = [
  // UTM tags
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  // Google Ads smart campaign tracking
  "gclid",
  "click_id",
  "hsa_acc",
  "hsa_cam",
  "hsa_grp",
  "hsa_ad",
  "hsa_src",
  "hsa_tgt",
  "hsa_kw",
  "hsa_mt",
  "hsa_net",
  "hsa_ver",
  // Marketing category
  "match_type",
  "keyword",
  "device",
  "ad_group_id",
  "campaign_id",
  "creative",
  "network",
  "ad_position",
  "fbclid",
  "li_fat_id",
  "msclkid",
  "twclid",
  "ttclid"
], oe = async (e, r = b.login, t, s) => {
  const n = `${e}/oauth2/auth`, i = T();
  if (t.reauthState)
    try {
      const f = R(
        JSON.parse(atob(t.reauthState))
      );
      t = {
        ...t,
        ...f
      }, delete t.reauthState;
    } catch (f) {
      const d = f instanceof Error ? f.message : "Unknown error";
      throw new Error(`Error handing reauth state: ${d}`);
    }
  if (!t.clientId)
    throw new Error("Error generating auth URL: Client ID missing");
  const a = {
    client_id: t.clientId,
    response_type: t.responseType || "code",
    ...G(t, s?.disableUrlSanitization)
  };
  t.state || (t.state = P(32)), i && i.setSessionItem(c.state, t.state), a.state = t.state, t.nonce || (t.nonce = P(16)), a.nonce = t.nonce, i && i.setSessionItem(c.nonce, t.nonce);
  let l = "";
  if (t.codeChallenge)
    a.code_challenge = t.codeChallenge;
  else {
    const { codeVerifier: f, codeChallenge: d } = await Z();
    l = f, i && i.setSessionItem(c.codeVerifier, f), a.code_challenge = d;
  }
  a.code_challenge_method = "S256", t.codeChallengeMethod && (a.code_challenge_method = t.codeChallengeMethod), !t.prompt && r === b.register && (a.prompt = L.create), t.properties && Object.keys(t.properties).forEach((f) => {
    if (!W.includes(f)) {
      console.warn("Unsupported Property for url generation: ", f);
      return;
    }
    const d = t.properties?.[f];
    d !== void 0 && (a[f] = d);
  });
  const u = new URLSearchParams(a).toString();
  return {
    url: new URL(`${n}?${u}`),
    state: a.state,
    nonce: a.nonce,
    codeChallenge: a.code_challenge,
    codeVerifier: l
  };
};
async function Z() {
  const e = P(52), r = new TextEncoder().encode(e);
  let t = "";
  if (!crypto)
    t = E(btoa(e));
  else {
    const s = await crypto.subtle.digest("SHA-256", r);
    t = E(s);
  }
  return { codeVerifier: e, codeChallenge: t };
}
let $;
function M(e, r) {
  if (A(), typeof window > "u")
    throw new Error("setRefreshTimer requires a browser environment");
  if (e <= 0)
    throw new Error("Timer duration must be positive");
  $ = window.setTimeout(
    r,
    Math.min(e * 1e3 - 1e4, 864e5)
  );
}
function A() {
  $ !== void 0 && (window.clearTimeout($), $ = void 0);
}
const y = {
  framework: "",
  frameworkVersion: "",
  sdkVersion: ""
}, D = async () => {
  await T()?.removeItems(
    c.state,
    c.nonce,
    c.codeVerifier
  );
}, ae = async ({
  urlParams: e,
  domain: r,
  clientId: t,
  redirectURL: s,
  autoRefresh: n = !1,
  onRefresh: i
}) => {
  const a = e.get("state"), l = e.get("code");
  if (!a || !l)
    return console.error("Invalid state or code"), {
      success: !1,
      error: "Invalid state or code"
    };
  const u = T();
  if (!u)
    return console.error("No active storage found"), {
      success: !1,
      error: "Authentication storage is not initialized"
    };
  (!y.framework || !y.frameworkVersion) && console.warn(
    "Framework and version not set. Please set the framework and version in the config object"
  );
  const f = await u.getSessionItem(c.state);
  if (a !== f)
    return console.error("Invalid state"), {
      success: !1,
      error: `Invalid state; supplied ${a}, expected ${f}`
    };
  const d = await u.getSessionItem(
    c.codeVerifier
  );
  if (d === null)
    return console.error("Code verifier not found"), {
      success: !1,
      error: "Code verifier not found"
    };
  const N = {
    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
  };
  y.framework && (N["Kinde-SDK"] = `${y.framework}/${y.sdkVersion}/${y.frameworkVersion}/Javascript`);
  const j = {
    method: "POST",
    ...!o.useInsecureForRefreshToken && x(r) ? {
      credentials: "include"
    } : {},
    headers: new Headers(N),
    body: new URLSearchParams({
      client_id: t,
      code: l,
      code_verifier: d,
      grant_type: "authorization_code",
      redirect_uri: s
    })
  };
  let w;
  A();
  try {
    if (w = await fetch(`${r}/oauth2/token`, j), !w?.ok) {
      const k = await w.text();
      return console.error("Token exchange failed:", w.status, k), {
        success: !1,
        error: `Token exchange failed: ${w.status} - ${k}`
      };
    }
  } catch (k) {
    return D(), console.error("Token exchange failed:", k), {
      success: !1,
      error: `Token exchange failed: ${k}`
    };
  }
  const h = await w.json(), z = p();
  z && z.setItems({
    [c.accessToken]: h.access_token,
    [c.idToken]: h.id_token,
    [c.refreshToken]: h.refresh_token
  }), (o.useInsecureForRefreshToken || !x(r)) && u.setSessionItem(c.refreshToken, h.refresh_token), n && M(h.expires_in, async () => {
    C({ domain: r, clientId: t, onRefresh: i });
  }), D();
  const V = ((k) => (k.search = "", k))(new URL(window.location.toString()));
  return window.history.replaceState(window.history.state, "", V), !h.access_token || !h.id_token || !h.refresh_token ? {
    success: !1,
    error: "No access token received"
  } : {
    success: !0,
    [c.accessToken]: h.access_token,
    [c.idToken]: h.id_token,
    [c.refreshToken]: h.refresh_token
  };
};
function Q(e) {
  const t = document.cookie.split("; ").find((s) => s.startsWith(`${e}=`));
  if (!t) return null;
  try {
    const s = t.split("=")[1];
    return s ? decodeURIComponent(s) : null;
  } catch (s) {
    return console.error(`Error parsing cookie ${e}:`, s), null;
  }
}
const X = "_kbrte", ie = async ({
  domain: e,
  clientId: r
}) => {
  if (!e)
    return {
      success: !1,
      error: "Domain is required for authentication check"
    };
  if (!r)
    return {
      success: !1,
      error: "Client ID is required for authentication check"
    };
  const t = x(e), s = o.useInsecureForRefreshToken;
  let n = null;
  return t && !s && (n = Q(X)), await C({
    domain: e,
    clientId: r,
    refreshType: n ? S.cookie : S.refreshToken
  });
}, x = (e) => !e.match(
  /^(?:https?:\/\/)?[a-zA-Z0-9][.-a-zA-Z0-9]*\.kinde\.com$/i
);
function _(e, r) {
  return r <= 0 ? [] : e.match(new RegExp(`.{1,${r}}`, "g")) || [];
}
var c = /* @__PURE__ */ ((e) => (e.accessToken = "accessToken", e.idToken = "idToken", e.refreshToken = "refreshToken", e.state = "state", e.nonce = "nonce", e.codeVerifier = "codeVerifier", e))(c || {});
class v {
  async setItems(r) {
    await Promise.all(
      Object.entries(r).map(
        ([t, s]) => this.setSessionItem(t, s)
      )
    );
  }
  async removeItems(...r) {
    await Promise.all(
      r.map((t) => this.removeSessionItem(t))
    );
  }
}
class ce extends v {
  memCache = {};
  /**
   * Clears all items from session store.
   * @returns {void}
   */
  async destroySession() {
    this.memCache = {};
  }
  /**
   * Sets the provided key-value store to the memory cache.
   * @param {string} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  async setSessionItem(r, t) {
    if (await this.removeSessionItem(r), typeof t == "string") {
      _(t, o.maxLength).forEach(
        (s, n) => {
          this.memCache[`${o.keyPrefix}${r}${n}`] = s;
        }
      );
      return;
    }
    this.memCache[`${o.keyPrefix}${String(r)}0`] = t;
  }
  /**
   * Gets the item for the provided key from the memory cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(r) {
    if (this.memCache[`${o.keyPrefix}${String(r)}0`] === void 0)
      return null;
    let t = "", s = 0, n = `${o.keyPrefix}${String(r)}${s}`;
    for (; this.memCache[n] !== void 0; )
      t += this.memCache[n], s++, n = `${o.keyPrefix}${String(r)}${s}`;
    return t;
  }
  /**
   * Removes the item for the provided key from the memory cache.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(r) {
    for (const t in this.memCache)
      t.startsWith(`${o.keyPrefix}${String(r)}`) && delete this.memCache[t];
  }
}
function I(e) {
  return new Promise((r, t) => {
    chrome.storage.local.get([e], function(s) {
      chrome.runtime.lastError ? t(void 0) : r(s[e]);
    });
  });
}
class le extends v {
  /**
   * Clears all items from session store.
   * @returns {void}
   */
  async destroySession() {
    await chrome.storage.local.clear();
  }
  /**
   * Sets the provided key-value store to the chrome.store.local.
   * @param {string} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  async setSessionItem(r, t) {
    if (await this.removeSessionItem(r), typeof t == "string") {
      _(t, o.maxLength).forEach(
        async (s, n) => {
          await chrome.storage.local.set({
            [`${o.keyPrefix}${r}${n}`]: s
          });
        }
      );
      return;
    }
    await chrome.storage.local.set({
      [`${o.keyPrefix}${r}0`]: t
    });
  }
  /**
   * Gets the item for the provided key from the chrome.store.local cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(r) {
    let t = "", s = 0, n = `${o.keyPrefix}${String(r)}${s}`;
    for (; await I(
      `${o.keyPrefix}${String(r)}${s}`
    ) !== void 0; )
      t += await I(n), s++, n = `${o.keyPrefix}${String(r)}${s}`;
    return t;
  }
  /**
   * Removes the item for the provided key from the chrome.store.local cache.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(r) {
    let t = 0;
    for (; await I(
      `${o.keyPrefix}${String(r)}${t}`
    ) !== void 0; )
      await chrome.storage.local.remove(
        `${o.keyPrefix}${String(r)}${t}`
      ), t++;
  }
}
class ue extends v {
  constructor() {
    super(), o.useInsecureForRefreshToken && console.warn("LocalStorage store should not be used in production");
  }
  internalItems = /* @__PURE__ */ new Set();
  /**
   * Clears all items from session store.
   * @returns {void}
   */
  async destroySession() {
    this.internalItems.forEach((r) => {
      this.removeSessionItem(r);
    });
  }
  /**
   * Sets the provided key-value store to the localStorage cache.
   * @param {V} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  async setSessionItem(r, t) {
    if (await this.removeSessionItem(r), this.internalItems.add(r), typeof t == "string") {
      _(t, o.maxLength).forEach(
        (s, n) => {
          localStorage.setItem(
            `${o.keyPrefix}${r}${n}`,
            s
          );
        }
      );
      return;
    }
    localStorage.setItem(
      `${o.keyPrefix}${r}0`,
      t
    );
  }
  /**
   * Gets the item for the provided key from the localStorage cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(r) {
    if (localStorage.getItem(`${o.keyPrefix}${r}0`) === null)
      return null;
    let t = "", s = 0, n = `${o.keyPrefix}${String(r)}${s}`;
    for (; localStorage.getItem(n) !== null; )
      t += localStorage.getItem(n), s++, n = `${o.keyPrefix}${String(r)}${s}`;
    return t;
  }
  /**
   * Removes the item for the provided key from the localStorage cache.
   * @param {V} itemKey
   * @returns {void}
   */
  async removeSessionItem(r) {
    let t = 0;
    for (; localStorage.getItem(
      `${o.keyPrefix}${String(r)}${t}`
    ) !== null; )
      localStorage.removeItem(
        `${o.keyPrefix}${String(r)}${t}`
      ), t++;
    this.internalItems.delete(r);
  }
}
class fe extends v {
  kvNamespace;
  defaultTtl;
  enableConsistencyChecks;
  consistencyRetries;
  consistencyDelayMs;
  constructor(r, t = {}) {
    super(), this.kvNamespace = r, this.defaultTtl = t.defaultTtl || 3600, this.enableConsistencyChecks = t.enableConsistencyChecks ?? !0, this.consistencyRetries = t.consistencyRetries ?? 3, this.consistencyDelayMs = t.consistencyDelayMs ?? 250, o.useInsecureForRefreshToken && console.warn("KvStorage: useInsecureForRefreshToken is enabled - consider security implications for refresh tokens in KV storage");
  }
  /**
   * Clears all items from session store.
   * @returns {void}
   */
  async destroySession() {
    try {
      const { keys: r } = await this.kvNamespace.list({
        prefix: o.keyPrefix
      });
      await Promise.all(
        r.map((t) => this.kvNamespace.delete(t.name))
      );
    } catch (r) {
      throw console.error("KvStorage: Failed to destroy session:", r), r;
    }
  }
  /**
   * Sets the provided key-value store to the KV storage with optional consistency verification.
   */
  async setSessionItem(r, t) {
    try {
      if (await this.removeSessionItem(r), typeof t == "string") {
        const s = _(t, o.maxLength);
        await Promise.all(
          s.map(
            (n, i) => this.kvNamespace.put(
              `${o.keyPrefix}${r}${i}`,
              n,
              { expirationTtl: this.defaultTtl }
            )
          )
        );
      } else {
        const s = typeof t == "object" ? JSON.stringify(t) : String(t);
        await this.kvNamespace.put(
          `${o.keyPrefix}${String(r)}0`,
          s,
          { expirationTtl: this.defaultTtl }
        );
      }
      this.enableConsistencyChecks && await this.waitForConsistency(r, t);
    } catch (s) {
      throw console.error(`KvStorage: Failed to set session item ${String(r)}:`, s), s;
    }
  }
  /**
   * Gets the item for the provided key from the KV storage with retry logic for eventual consistency.
   */
  async getSessionItem(r) {
    if (!this.enableConsistencyChecks)
      return this._getSessionItemOnce(r);
    for (let t = 0; t < this.consistencyRetries; t++) {
      const s = await this._getSessionItemOnce(r);
      if (s !== null || t === this.consistencyRetries - 1)
        return s;
      await this.delay(this.consistencyDelayMs * (t + 1));
    }
    return null;
  }
  /**
   * Internal method to get session item without retries
   */
  async _getSessionItemOnce(r) {
    try {
      const t = await this.kvNamespace.get(
        `${o.keyPrefix}${String(r)}0`
      );
      if (t === null)
        return null;
      let s = "", n = 0, i = t;
      for (; i !== null; )
        s += i, n++, i = await this.kvNamespace.get(
          `${o.keyPrefix}${String(r)}${n}`
        );
      return s;
    } catch (t) {
      return console.error(`KvStorage: Failed to get session item ${String(r)}:`, t), null;
    }
  }
  /**
   * Waits for write consistency by verifying the written value can be read back
   */
  async waitForConsistency(r, t) {
    const s = typeof t == "string" ? t : typeof t == "object" ? JSON.stringify(t) : String(t);
    for (let n = 0; n < this.consistencyRetries; n++) {
      if (await this._getSessionItemOnce(r) === s)
        return;
      n < this.consistencyRetries - 1 && await this.delay(this.consistencyDelayMs);
    }
    console.warn(`KvStorage: Consistency check failed for ${String(r)} after ${this.consistencyRetries} attempts`);
  }
  /**
   * Utility method for delays
   */
  delay(r) {
    return new Promise((t) => setTimeout(t, r));
  }
  /**
   * Sets multiple items with consistency verification
   */
  async setItems(r) {
    if (this.enableConsistencyChecks)
      for (const [t, s] of Object.entries(r))
        await this.setSessionItem(t, s);
    else
      await Promise.all(
        Object.entries(r).map(
          ([t, s]) => this.setSessionItem(t, s)
        )
      );
  }
  /**
   * Removes the item for the provided key from the KV storage.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(r) {
    try {
      const t = [];
      let s = 0;
      for (; ; ) {
        const n = `${o.keyPrefix}${String(r)}${s}`;
        if (await this.kvNamespace.get(n) === null)
          break;
        t.push(n), s++;
      }
      await Promise.all(
        t.map((n) => this.kvNamespace.delete(n))
      );
    } catch (t) {
      throw console.error(`KvStorage: Failed to remove session item ${String(r)}:`, t), t;
    }
  }
  /**
   * Updates the TTL for stored items (KV-specific method)
   * @param ttl - Time to live in seconds
   */
  setDefaultTtl(r) {
    this.defaultTtl = r;
  }
  /**
   * Gets the current default TTL
   */
  getDefaultTtl() {
    return this.defaultTtl;
  }
  /**
   * Configure consistency behavior
   */
  setConsistencyOptions(r) {
    r.enabled !== void 0 && (this.enableConsistencyChecks = r.enabled), r.retries !== void 0 && (this.consistencyRetries = r.retries), r.delayMs !== void 0 && (this.consistencyDelayMs = r.delayMs);
  }
  /**
   * Get current consistency settings
   */
  getConsistencyOptions() {
    return {
      enabled: this.enableConsistencyChecks,
      retries: this.consistencyRetries,
      delayMs: this.consistencyDelayMs
    };
  }
}
const Y = {
  httpOnly: !0,
  secure: !0,
  sameSite: "lax",
  path: "/",
  maxAge: 900
};
class he extends v {
  cookieAdapter;
  defaultOptions;
  maxChunkSize;
  constructor(r, t) {
    super(), this.cookieAdapter = r, this.defaultOptions = {
      ...Y,
      ...t?.defaultOptions || {}
    }, this.maxChunkSize = t?.maxChunkSize || Math.min(o.maxLength, 3e3), o.useInsecureForRefreshToken && console.warn(
      "CookieStorage: useInsecureForRefreshToken is enabled - refresh tokens will be stored in cookies which may have security implications"
    );
  }
  /**
   * Clears all items from cookie storage.
   * Note: This removes all cookies with the configured key prefix
   * @returns {Promise<void>}
   */
  async destroySession() {
    const r = Object.values(c);
    await Promise.all(
      r.map((t) => this.removeSessionItem(t))
    );
  }
  /**
   * Sets the provided key-value pair to cookie storage.
   * Large values are automatically chunked across multiple cookies.
   * @param {V | StorageKeys} itemKey
   * @param {unknown} itemValue
   * @returns {Promise<void>}
   */
  async setSessionItem(r, t) {
    try {
      if (await this.removeSessionItem(r), typeof t == "string") {
        _(t, this.maxChunkSize).forEach((a, l) => {
          const u = `${o.keyPrefix}${r}${l}`;
          this.cookieAdapter.set(u, a, this.defaultOptions);
        });
        return;
      }
      const s = typeof t == "object" ? JSON.stringify(t) : String(t), n = `${o.keyPrefix}${String(r)}0`;
      this.cookieAdapter.set(n, s, this.defaultOptions);
    } catch (s) {
      throw console.error(`CookieStorage: Failed to set session item ${String(r)}:`, s), s;
    }
  }
  /**
   * Gets the item for the provided key from cookie storage.
   * Automatically reconstructs chunked values.
   * @param {V | StorageKeys} itemKey
   * @returns {Promise<unknown | null>}
   */
  async getSessionItem(r) {
    try {
      const t = `${o.keyPrefix}${String(r)}0`, s = this.cookieAdapter.get(t);
      if (!s)
        return null;
      let n = "", i = 0, a = s;
      for (; a; ) {
        n += a, i++;
        const l = `${o.keyPrefix}${String(r)}${i}`;
        a = this.cookieAdapter.get(l);
      }
      return n;
    } catch (t) {
      return console.error(`CookieStorage: Failed to get session item ${String(r)}:`, t), null;
    }
  }
  /**
   * Removes the item for the provided key from cookie storage.
   * Removes all chunks associated with the key.
   * @param {V | StorageKeys} itemKey
   * @returns {Promise<void>}
   */
  async removeSessionItem(r) {
    try {
      let t = 0, s = !0;
      for (; s; ) {
        const n = `${o.keyPrefix}${String(r)}${t}`;
        this.cookieAdapter.get(n) ? (this.cookieAdapter.delete(n, { path: this.defaultOptions.path }), t++) : s = !1;
      }
    } catch (t) {
      throw console.error(`CookieStorage: Failed to remove session item ${String(r)}:`, t), t;
    }
  }
  /**
   * Updates the default cookie options for future operations
   * @param options - Partial cookie options to merge with current defaults
   */
  setDefaultOptions(r) {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...r
    };
  }
  /**
   * Gets the current default cookie options
   */
  getDefaultOptions() {
    return { ...this.defaultOptions };
  }
  /**
   * Gets the maximum chunk size used for splitting large values
   */
  getMaxChunkSize() {
    return this.maxChunkSize;
  }
}
function de(e, r, t) {
  return {
    get: e,
    set: r,
    delete: t
  };
}
const o = {
  /**
   * The prefix to use for the storage keys.
   */
  keyPrefix: "kinde-",
  /**
   * The maximum length of the storage.
   *
   * If the length is exceeded the items will be split into multiple storage items.
   */
  maxLength: 2e3,
  /**
   * Use insecure storage for refresh token.
   *
   * Warning: This should only be used when you're not using a custom domain and no backend app to authenticate on.
   */
  useInsecureForRefreshToken: !1
};
function K(e, r) {
  if (!e)
    return null;
  const t = e.split(".");
  if (t.length !== 3)
    return null;
  const s = t[
    1
    /* body */
  ].replace(/-/g, "+").replace(/_/g, "/"), n = decodeURIComponent(
    atob(s).split("").map((i) => "%" + ("00" + i.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
  return JSON.parse(n);
}
const m = async (e = c.accessToken) => {
  const r = p();
  if (!r)
    return null;
  const t = await r.getSessionItem(
    e === "accessToken" ? c.accessToken : c.idToken
  );
  if (!t)
    return null;
  const s = K(t);
  return s || console.warn("No decoded token found"), s;
}, O = async (e = "accessToken") => m(e), ge = async (e, r = "accessToken") => {
  const t = await O(r);
  return t ? {
    name: e,
    value: t[e]
  } : null;
}, ke = async () => {
  const e = await m();
  return e ? e.org_code || e["x-hasura-org-code"] : null;
}, me = async (e = c.accessToken) => {
  const r = p();
  if (!r)
    return null;
  const t = await r.getSessionItem(
    e === "accessToken" ? c.accessToken : c.idToken
  );
  return t || null;
}, Se = async (e) => {
  const r = await m();
  if (!r)
    return null;
  const t = r.feature_flags || r["x-hasura-feature-flags"];
  return t ? t[e]?.v ?? null : null;
}, we = async () => {
  const e = await O("idToken");
  if (!e)
    return null;
  const { sub: r } = e;
  return r ? {
    id: e.sub,
    givenName: e.given_name,
    familyName: e.family_name,
    email: e.email,
    picture: e.picture
  } : (console.error("No sub in idToken"), null);
}, ye = async (e) => {
  const r = await m();
  if (!r)
    return {
      permissionKey: e,
      orgCode: null,
      isGranted: !1
    };
  const t = r.permissions || [];
  return {
    permissionKey: e,
    orgCode: r.org_code,
    isGranted: !!t.includes(e)
  };
}, pe = async () => {
  const e = await m();
  if (!e)
    return {
      orgCode: null,
      permissions: []
    };
  const r = e.permissions || e["x-hasura-permissions"] || [];
  return {
    orgCode: e.org_code || e["x-hasura-org-code"],
    permissions: r
  };
}, _e = async () => {
  const e = await m("idToken");
  return e ? !e.org_codes && !e["x-hasura-org-codes"] ? (console.warn(
    "Org codes not found in token, ensure org codes have been included in the token customisation within the application settings"
  ), null) : e.org_codes || e["x-hasura-org-codes"] : null;
}, ve = async () => {
  const e = await m();
  return e ? !e.roles && !e["x-hasura-roles"] ? (console.warn(
    "No roles found in token, ensure roles have been included in the token customisation within the application settings"
  ), []) : e.roles || e["x-hasura-roles"] : [];
}, $e = async (e) => {
  try {
    const r = await m("accessToken");
    if (!r) return !1;
    if (!r.exp)
      return console.error("Token does not have an expiry"), !1;
    const t = r.exp < Math.floor(Date.now() / 1e3);
    return t && e?.useRefreshToken ? (await C({
      domain: e.domain,
      clientId: e.clientId
    })).success : !t;
  } catch (r) {
    return console.error("Error checking authentication:", r), !1;
  }
}, C = async ({
  domain: e,
  clientId: r,
  refreshType: t = S.refreshToken,
  onRefresh: s
}) => {
  const n = (l) => (s && s(l), l);
  if (!e)
    return n({
      success: !1,
      error: "Domain is required for token refresh"
    });
  if (!r)
    return n({
      success: !1,
      error: "Client ID is required for token refresh"
    });
  let i = "", a;
  if (o.useInsecureForRefreshToken || !x(e) ? a = T() : a = p(), t === S.refreshToken) {
    if (!a)
      return n({
        success: !1,
        error: "No active storage found"
      });
    if (i = await a.getSessionItem(
      c.refreshToken
    ), !i)
      return n({
        success: !1,
        error: "No refresh token found"
      });
  }
  A();
  try {
    const l = await fetch(`${U(e)}/oauth2/token`, {
      method: "POST",
      ...t === S.cookie && { credentials: "include" },
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: new URLSearchParams({
        ...t === S.refreshToken && {
          refresh_token: i
        },
        grant_type: "refresh_token",
        client_id: r
      }).toString()
    });
    if (!l.ok)
      return n({
        success: !1,
        error: "Failed to refresh token"
      });
    const u = await l.json();
    if (u.access_token) {
      const f = p();
      return f ? (M(u.expires_in, async () => {
        C({ domain: e, clientId: r, refreshType: t, onRefresh: s });
      }), a && (await f.setSessionItem(
        c.accessToken,
        u.access_token
      ), u.id_token && await f.setSessionItem(c.idToken, u.id_token), u.refresh_token && await a.setSessionItem(
        c.refreshToken,
        u.refresh_token
      )), n({
        success: !0,
        [c.accessToken]: u.access_token,
        [c.idToken]: u.id_token,
        [c.refreshToken]: u.refresh_token
      })) : n({
        success: !1,
        error: "No active storage found"
      });
    }
  } catch (l) {
    return n({
      success: !1,
      error: `No access token received: ${l}`
    });
  }
  return n({
    success: !1,
    error: "No access token received"
  });
}, g = {
  secure: null,
  insecure: null
}, xe = (e) => {
  g.secure = e;
}, p = () => g.secure || null, Ce = () => g.secure !== null, Te = () => {
  g.secure = null;
}, Ie = (e) => {
  g.insecure = e;
}, T = () => g.insecure || g.secure || null, be = () => g.insecure !== null, Pe = () => {
  g.insecure = null;
}, Re = async (e) => (console.warn(
  "Warning: generateProfileUrl is deprecated. Please use generatePortalUrl instead."
), te({
  domain: e.domain,
  returnUrl: e.returnUrl,
  subNav: e.subNav
}));
function ee(e, r = []) {
  try {
    const t = new URL(e);
    return !r.includes(t.protocol) && !!t.host;
  } catch {
    return !1;
  }
}
const te = async ({
  domain: e,
  returnUrl: r,
  subNav: t
}) => {
  const s = p();
  if (!s)
    throw new Error("generatePortalUrl: Active storage not found");
  const n = await s.getSessionItem(
    c.accessToken
  );
  if (!n)
    throw new Error("generatePortalUrl: Access Token not found");
  if (!ee(r, ["ftp:", "ws:"]))
    throw new Error("generatePortalUrl: returnUrl must be an absolute URL");
  const i = new URLSearchParams({
    sub_nav: t || F.profile,
    return_url: r
  }), a = await fetch(
    `${U(e)}/account_api/v1/portal_link?${i.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${n}`
      }
    }
  );
  if (!a.ok)
    throw new Error(
      `Failed to fetch profile URL: ${a.status} ${a.statusText}`
    );
  const l = await a.json();
  if (!l.url || typeof l.url != "string")
    throw new Error("Invalid URL received from API");
  try {
    return {
      url: new URL(l.url)
    };
  } catch (u) {
    throw console.error(u), new Error(`Invalid URL format received from API: ${l.url}`);
  }
}, Ue = {
  __esModule: !0,
  default: async () => (await import("./expoSecureStore-CZEuJ9Zw.js")).ExpoSecureStore
};
export {
  _e as A,
  ve as B,
  $e as C,
  C as D,
  Ue as E,
  xe as F,
  p as G,
  Ce as H,
  Te as I,
  Ie as J,
  T as K,
  be as L,
  Pe as M,
  ce as N,
  fe as O,
  le as P,
  ue as Q,
  he as R,
  v as S,
  de as T,
  q as U,
  L as V,
  F as W,
  J as X,
  b as Y,
  S as Z,
  c as a,
  o as b,
  E as c,
  U as d,
  ne as e,
  oe as f,
  P as g,
  ae as h,
  ie as i,
  x as j,
  M as k,
  A as l,
  G as m,
  y as n,
  Re as o,
  te as p,
  ge as q,
  O as r,
  _ as s,
  ke as t,
  me as u,
  m as v,
  Se as w,
  we as x,
  ye as y,
  pe as z
};
