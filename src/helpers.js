import { MILESTONES, STAGES, MATRIX, KS_MAP } from './constants.js';

export function getWeekStart() {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-d.getDay()); return d.getTime();
}
export function getMonthStart() {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(1); return d.getTime();
}
export function getTermStart() {
  const d = new Date(); d.setHours(0,0,0,0);
  const m = d.getMonth(), y = d.getFullYear();
  if (m < 4) d.setMonth(0,1); else if (m < 8) d.setMonth(4,1); else d.setMonth(8,1);
  d.setFullYear(y); return d.getTime();
}
export function getHalfTermStart() {
  const d = new Date(); d.setHours(0,0,0,0);
  const m = d.getMonth();
  if (m<2) d.setMonth(0,6); else if (m<4) d.setMonth(2,1);
  else if (m<6) d.setMonth(3,21); else if (m<8) d.setMonth(5,1);
  else if (m<10) d.setMonth(8,1); else d.setMonth(10,1);
  return d.getTime();
}

export function filterByPeriod(logs, period) {
  if (period === "All Time") return logs;
  const c = period==="Weekly" ? getWeekStart() : period==="Monthly" ? getMonthStart() : getTermStart();
  return logs.filter(l => l.timestamp >= c);
}

export function meritTotal(logs, sid) {
  return logs.filter(l => l.studentId===sid && l.type==="merit" && l.status!=="overturned").reduce((s,l) => s+l.points, 0);
}
export function demeritTotal(logs, sid) {
  return Math.abs(logs.filter(l => l.studentId===sid && l.type==="demerit" && l.status!=="overturned" && l.status!=="appealing").reduce((s,l) => s+l.points, 0));
}
export function netPoints(logs, sid) {
  return logs.filter(l => l.studentId===sid && l.status!=="overturned").reduce((s,l) => s+l.points, 0);
}

export function studentStage(htLogs, sid) {
  const d = demeritTotal(htLogs, sid);
  return [...STAGES].reverse().find(s => d >= s.pts) || null;
}
export function studentMilestone(allML, sid) {
  const t = meritTotal(allML, sid);
  return [...MILESTONES].reverse().find(m => t >= m.pts) || null;
}

export function behavLabel(id, customMatrix) {
  const search = m => { for (const c of m) { const it = c.items.find(i => i.id===id); if (it) return it.label; } return null; };
  return (customMatrix && search(customMatrix)) || search(MATRIX) || 'Unknown';
}

export function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"numeric"});
}

export function pointColor(pts) { return pts >= 0 ? "#22c55e" : "#ef4444"; }

export function getKS(g) { return KS_MAP[g?.split("/")?.[0]] || ""; }
