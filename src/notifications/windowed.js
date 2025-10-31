// src/notifications/windowed.js
import { scheduleExact } from './notifeeExact';
 
const STEP = { AGGRESSIVE: 30*60, MEDIUM: 3*60*60, MILD: 12*60*60 };

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const minsToHM = (m) => ({ h: Math.floor(m/60), m: m%60 });
const atHM = (d, h, m) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);

function nextWindowStart(from, startMins) {
  const now = new Date(from);
  const nowM = now.getHours()*60 + now.getMinutes();
  const { h, m } = minsToHM(startMins);
  if (nowM < startMins) return atHM(now, h, m);
  const tmr = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return atHM(tmr, h, m);
}
 
function computeUpcomingShots({ now, startMins, endMins, stepSec, maxShots = 8 }) {
  startMins = clamp(startMins ?? 9*60, 0, 1439);
  endMins   = clamp(endMins   ?? 20*60, 1, 1440);
  const stepMs = Math.max(stepSec, 5) * 1000;

  const { h: sh, m: sm } = minsToHM(startMins);
  const { h: eh, m: em } = minsToHM(endMins);

  const todayStart = atHM(now, sh, sm);
  const todayEnd   = atHM(now, eh, em);
  const inside = now >= todayStart && now < todayEnd;
 
  let first;
  if (!inside) {
    first = now < todayStart ? todayStart : nextWindowStart(now, startMins);
  } else { 
    const k = Math.ceil((now - todayStart) / stepMs);
    first = new Date(todayStart.getTime() + k * stepMs);
    if (first <= now) first = new Date(now.getTime() + stepMs); 
    if (first >= todayEnd) first = nextWindowStart(now, startMins);
  }

  const out = [];
  let cursor = new Date(first);
 
  const withinWindow = (d) => {
    const m = d.getHours()*60 + d.getMinutes();
    return m >= startMins && m < endMins;
  };

  while (out.length < maxShots) { 
    const dStart = atHM(cursor, sh, sm);
    const dEnd   = atHM(cursor, eh, em);
    if (cursor < dStart) cursor = new Date(dStart);
 
    if (out.length > 0) {
      const last = out[out.length - 1];
      const minNext = new Date(last.getTime() + stepMs);
      if (cursor < minNext) cursor = minNext;
    }
 
    if (!withinWindow(cursor) || cursor >= dEnd) {
      cursor = nextWindowStart(cursor, startMins); 
      if (out.length > 0) {
        const last = out[out.length - 1];
        const minNext = new Date(last.getTime() + stepMs);
        if (cursor < minNext) cursor = minNext;
      }
    }
 
    if (cursor > now) out.push(new Date(cursor));
 
    cursor = new Date(cursor.getTime() + stepMs);
  }

  return out;
}

export async function scheduleTaskAlarmsWindowed(task, { channelId } = {}) {
  try {
    const taskId = String(task?.taskId ?? task?.id ?? Date.now());
    const title  = `${task?.title ?? 'Task'}`;
    const body   = `${task?.why ?? ''}`.trim();

    const intensity = String(task?.intensity || 'MEDIUM').toUpperCase();
    const stepSec   = STEP[intensity] ?? STEP.MEDIUM;

    const startMins = (typeof task?.windowStartMins === 'number') ? task.windowStartMins : 9*60;
    const endMins   = (typeof task?.windowEndMins   === 'number') ? task.windowEndMins   : 20*60;

    const shots = computeUpcomingShots({
      now: new Date(),
      startMins,
      endMins,
      stepSec,
      maxShots: 8,
    });
 
    let nextAt = shots.find(d => d.getTime() - Date.now() > 5000);
    if (!nextAt) { 
      const nws = nextWindowStart(new Date(), startMins); 
      const last = shots[shots.length - 1];
      const minNext = last ? new Date(last.getTime() + stepSec*1000) : nws;
      nextAt = (minNext > nws) ? minNext : nws;
    }
  
let delaySec = Math.floor((nextAt.getTime() - Date.now()) / 1000);
const now = new Date();
const { h: sH, m: sM } = minsToHM(startMins);
const todayStart = atHM(now, sH, sM);
const isBeforeStart = (now.getHours()*60 + now.getMinutes()) < startMins;
const hitsWindowStart = Math.abs(nextAt.getTime() - todayStart.getTime()) < 1000;

if (!(isBeforeStart && hitsWindowStart) && delaySec < stepSec) {
  delaySec = stepSec;
}


    await scheduleExact({
      timestampMs: Date.now() + delaySec * 1000,
      title,
      body,
      id: `task-${taskId}`,
      channelId: channelId || 'sit_blunt',
    });
  } catch (e) {
    console.warn('scheduleTaskAlarmsWindowed failed', e);
  }
}
