/**
 * storage.js — localStorage wrapper with safe access
 */

const PREFIX = 'tl_';

export const storage = {
  get(key, def = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? v : def;
    } catch { return def; }
  },

  set(key, value) {
    try { localStorage.setItem(PREFIX + key, String(value)); } catch { /* noop */ }
  },

  getJSON(key, def = null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v !== null ? JSON.parse(v) : def;
    } catch { return def; }
  },

  setJSON(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* noop */ }
  },

  remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* noop */ }
  },

  clear(...keys) {
    keys.forEach(k => this.remove(k));
  }
};
