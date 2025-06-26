var q = /* @__PURE__ */ ((e) => (e.email = "email", e.profile = "profile", e.openid = "openid", e.offline_access = "offline", e))(q || {}), F = /* @__PURE__ */ ((e) => (e.none = "none", e.create = "create", e.login = "login", e))(F || {}), D = /* @__PURE__ */ ((e) => (e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e))(D || {}), B = /* @__PURE__ */ ((e) => (e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e))(B || {}), P = /* @__PURE__ */ ((e) => (e.logout = "logout", e.login = "login", e.register = "registration", e.token = "token", e.profile = "profile", e))(P || {}), S = /* @__PURE__ */ ((e) => (e[e.refreshToken = 0] = "refreshToken", e[e.cookie = 1] = "cookie", e))(S || {});
const E = (e) => {
  const t = (i) => btoa(i).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (e instanceof ArrayBuffer) {
    const i = new Uint8Array(e), a = String.fromCharCode(...i);
    return t(a);
  }
  const n = new TextEncoder().encode(e), s = String.fromCharCode(...n);
  return t(s);
}, U = (e = 28) => {
  if (crypto) {
    const t = new Uint8Array(e / 2);
    return crypto.getRandomValues(t), Array.from(t, H).join("");
  } else
    return J(e);
};
function H(e) {
  return e.toString(16).padStart(2, "0");
}
function J(e = 28) {
  const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  const n = t.length;
  for (let s = 0; s < e; s++)
    r += t.charAt(Math.floor(Math.random() * n));
  return r;
}
const se = (e) => {
  e = e.split("?")[1];
  const t = new URLSearchParams(e);
  return {
    accessToken: t.get("access_token"),
    idToken: t.get("id_token"),
    expiresIn: +(t.get("expires_in") || 0)
  };
}, b = (e) => e.replace(/\/$/, ""), G = (e, t = !1) => {
  const r = Array.isArray(e.audience) ? e.audience.join(" ") : e.audience || "", n = {
    login_hint: e.loginHint,
    is_create_org: e.isCreateOrg?.toString(),
    connection_id: e.connectionId,
    redirect_uri: e.redirectURL ? t ? e.redirectURL : b(e.redirectURL) : void 0,
    audience: r,
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
  return Object.keys(n).forEach(
    (s) => n[s] === void 0 && delete n[s]
  ), n;
}, A = (e) => typeof e != "object" || e === null ? e : Array.isArray(e) ? e.map((t) => A(t)) : Object.fromEntries(
  Object.entries(e).map(([t, r]) => [
    t.replace(/_([a-z])/g, (n, s) => s.toUpperCase()),
    A(r)
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
], oe = async (e, t = P.login, r, n) => {
  const s = `${e}/oauth2/auth`, i = I();
  if (r.reauthState)
    try {
      const f = A(
        JSON.parse(atob(r.reauthState))
      );
      r = {
        ...r,
        ...f
      }, delete r.reauthState;
    } catch (f) {
      const h = f instanceof Error ? f.message : "Unknown error";
      throw new Error(`Error handing reauth state: ${h}`);
    }
  if (!r.clientId)
    throw new Error("Error generating auth URL: Client ID missing");
  const a = {
    client_id: r.clientId,
    response_type: r.responseType || "code",
    ...G(r, n?.disableUrlSanitization)
  };
  r.state || (r.state = U(32)), i && i.setSessionItem(c.state, r.state), a.state = r.state, r.nonce || (r.nonce = U(16)), a.nonce = r.nonce, i && i.setSessionItem(c.nonce, r.nonce);
  let l = "";
  if (r.codeChallenge)
    a.code_challenge = r.codeChallenge;
  else {
    const { codeVerifier: f, codeChallenge: h } = await Z();
    l = f, i && i.setSessionItem(c.codeVerifier, f), a.code_challenge = h;
  }
  a.code_challenge_method = "S256", r.codeChallengeMethod && (a.code_challenge_method = r.codeChallengeMethod), !r.prompt && t === P.register && (a.prompt = F.create), r.properties && Object.keys(r.properties).forEach((f) => {
    if (!W.includes(f)) {
      console.warn("Unsupported Property for url generation: ", f);
      return;
    }
    const h = r.properties?.[f];
    h !== void 0 && (a[f] = h);
  });
  const u = new URLSearchParams(a).toString();
  return {
    url: new URL(`${s}?${u}`),
    state: a.state,
    nonce: a.nonce,
    codeChallenge: a.code_challenge,
    codeVerifier: l
  };
};
async function Z() {
  const e = U(52), t = new TextEncoder().encode(e);
  let r = "";
  if (!crypto)
    r = E(btoa(e));
  else {
    const n = await crypto.subtle.digest("SHA-256", t);
    r = E(n);
  }
  return { codeVerifier: e, codeChallenge: r };
}
let $;
function M(e, t) {
  if (R(), typeof window > "u")
    throw new Error("setRefreshTimer requires a browser environment");
  if (e <= 0)
    throw new Error("Timer duration must be positive");
  $ = window.setTimeout(
    t,
    Math.min(e * 1e3 - 1e4, 864e5)
  );
}
function R() {
  $ !== void 0 && (window.clearTimeout($), $ = void 0);
}
const p = {
  framework: "",
  frameworkVersion: "",
  sdkVersion: ""
}, L = async () => {
  await I()?.removeItems(
    c.state,
    c.nonce,
    c.codeVerifier
  );
}, ae = async ({
  urlParams: e,
  domain: t,
  clientId: r,
  redirectURL: n,
  autoRefresh: s = !1,
  onRefresh: i
}) => {
  const a = e.get("state"), l = e.get("code");
  if (!a || !l)
    return console.error("Invalid state or code"), {
      success: !1,
      error: "Invalid state or code"
    };
  const u = I();
  if (!u)
    return console.error("No active storage found"), {
      success: !1,
      error: "Authentication storage is not initialized"
    };
  (!p.framework || !p.frameworkVersion) && console.warn(
    "Framework and version not set. Please set the framework and version in the config object"
  );
  const f = await u.getSessionItem(c.state);
  if (a !== f)
    return console.error("Invalid state"), {
      success: !1,
      error: `Invalid state; supplied ${a}, expected ${f}`
    };
  const h = await u.getSessionItem(
    c.codeVerifier
  );
  if (h === null)
    return console.error("Code verifier not found"), {
      success: !1,
      error: "Code verifier not found"
    };
  const z = {
    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
  };
  p.framework && (z["Kinde-SDK"] = `${p.framework}/${p.sdkVersion}/${p.frameworkVersion}/Javascript`);
  const V = {
    method: "POST",
    ...!o.useInsecureForRefreshToken && x(t) ? {
      credentials: "include"
    } : {},
    headers: new Headers(z),
    body: new URLSearchParams({
      client_id: r,
      code: l,
      code_verifier: h,
      grant_type: "authorization_code",
      redirect_uri: n
    })
  };
  let w;
  R();
  try {
    if (w = await fetch(`${t}/oauth2/token`, V), !w?.ok) {
      const k = await w.text();
      return console.error("Token exchange failed:", w.status, k), {
        success: !1,
        error: `Token exchange failed: ${w.status} - ${k}`
      };
    }
  } catch (k) {
    return L(), console.error("Token exchange failed:", k), {
      success: !1,
      error: `Token exchange failed: ${k}`
    };
  }
  const d = await w.json(), N = _();
  N && N.setItems({
    [c.accessToken]: d.access_token,
    [c.idToken]: d.id_token,
    [c.refreshToken]: d.refresh_token
  }), (o.useInsecureForRefreshToken || !x(t)) && u.setSessionItem(c.refreshToken, d.refresh_token), s && M(d.expires_in, async () => {
    T({ domain: t, clientId: r, onRefresh: i });
  }), L();
  const O = ((k) => (k.search = "", k))(new URL(window.location.toString()));
  return window.history.replaceState(window.history.state, "", O), !d.access_token || !d.id_token || !d.refresh_token ? {
    success: !1,
    error: "No access token received"
  } : {
    success: !0,
    [c.accessToken]: d.access_token,
    [c.idToken]: d.id_token,
    [c.refreshToken]: d.refresh_token
  };
};
function Q(e) {
  const r = document.cookie.split("; ").find((n) => n.startsWith(`${e}=`));
  if (!r) return null;
  try {
    const n = r.split("=")[1];
    return n ? decodeURIComponent(n) : null;
  } catch (n) {
    return console.error(`Error parsing cookie ${e}:`, n), null;
  }
}
const X = "_kbrte", ie = async ({
  domain: e,
  clientId: t
}) => {
  if (!e)
    return {
      success: !1,
      error: "Domain is required for authentication check"
    };
  if (!t)
    return {
      success: !1,
      error: "Client ID is required for authentication check"
    };
  const r = x(e), n = o.useInsecureForRefreshToken;
  let s = null;
  return r && !n && (s = Q(X)), await T({
    domain: e,
    clientId: t,
    refreshType: s ? S.cookie : S.refreshToken
  });
}, x = (e) => !e.match(
  /^(?:https?:\/\/)?[a-zA-Z0-9][.-a-zA-Z0-9]*\.kinde\.com$/i
);
function y(e, t) {
  return t <= 0 ? [] : e.match(new RegExp(`.{1,${t}}`, "g")) || [];
}
var c = /* @__PURE__ */ ((e) => (e.accessToken = "accessToken", e.idToken = "idToken", e.refreshToken = "refreshToken", e.state = "state", e.nonce = "nonce", e.codeVerifier = "codeVerifier", e))(c || {});
class v {
  async setItems(t) {
    await Promise.all(
      Object.entries(t).map(
        ([r, n]) => this.setSessionItem(r, n)
      )
    );
  }
  async removeItems(...t) {
    await Promise.all(
      t.map((r) => this.removeSessionItem(r))
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
  async setSessionItem(t, r) {
    if (await this.removeSessionItem(t), typeof r == "string") {
      y(r, o.maxLength).forEach(
        (n, s) => {
          this.memCache[`${o.keyPrefix}${t}${s}`] = n;
        }
      );
      return;
    }
    this.memCache[`${o.keyPrefix}${String(t)}0`] = r;
  }
  /**
   * Gets the item for the provided key from the memory cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(t) {
    if (this.memCache[`${o.keyPrefix}${String(t)}0`] === void 0)
      return null;
    let r = "", n = 0, s = `${o.keyPrefix}${String(t)}${n}`;
    for (; this.memCache[s] !== void 0; )
      r += this.memCache[s], n++, s = `${o.keyPrefix}${String(t)}${n}`;
    return r;
  }
  /**
   * Removes the item for the provided key from the memory cache.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(t) {
    for (const r in this.memCache)
      r.startsWith(`${o.keyPrefix}${String(t)}`) && delete this.memCache[r];
  }
}
function C(e) {
  return new Promise((t, r) => {
    chrome.storage.local.get([e], function(n) {
      chrome.runtime.lastError ? r(void 0) : t(n[e]);
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
  async setSessionItem(t, r) {
    if (await this.removeSessionItem(t), typeof r == "string") {
      y(r, o.maxLength).forEach(
        async (n, s) => {
          await chrome.storage.local.set({
            [`${o.keyPrefix}${t}${s}`]: n
          });
        }
      );
      return;
    }
    await chrome.storage.local.set({
      [`${o.keyPrefix}${t}0`]: r
    });
  }
  /**
   * Gets the item for the provided key from the chrome.store.local cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(t) {
    let r = "", n = 0, s = `${o.keyPrefix}${String(t)}${n}`;
    for (; await C(
      `${o.keyPrefix}${String(t)}${n}`
    ) !== void 0; )
      r += await C(s), n++, s = `${o.keyPrefix}${String(t)}${n}`;
    return r;
  }
  /**
   * Removes the item for the provided key from the chrome.store.local cache.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(t) {
    let r = 0;
    for (; await C(
      `${o.keyPrefix}${String(t)}${r}`
    ) !== void 0; )
      await chrome.storage.local.remove(
        `${o.keyPrefix}${String(t)}${r}`
      ), r++;
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
    this.internalItems.forEach((t) => {
      this.removeSessionItem(t);
    });
  }
  /**
   * Sets the provided key-value store to the localStorage cache.
   * @param {V} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  async setSessionItem(t, r) {
    if (await this.removeSessionItem(t), this.internalItems.add(t), typeof r == "string") {
      y(r, o.maxLength).forEach(
        (n, s) => {
          localStorage.setItem(
            `${o.keyPrefix}${t}${s}`,
            n
          );
        }
      );
      return;
    }
    localStorage.setItem(
      `${o.keyPrefix}${t}0`,
      r
    );
  }
  /**
   * Gets the item for the provided key from the localStorage cache.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(t) {
    if (localStorage.getItem(`${o.keyPrefix}${t}0`) === null)
      return null;
    let r = "", n = 0, s = `${o.keyPrefix}${String(t)}${n}`;
    for (; localStorage.getItem(s) !== null; )
      r += localStorage.getItem(s), n++, s = `${o.keyPrefix}${String(t)}${n}`;
    return r;
  }
  /**
   * Removes the item for the provided key from the localStorage cache.
   * @param {V} itemKey
   * @returns {void}
   */
  async removeSessionItem(t) {
    let r = 0;
    for (; localStorage.getItem(
      `${o.keyPrefix}${String(t)}${r}`
    ) !== null; )
      localStorage.removeItem(
        `${o.keyPrefix}${String(t)}${r}`
      ), r++;
    this.internalItems.delete(t);
  }
}
class fe extends v {
  kvNamespace;
  defaultTtl;
  constructor(t, r) {
    super(), this.kvNamespace = t, this.defaultTtl = r?.defaultTtl || 3600, o.useInsecureForRefreshToken && console.warn("KvStorage: useInsecureForRefreshToken is enabled - consider security implications for refresh tokens in KV storage");
  }
  /**
   * Clears all items from session store.
   * @returns {void}
   */
  async destroySession() {
    try {
      const { keys: t } = await this.kvNamespace.list({
        prefix: o.keyPrefix
      });
      await Promise.all(
        t.map((r) => this.kvNamespace.delete(r.name))
      );
    } catch (t) {
      throw console.error("KvStorage: Failed to destroy session:", t), t;
    }
  }
  /**
   * Sets the provided key-value store to the KV storage.
   * @param {string} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  async setSessionItem(t, r) {
    try {
      if (await this.removeSessionItem(t), typeof r == "string") {
        const s = y(r, o.maxLength);
        await Promise.all(
          s.map(
            (i, a) => this.kvNamespace.put(
              `${o.keyPrefix}${t}${a}`,
              i,
              { expirationTtl: this.defaultTtl }
            )
          )
        );
        return;
      }
      const n = typeof r == "object" ? JSON.stringify(r) : String(r);
      await this.kvNamespace.put(
        `${o.keyPrefix}${String(t)}0`,
        n,
        { expirationTtl: this.defaultTtl }
      );
    } catch (n) {
      throw console.error(`KvStorage: Failed to set session item ${String(t)}:`, n), n;
    }
  }
  /**
   * Gets the item for the provided key from the KV storage.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(t) {
    try {
      const r = await this.kvNamespace.get(
        `${o.keyPrefix}${String(t)}0`
      );
      if (r === null)
        return null;
      let n = "", s = 0, i = r;
      for (; i !== null; )
        n += i, s++, i = await this.kvNamespace.get(
          `${o.keyPrefix}${String(t)}${s}`
        );
      return n;
    } catch (r) {
      return console.error(`KvStorage: Failed to get session item ${String(t)}:`, r), null;
    }
  }
  /**
   * Removes the item for the provided key from the KV storage.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(t) {
    try {
      const r = [];
      let n = 0;
      for (; ; ) {
        const s = `${o.keyPrefix}${String(t)}${n}`;
        if (await this.kvNamespace.get(s) === null)
          break;
        r.push(s), n++;
      }
      await Promise.all(
        r.map((s) => this.kvNamespace.delete(s))
      );
    } catch (r) {
      throw console.error(`KvStorage: Failed to remove session item ${String(t)}:`, r), r;
    }
  }
  /**
   * Updates the TTL for stored items (KV-specific method)
   * @param ttl - Time to live in seconds
   */
  setDefaultTtl(t) {
    this.defaultTtl = t;
  }
  /**
   * Gets the current default TTL
   */
  getDefaultTtl() {
    return this.defaultTtl;
  }
}
const Y = {
  httpOnly: !0,
  secure: !0,
  sameSite: "lax",
  path: "/",
  maxAge: 900
};
class de extends v {
  cookieAdapter;
  defaultOptions;
  maxChunkSize;
  constructor(t, r) {
    super(), this.cookieAdapter = t, this.defaultOptions = {
      ...Y,
      ...r?.defaultOptions || {}
    }, this.maxChunkSize = r?.maxChunkSize || Math.min(o.maxLength, 3e3), o.useInsecureForRefreshToken && console.warn(
      "CookieStorage: useInsecureForRefreshToken is enabled - refresh tokens will be stored in cookies which may have security implications"
    );
  }
  /**
   * Clears all items from cookie storage.
   * Note: This removes all cookies with the configured key prefix
   * @returns {Promise<void>}
   */
  async destroySession() {
    const t = Object.values(c);
    await Promise.all(
      t.map((r) => this.removeSessionItem(r))
    );
  }
  /**
   * Sets the provided key-value pair to cookie storage.
   * Large values are automatically chunked across multiple cookies.
   * @param {V | StorageKeys} itemKey
   * @param {unknown} itemValue
   * @returns {Promise<void>}
   */
  async setSessionItem(t, r) {
    try {
      if (await this.removeSessionItem(t), typeof r == "string") {
        y(r, this.maxChunkSize).forEach((a, l) => {
          const u = `${o.keyPrefix}${t}${l}`;
          this.cookieAdapter.set(u, a, this.defaultOptions);
        });
        return;
      }
      const n = typeof r == "object" ? JSON.stringify(r) : String(r), s = `${o.keyPrefix}${String(t)}0`;
      this.cookieAdapter.set(s, n, this.defaultOptions);
    } catch (n) {
      throw console.error(`CookieStorage: Failed to set session item ${String(t)}:`, n), n;
    }
  }
  /**
   * Gets the item for the provided key from cookie storage.
   * Automatically reconstructs chunked values.
   * @param {V | StorageKeys} itemKey
   * @returns {Promise<unknown | null>}
   */
  async getSessionItem(t) {
    try {
      const r = `${o.keyPrefix}${String(t)}0`, n = this.cookieAdapter.get(r);
      if (!n)
        return null;
      let s = "", i = 0, a = n;
      for (; a; ) {
        s += a, i++;
        const l = `${o.keyPrefix}${String(t)}${i}`;
        a = this.cookieAdapter.get(l);
      }
      return s;
    } catch (r) {
      return console.error(`CookieStorage: Failed to get session item ${String(t)}:`, r), null;
    }
  }
  /**
   * Removes the item for the provided key from cookie storage.
   * Removes all chunks associated with the key.
   * @param {V | StorageKeys} itemKey
   * @returns {Promise<void>}
   */
  async removeSessionItem(t) {
    try {
      let r = 0, n = !0;
      for (; n; ) {
        const s = `${o.keyPrefix}${String(t)}${r}`;
        this.cookieAdapter.get(s) ? (this.cookieAdapter.delete(s, { path: this.defaultOptions.path }), r++) : n = !1;
      }
    } catch (r) {
      throw console.error(`CookieStorage: Failed to remove session item ${String(t)}:`, r), r;
    }
  }
  /**
   * Updates the default cookie options for future operations
   * @param options - Partial cookie options to merge with current defaults
   */
  setDefaultOptions(t) {
    this.defaultOptions = {
      ...this.defaultOptions,
      ...t
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
function he(e, t, r) {
  return {
    get: e,
    set: t,
    delete: r
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
function K(e, t) {
  if (!e)
    return null;
  const r = e.split(".");
  if (r.length !== 3)
    return null;
  const n = r[
    1
    /* body */
  ].replace(/-/g, "+").replace(/_/g, "/"), s = decodeURIComponent(
    atob(n).split("").map((i) => "%" + ("00" + i.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
  return JSON.parse(s);
}
const m = async (e = c.accessToken) => {
  const t = _();
  if (!t)
    return null;
  const r = await t.getSessionItem(
    e === "accessToken" ? c.accessToken : c.idToken
  );
  if (!r)
    return null;
  const n = K(r);
  return n || console.warn("No decoded token found"), n;
}, j = async (e = "accessToken") => m(e), ge = async (e, t = "accessToken") => {
  const r = await j(t);
  return r ? {
    name: e,
    value: r[e]
  } : null;
}, ke = async () => {
  const e = await m();
  return e ? e.org_code || e["x-hasura-org-code"] : null;
}, me = async (e = c.accessToken) => {
  const t = _();
  if (!t)
    return null;
  const r = await t.getSessionItem(
    e === "accessToken" ? c.accessToken : c.idToken
  );
  return r || null;
}, Se = async (e) => {
  const t = await m();
  if (!t)
    return null;
  const r = t.feature_flags || t["x-hasura-feature-flags"];
  return r ? r[e]?.v ?? null : null;
}, we = async () => {
  const e = await j("idToken");
  if (!e)
    return null;
  const { sub: t } = e;
  return t ? {
    id: e.sub,
    givenName: e.given_name,
    familyName: e.family_name,
    email: e.email,
    picture: e.picture
  } : (console.error("No sub in idToken"), null);
}, pe = async (e) => {
  const t = await m();
  if (!t)
    return {
      permissionKey: e,
      orgCode: null,
      isGranted: !1
    };
  const r = t.permissions || [];
  return {
    permissionKey: e,
    orgCode: t.org_code,
    isGranted: !!r.includes(e)
  };
}, _e = async () => {
  const e = await m();
  if (!e)
    return {
      orgCode: null,
      permissions: []
    };
  const t = e.permissions || e["x-hasura-permissions"] || [];
  return {
    orgCode: e.org_code || e["x-hasura-org-code"],
    permissions: t
  };
}, ye = async () => {
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
    const t = await m("accessToken");
    if (!t) return !1;
    if (!t.exp)
      return console.error("Token does not have an expiry"), !1;
    const r = t.exp < Math.floor(Date.now() / 1e3);
    return r && e?.useRefreshToken ? (await T({
      domain: e.domain,
      clientId: e.clientId
    })).success : !r;
  } catch (t) {
    return console.error("Error checking authentication:", t), !1;
  }
}, T = async ({
  domain: e,
  clientId: t,
  refreshType: r = S.refreshToken,
  onRefresh: n
}) => {
  const s = (l) => (n && n(l), l);
  if (!e)
    return s({
      success: !1,
      error: "Domain is required for token refresh"
    });
  if (!t)
    return s({
      success: !1,
      error: "Client ID is required for token refresh"
    });
  let i = "", a;
  if (o.useInsecureForRefreshToken || !x(e) ? a = I() : a = _(), r === S.refreshToken) {
    if (!a)
      return s({
        success: !1,
        error: "No active storage found"
      });
    if (i = await a.getSessionItem(
      c.refreshToken
    ), !i)
      return s({
        success: !1,
        error: "No refresh token found"
      });
  }
  R();
  try {
    const l = await fetch(`${b(e)}/oauth2/token`, {
      method: "POST",
      ...r === S.cookie && { credentials: "include" },
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: new URLSearchParams({
        ...r === S.refreshToken && {
          refresh_token: i
        },
        grant_type: "refresh_token",
        client_id: t
      }).toString()
    });
    if (!l.ok)
      return s({
        success: !1,
        error: "Failed to refresh token"
      });
    const u = await l.json();
    if (u.access_token) {
      const f = _();
      return f ? (M(u.expires_in, async () => {
        T({ domain: e, clientId: t, refreshType: r, onRefresh: n });
      }), a && (await f.setSessionItem(
        c.accessToken,
        u.access_token
      ), u.id_token && await f.setSessionItem(c.idToken, u.id_token), u.refresh_token && await a.setSessionItem(
        c.refreshToken,
        u.refresh_token
      )), s({
        success: !0,
        [c.accessToken]: u.access_token,
        [c.idToken]: u.id_token,
        [c.refreshToken]: u.refresh_token
      })) : s({
        success: !1,
        error: "No active storage found"
      });
    }
  } catch (l) {
    return s({
      success: !1,
      error: `No access token received: ${l}`
    });
  }
  return s({
    success: !1,
    error: "No access token received"
  });
}, g = {
  secure: null,
  insecure: null
}, xe = (e) => {
  g.secure = e;
}, _ = () => g.secure || null, Te = () => g.secure !== null, Ie = () => {
  g.secure = null;
}, Ce = (e) => {
  g.insecure = e;
}, I = () => g.insecure || g.secure || null, Pe = () => g.insecure !== null, Ue = () => {
  g.insecure = null;
}, Ae = async (e) => (console.warn(
  "Warning: generateProfileUrl is deprecated. Please use generatePortalUrl instead."
), re({
  domain: e.domain,
  returnUrl: e.returnUrl,
  subNav: e.subNav
}));
function ee(e, t = []) {
  try {
    const r = new URL(e);
    return !t.includes(r.protocol) && !!r.host;
  } catch {
    return !1;
  }
}
const re = async ({
  domain: e,
  returnUrl: t,
  subNav: r
}) => {
  const n = _();
  if (!n)
    throw new Error("generatePortalUrl: Active storage not found");
  const s = await n.getSessionItem(
    c.accessToken
  );
  if (!s)
    throw new Error("generatePortalUrl: Access Token not found");
  if (!ee(t, ["ftp:", "ws:"]))
    throw new Error("generatePortalUrl: returnUrl must be an absolute URL");
  const i = new URLSearchParams({
    sub_nav: r || D.profile,
    return_url: t
  }), a = await fetch(
    `${b(e)}/account_api/v1/portal_link?${i.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${s}`
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
}, be = {
  __esModule: !0,
  default: async () => (await import("./expoSecureStore-D869YiSl.js")).ExpoSecureStore
};
export {
  ye as A,
  ve as B,
  $e as C,
  T as D,
  be as E,
  xe as F,
  _ as G,
  Te as H,
  Ie as I,
  Ce as J,
  I as K,
  Pe as L,
  Ue as M,
  ce as N,
  fe as O,
  le as P,
  ue as Q,
  de as R,
  v as S,
  he as T,
  q as U,
  F as V,
  D as W,
  B as X,
  P as Y,
  S as Z,
  c as a,
  o as b,
  E as c,
  b as d,
  se as e,
  oe as f,
  U as g,
  ae as h,
  ie as i,
  x as j,
  M as k,
  R as l,
  G as m,
  p as n,
  Ae as o,
  re as p,
  ge as q,
  j as r,
  y as s,
  ke as t,
  me as u,
  m as v,
  Se as w,
  we as x,
  pe as y,
  _e as z
};
