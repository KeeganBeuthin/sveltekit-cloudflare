var B = /* @__PURE__ */ ((e) => (e.email = "email", e.profile = "profile", e.openid = "openid", e.offline_access = "offline", e))(B || {}), D = /* @__PURE__ */ ((e) => (e.none = "none", e.create = "create", e.login = "login", e))(D || {}), F = /* @__PURE__ */ ((e) => (e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e))(F || {}), H = /* @__PURE__ */ ((e) => (e.organizationDetails = "organization_details", e.organizationMembers = "organization_members", e.organizationPlanDetails = "organization_plan_details", e.organizationPaymentDetails = "organization_payment_details", e.organizationPlanSelection = "organization_plan_selection", e.profile = "profile", e))(H || {}), P = /* @__PURE__ */ ((e) => (e.logout = "logout", e.login = "login", e.register = "registration", e.token = "token", e.profile = "profile", e))(P || {}), w = /* @__PURE__ */ ((e) => (e[e.refreshToken = 0] = "refreshToken", e[e.cookie = 1] = "cookie", e))(w || {});
const N = (e) => {
  const t = (c) => btoa(c).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (e instanceof ArrayBuffer) {
    const c = new Uint8Array(e), a = String.fromCharCode(...c);
    return t(a);
  }
  const n = new TextEncoder().encode(e), s = String.fromCharCode(...n);
  return t(s);
}, U = (e = 28) => {
  if (crypto) {
    const t = new Uint8Array(e / 2);
    return crypto.getRandomValues(t), Array.from(t, J).join("");
  } else
    return W(e);
};
function J(e) {
  return e.toString(16).padStart(2, "0");
}
function W(e = 28) {
  const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  const n = t.length;
  for (let s = 0; s < e; s++)
    r += t.charAt(Math.floor(Math.random() * n));
  return r;
}
const ne = (e) => {
  e = e.split("?")[1];
  const t = new URLSearchParams(e);
  return {
    accessToken: t.get("access_token"),
    idToken: t.get("id_token"),
    expiresIn: +(t.get("expires_in") || 0)
  };
}, R = (e) => e.replace(/\/$/, ""), G = (e, t = !1) => {
  const r = Array.isArray(e.audience) ? e.audience.join(" ") : e.audience || "", n = {
    login_hint: e.loginHint,
    is_create_org: e.isCreateOrg?.toString(),
    connection_id: e.connectionId,
    redirect_uri: e.redirectURL ? t ? e.redirectURL : R(e.redirectURL) : void 0,
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
}, b = (e) => typeof e != "object" || e === null ? e : Array.isArray(e) ? e.map((t) => b(t)) : Object.fromEntries(
  Object.entries(e).map(([t, r]) => [
    t.replace(/_([a-z])/g, (n, s) => s.toUpperCase()),
    b(r)
  ])
), Z = [
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
], se = async (e, t = P.login, r, n) => {
  const s = `${e}/oauth2/auth`, c = I();
  if (r.reauthState)
    try {
      const u = b(
        JSON.parse(atob(r.reauthState))
      );
      r = {
        ...r,
        ...u
      }, delete r.reauthState;
    } catch (u) {
      const h = u instanceof Error ? u.message : "Unknown error";
      throw new Error(`Error handing reauth state: ${h}`);
    }
  if (!r.clientId)
    throw new Error("Error generating auth URL: Client ID missing");
  const a = {
    client_id: r.clientId,
    response_type: r.responseType || "code",
    ...G(r, n?.disableUrlSanitization)
  };
  r.state || (r.state = U(32)), c && c.setSessionItem(i.state, r.state), a.state = r.state, r.nonce || (r.nonce = U(16)), a.nonce = r.nonce, c && c.setSessionItem(i.nonce, r.nonce);
  let f = "";
  if (r.codeChallenge)
    a.code_challenge = r.codeChallenge;
  else {
    const { codeVerifier: u, codeChallenge: h } = await Q();
    f = u, c && c.setSessionItem(i.codeVerifier, u), a.code_challenge = h;
  }
  a.code_challenge_method = "S256", r.codeChallengeMethod && (a.code_challenge_method = r.codeChallengeMethod), !r.prompt && t === P.register && (a.prompt = D.create), r.properties && Object.keys(r.properties).forEach((u) => {
    if (!Z.includes(u)) {
      console.warn("Unsupported Property for url generation: ", u);
      return;
    }
    const h = r.properties?.[u];
    h !== void 0 && (a[u] = h);
  });
  const l = new URLSearchParams(a).toString();
  return {
    url: new URL(`${s}?${l}`),
    state: a.state,
    nonce: a.nonce,
    codeChallenge: a.code_challenge,
    codeVerifier: f
  };
};
async function Q() {
  const e = U(52), t = new TextEncoder().encode(e);
  let r = "";
  if (!crypto)
    r = N(btoa(e));
  else {
    const n = await crypto.subtle.digest("SHA-256", t);
    r = N(n);
  }
  return { codeVerifier: e, codeChallenge: r };
}
let v;
function V(e, t) {
  if (A(), typeof window > "u")
    throw new Error("setRefreshTimer requires a browser environment");
  if (e <= 0)
    throw new Error("Timer duration must be positive");
  v = window.setTimeout(
    t,
    Math.min(e * 1e3 - 1e4, 864e5)
  );
}
function A() {
  v !== void 0 && (window.clearTimeout(v), v = void 0);
}
const _ = {
  framework: "",
  frameworkVersion: "",
  sdkVersion: ""
}, L = async () => {
  await I()?.removeItems(
    i.state,
    i.nonce,
    i.codeVerifier
  );
}, oe = async ({
  urlParams: e,
  domain: t,
  clientId: r,
  redirectURL: n,
  autoRefresh: s = !1,
  onRefresh: c
}) => {
  const a = e.get("state"), f = e.get("code");
  if (!a || !f)
    return console.error("Invalid state or code"), {
      success: !1,
      error: "Invalid state or code"
    };
  const l = I();
  if (!l)
    return console.error("No active storage found"), {
      success: !1,
      error: "Authentication storage is not initialized"
    };
  (!_.framework || !_.frameworkVersion) && console.warn(
    "Framework and version not set. Please set the framework and version in the config object"
  );
  const u = await l.getSessionItem(i.state);
  if (a !== u)
    return console.error("Invalid state"), {
      success: !1,
      error: `Invalid state; supplied ${a}, expected ${u}`
    };
  const h = await l.getSessionItem(
    i.codeVerifier
  );
  if (h === null)
    return console.error("Code verifier not found"), {
      success: !1,
      error: "Code verifier not found"
    };
  const E = {
    "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
  };
  _.framework && (E["Kinde-SDK"] = `${_.framework}/${_.sdkVersion}/${_.frameworkVersion}/Javascript`);
  const j = {
    method: "POST",
    ...!o.useInsecureForRefreshToken && y(t) ? {
      credentials: "include"
    } : {},
    headers: new Headers(E),
    body: new URLSearchParams({
      client_id: r,
      code: f,
      code_verifier: h,
      grant_type: "authorization_code",
      redirect_uri: n
    })
  };
  let S;
  A();
  try {
    if (S = await fetch(`${t}/oauth2/token`, j), !S?.ok) {
      const m = await S.text();
      return console.error("Token exchange failed:", S.status, m), {
        success: !1,
        error: `Token exchange failed: ${S.status} - ${m}`
      };
    }
  } catch (m) {
    return L(), console.error("Token exchange failed:", m), {
      success: !1,
      error: `Token exchange failed: ${m}`
    };
  }
  const d = await S.json(), z = p();
  z && z.setItems({
    [i.accessToken]: d.access_token,
    [i.idToken]: d.id_token,
    [i.refreshToken]: d.refresh_token
  }), (o.useInsecureForRefreshToken || !y(t)) && l.setSessionItem(i.refreshToken, d.refresh_token), s && V(d.expires_in, async () => {
    x({ domain: t, clientId: r, onRefresh: c });
  }), L();
  const q = ((m) => (m.search = "", m))(new URL(window.location.toString()));
  return window.history.replaceState(window.history.state, "", q), !d.access_token || !d.id_token || !d.refresh_token ? {
    success: !1,
    error: "No access token received"
  } : {
    success: !0,
    [i.accessToken]: d.access_token,
    [i.idToken]: d.id_token,
    [i.refreshToken]: d.refresh_token
  };
};
function X(e) {
  const r = document.cookie.split("; ").find((n) => n.startsWith(`${e}=`));
  if (!r) return null;
  try {
    const n = r.split("=")[1];
    return n ? decodeURIComponent(n) : null;
  } catch (n) {
    return console.error(`Error parsing cookie ${e}:`, n), null;
  }
}
const Y = "_kbrte", ae = async ({
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
  const r = y(e), n = o.useInsecureForRefreshToken;
  let s = null;
  return r && !n && (s = X(Y)), await x({
    domain: e,
    clientId: t,
    refreshType: s ? w.cookie : w.refreshToken
  });
}, y = (e) => !e.match(
  /^(?:https?:\/\/)?[a-zA-Z0-9][.-a-zA-Z0-9]*\.kinde\.com$/i
);
function $(e, t) {
  return t <= 0 ? [] : e.match(new RegExp(`.{1,${t}}`, "g")) || [];
}
var i = /* @__PURE__ */ ((e) => (e.accessToken = "accessToken", e.idToken = "idToken", e.refreshToken = "refreshToken", e.state = "state", e.nonce = "nonce", e.codeVerifier = "codeVerifier", e))(i || {});
class T {
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
class ie extends T {
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
      $(r, o.maxLength).forEach(
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
class ce extends T {
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
      $(r, o.maxLength).forEach(
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
class le extends T {
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
      $(r, o.maxLength).forEach(
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
class ue extends T {
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
        const s = $(r, o.maxLength);
        await Promise.all(
          s.map(
            (c, a) => this.kvNamespace.put(
              `${o.keyPrefix}${t}${a}`,
              c,
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
      let n = "", s = 0, c = r;
      for (; c !== null; )
        n += c, s++, c = await this.kvNamespace.get(
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
function O(e, t) {
  if (!e)
    return null;
  const r = e.split(".");
  if (r.length !== 3)
    return null;
  const n = r[
    1
    /* body */
  ].replace(/-/g, "+").replace(/_/g, "/"), s = decodeURIComponent(
    atob(n).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
  );
  return JSON.parse(s);
}
const k = async (e = i.accessToken) => {
  const t = p();
  if (!t)
    return null;
  const r = await t.getSessionItem(
    e === "accessToken" ? i.accessToken : i.idToken
  );
  if (!r)
    return null;
  const n = O(r);
  return n || console.warn("No decoded token found"), n;
}, M = async (e = "accessToken") => k(e), fe = async (e, t = "accessToken") => {
  const r = await M(t);
  return r ? {
    name: e,
    value: r[e]
  } : null;
}, de = async () => {
  const e = await k();
  return e ? e.org_code || e["x-hasura-org-code"] : null;
}, he = async (e = i.accessToken) => {
  const t = p();
  if (!t)
    return null;
  const r = await t.getSessionItem(
    e === "accessToken" ? i.accessToken : i.idToken
  );
  return r || null;
}, ge = async (e) => {
  const t = await k();
  if (!t)
    return null;
  const r = t.feature_flags || t["x-hasura-feature-flags"];
  return r ? r[e]?.v ?? null : null;
}, me = async () => {
  const e = await M("idToken");
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
}, ke = async (e) => {
  const t = await k();
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
}, we = async () => {
  const e = await k();
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
}, Se = async () => {
  const e = await k("idToken");
  return e ? !e.org_codes && !e["x-hasura-org-codes"] ? (console.warn(
    "Org codes not found in token, ensure org codes have been included in the token customisation within the application settings"
  ), null) : e.org_codes || e["x-hasura-org-codes"] : null;
}, _e = async () => {
  const e = await k();
  return e ? !e.roles && !e["x-hasura-roles"] ? (console.warn(
    "No roles found in token, ensure roles have been included in the token customisation within the application settings"
  ), []) : e.roles || e["x-hasura-roles"] : [];
}, pe = async (e) => {
  try {
    const t = await k("accessToken");
    if (!t) return !1;
    if (!t.exp)
      return console.error("Token does not have an expiry"), !1;
    const r = t.exp < Math.floor(Date.now() / 1e3);
    return r && e?.useRefreshToken ? (await x({
      domain: e.domain,
      clientId: e.clientId
    })).success : !r;
  } catch (t) {
    return console.error("Error checking authentication:", t), !1;
  }
}, x = async ({
  domain: e,
  clientId: t,
  refreshType: r = w.refreshToken,
  onRefresh: n
}) => {
  const s = (f) => (n && n(f), f);
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
  let c = "", a;
  if (o.useInsecureForRefreshToken || !y(e) ? a = I() : a = p(), r === w.refreshToken) {
    if (!a)
      return s({
        success: !1,
        error: "No active storage found"
      });
    if (c = await a.getSessionItem(
      i.refreshToken
    ), !c)
      return s({
        success: !1,
        error: "No refresh token found"
      });
  }
  A();
  try {
    const f = await fetch(`${R(e)}/oauth2/token`, {
      method: "POST",
      ...r === w.cookie && { credentials: "include" },
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: new URLSearchParams({
        ...r === w.refreshToken && {
          refresh_token: c
        },
        grant_type: "refresh_token",
        client_id: t
      }).toString()
    });
    if (!f.ok)
      return s({
        success: !1,
        error: "Failed to refresh token"
      });
    const l = await f.json();
    if (l.access_token) {
      const u = p();
      return u ? (V(l.expires_in, async () => {
        x({ domain: e, clientId: t, refreshType: r, onRefresh: n });
      }), a && (await u.setSessionItem(
        i.accessToken,
        l.access_token
      ), l.id_token && await u.setSessionItem(i.idToken, l.id_token), l.refresh_token && await a.setSessionItem(
        i.refreshToken,
        l.refresh_token
      )), s({
        success: !0,
        [i.accessToken]: l.access_token,
        [i.idToken]: l.id_token,
        [i.refreshToken]: l.refresh_token
      })) : s({
        success: !1,
        error: "No active storage found"
      });
    }
  } catch (f) {
    return s({
      success: !1,
      error: `No access token received: ${f}`
    });
  }
  return s({
    success: !1,
    error: "No access token received"
  });
}, g = {
  secure: null,
  insecure: null
}, ve = (e) => {
  g.secure = e;
}, p = () => g.secure || null, ye = () => g.secure !== null, $e = () => {
  g.secure = null;
}, Te = (e) => {
  g.insecure = e;
}, I = () => g.insecure || g.secure || null, xe = () => g.insecure !== null, Ie = () => {
  g.insecure = null;
}, Ce = async (e) => (console.warn(
  "Warning: generateProfileUrl is deprecated. Please use generatePortalUrl instead."
), ee({
  domain: e.domain,
  returnUrl: e.returnUrl,
  subNav: e.subNav
}));
function K(e, t = []) {
  try {
    const r = new URL(e);
    return !t.includes(r.protocol) && !!r.host;
  } catch {
    return !1;
  }
}
const ee = async ({
  domain: e,
  returnUrl: t,
  subNav: r
}) => {
  const n = p();
  if (!n)
    throw new Error("generatePortalUrl: Active storage not found");
  const s = await n.getSessionItem(
    i.accessToken
  );
  if (!s)
    throw new Error("generatePortalUrl: Access Token not found");
  if (!K(t, ["ftp:", "ws:"]))
    throw new Error("generatePortalUrl: returnUrl must be an absolute URL");
  const c = new URLSearchParams({
    sub_nav: r || F.profile,
    return_url: t
  }), a = await fetch(
    `${R(e)}/account_api/v1/portal_link?${c.toString()}`,
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
  const f = await a.json();
  if (!f.url || typeof f.url != "string")
    throw new Error("Invalid URL received from API");
  try {
    return {
      url: new URL(f.url)
    };
  } catch (l) {
    throw console.error(l), new Error(`Invalid URL format received from API: ${f.url}`);
  }
}, Pe = {
  __esModule: !0,
  default: async () => (await import("./expoSecureStore-B0BoYsgy.js")).ExpoSecureStore
};
export {
  Se as A,
  _e as B,
  pe as C,
  x as D,
  Pe as E,
  ve as F,
  p as G,
  ye as H,
  $e as I,
  Te as J,
  I as K,
  xe as L,
  Ie as M,
  ie as N,
  ue as O,
  ce as P,
  le as Q,
  B as R,
  T as S,
  D as T,
  F as U,
  H as V,
  P as W,
  w as X,
  i as a,
  o as b,
  N as c,
  R as d,
  ne as e,
  se as f,
  U as g,
  oe as h,
  ae as i,
  y as j,
  V as k,
  A as l,
  G as m,
  _ as n,
  Ce as o,
  ee as p,
  fe as q,
  M as r,
  $ as s,
  de as t,
  he as u,
  k as v,
  ge as w,
  me as x,
  ke as y,
  we as z
};
