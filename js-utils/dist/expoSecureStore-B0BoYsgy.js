import { S as c, a as S, s as y, b as a } from "./main-B22wA3GW.js";
let r;
async function i() {
  let o = 0;
  for (; !r && o < 20; )
    await new Promise((e) => setTimeout(e, 100)), o++;
}
class w extends c {
  constructor() {
    super(), this.loadExpoStore();
  }
  async loadExpoStore() {
    try {
      r = await import("expo-secure-store");
    } catch (e) {
      console.error("Error loading dependency expo storage:", e);
    }
  }
  /**
   * Clears all items from session store.
   * @returns {void}
   */
  async destroySession() {
    Object.values(S).forEach(async (t) => {
      await this.removeSessionItem(t);
    });
  }
  /**
   * Sets the provided key-value store to ExpoSecureStore.
   * @param {string} itemKey
   * @param {unknown} itemValue
   * @returns {void}
   */
  async setSessionItem(e, t) {
    if (await i(), await this.removeSessionItem(e), typeof t == "string") {
      y(t, Math.min(a.maxLength, 2048)).forEach(
        async (s, n) => {
          await r.setItemAsync(
            `${a.keyPrefix}${e}${n}`,
            s
          );
        }
      );
      return;
    } else
      throw new Error("Item value must be a string");
  }
  /**
   * Gets the item for the provided key from the ExpoSecureStore.
   * @param {string} itemKey
   * @returns {unknown | null}
   */
  async getSessionItem(e) {
    await i();
    const t = [];
    let s = 0, n = await r.getItemAsync(
      `${a.keyPrefix}${String(e)}${s}`
    );
    for (; n; )
      t.push(n), s++, n = await r.getItemAsync(
        `${a.keyPrefix}${String(e)}${s}`
      );
    return t.join("") || null;
  }
  /**
   * Removes the item for the provided key from the ExpoSecureStore.
   * @param {string} itemKey
   * @returns {void}
   */
  async removeSessionItem(e) {
    await i();
    let t = 0, s = await r.getItemAsync(
      `${a.keyPrefix}${String(e)}${t}`
    );
    for (; s; )
      await r.deleteItemAsync(
        `${a.keyPrefix}${String(e)}${t}`
      ), t++, s = await r.getItemAsync(
        `${a.keyPrefix}${String(e)}${t}`
      );
  }
}
export {
  w as ExpoSecureStore
};
