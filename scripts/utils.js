export function minutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}
export function toHHMM(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
export function durationHours(start, end) { return Math.max(0, end - start) / 60; }
export function money(value) { return '₩' + Number(value || 0).toLocaleString('ko-KR'); }
export function uid(prefix='id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
export function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
export function textColor(bg) {
  const c = bg.replace('#','');
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  const yiq = (r*299 + g*587 + b*114) / 1000;
  return yiq >= 145 ? '#241F18' : '#FFFFFF';
}
export function tint(hex, alpha='22') { return `${hex}${alpha}`; }
