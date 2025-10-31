import RSAsyncStorage from '@react-native-async-storage/async-storage';

function assertKey(k) {
  if (k === null || k === undefined || (typeof k === 'string' && k.length === 0)) {
    if (__DEV__) {
      console.trace(new Error(`AsyncStorage key is ${String(k)}`));
    }
    return '__INVALID_KEY__'; 
  }
  return String(k);
}

const SafeAsyncStorage = {
  async getItem(key) {
    return RSAsyncStorage.getItem(assertKey(key));
  },
  async setItem(key, value) {
    return RSAsyncStorage.setItem(assertKey(key), value ?? '');
  },
  async removeItem(key) {
    return RSAsyncStorage.removeItem(assertKey(key));
  },
  async multiGet(keys) {
    const ks = Array.isArray(keys) ? keys.map(assertKey) : [];
    return RSAsyncStorage.multiGet(ks);
  },
  async multiSet(pairs) {
    const safe = Array.isArray(pairs)
      ? pairs.map(([k, v]) => [assertKey(k), v ?? ''])
      : [];
    return RSAsyncStorage.multiSet(safe);
  },
  async multiRemove(keys) {
    const ks = Array.isArray(keys) ? keys.map(assertKey) : [];
    return RSAsyncStorage.multiRemove(ks);
  },
  async clear() {
    return RSAsyncStorage.clear();
  },
};

export default SafeAsyncStorage;
