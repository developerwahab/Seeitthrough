// src/pro/catalogStore.js 

import { listUnlockProducts, listDonationProducts } from "./iap";

let _byId = Object.create(null);

export function getProductById(id) {
  return id ? _byId[id] : null;
}

export function getLocalizedPrice(id) {
  const p = getProductById(id);
  return p?.localizedPrice || null;
}

export function getAllCached() {
  return { ..._byId };
}
 
export async function preloadCatalog() {
  try {
    const [unlock, donate] = await Promise.all([
      listUnlockProducts(), 
      listDonationProducts(),
    ]);
    const all = [...(unlock || []), ...(donate || [])];
    const map = Object.create(null);
    for (const p of all) {
      const id = p.productId || p.productIdentifier || p.sku;
      if (id) map[id] = p;
    }
    _byId = map;
    return getAllCached();
  } catch {
    return getAllCached();
  }
}
