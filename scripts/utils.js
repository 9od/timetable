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

function hexToRgb(hex) {
  const c = String(hex || '#6c5ce7').replace('#','');
  return {
    r: parseInt(c.slice(0,2),16),
    g: parseInt(c.slice(2,4),16),
    b: parseInt(c.slice(4,6),16)
  };
}
function rgbToHex({ r, g, b }) {
  return '#' + [r,g,b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2,'0')).join('');
}
export function mixColor(hex, target = '#ffffff', weight = 0.85) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex({
    r: a.r * (1 - weight) + b.r * weight,
    g: a.g * (1 - weight) + b.g * weight,
    b: a.b * (1 - weight) + b.b * weight
  });
}
export function blockBg(hex) { return mixColor(hex, '#ffffff', 0.84); }
export function transitBg(hex) { return mixColor(hex, '#ffffff', 0.93); }
export function blockText(hex) { return mixColor(hex, '#111827', 0.50); }
