// src/payments/store.js 
import {
  isPro as _isPro,
  onProChange as _onProChange,
  loadProFromStorage,
} from "../pro/store";
import {
  initIAP,
  cleanupIAP,
  restorePremium as _restore,
  buyPro,
} from "../pro/iap";

export { initIAP, cleanupIAP };
 
let _paid = false;
const _subs = new Set();

function emit() {
  for (const fn of _subs) {
    try {
      fn(_paid);
    } catch {}
  }
}
 
export function isPaid() {
  return _paid;
} 
export function onProChange(cb) {
  if (typeof cb === "function") {
    _subs.add(cb);
    try {
      cb(_paid);
    } catch {}
  }
  const off =
    typeof _onProChange === "function"
      ? _onProChange((val) => {
          const next = !!val;
          if (next !== _paid) {
            _paid = next;
            emit();
          }
        })
      : undefined;

  return () => {
    if (typeof cb === "function") _subs.delete(cb);
    if (typeof off === "function") off();
  };
}
 
(async () => {
  try {
    const initial = await loadProFromStorage();
    const next = !!initial;
    if (next !== _paid) {
      _paid = next;
      emit();
    }
  } catch {}
})();
 
export async function purchasePremium() {
  return buyPro();
}
 
export async function restorePremium() {
  return _restore();
}
 
export function _setPaidForTesting(val) {
  _paid = !!val;
  emit();
}
