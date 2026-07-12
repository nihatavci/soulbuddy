// Minimal MMKV mock for jest. Backs each instance with a Map so
// store/mmkv.ts and i18n/index.ts have a working storage in tests.

class MMKV {
  constructor() {
    this._store = new Map();
  }
  set(key, value) { this._store.set(key, value); }
  getString(key) {
    const v = this._store.get(key);
    return typeof v === 'string' ? v : undefined;
  }
  getNumber(key) {
    const v = this._store.get(key);
    return typeof v === 'number' ? v : undefined;
  }
  getBoolean(key) {
    const v = this._store.get(key);
    return typeof v === 'boolean' ? v : undefined;
  }
  contains(key) { return this._store.has(key); }
  delete(key) { this._store.delete(key); }
  getAllKeys() { return Array.from(this._store.keys()); }
  clearAll() { this._store.clear(); }
  addOnValueChangedListener() { return { remove: () => {} }; }
}

module.exports = { MMKV };
