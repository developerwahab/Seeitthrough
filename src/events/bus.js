// src/events/bus.js
const listeners = Object.create(null);
 
export function on(event, cb) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb);
  return () => off(event, cb);
}
 
export function off(event, cb) {
  const set = listeners[event];
  if (!set) return;
  set.delete(cb);
  if (set.size === 0) delete listeners[event];  
}
 
export function emit(event, payload) {
  const set = listeners[event];
  if (!set) return; 
  for (const cb of Array.from(set)) {
    try {
      cb(payload);
    } catch (e) { 
    }
  }
}
 
export function once(event, cb) {
  const offFn = on(event, (p) => {
    try {
      cb(p);
    } finally {
      offFn();
    }
  });
  return offFn;
}
 
export function reset() {
  for (const k of Object.keys(listeners)) delete listeners[k];
}
 
export function listenerCount(event) {
  return listeners[event]?.size ?? 0;
}

export const TASKS_UPDATED = 'TASKS_UPDATED';

export function onTasksUpdated(fn) {
  return on(TASKS_UPDATED, fn);
}

export function emitTasksUpdated(payload) {
  emit(TASKS_UPDATED, payload);
}
