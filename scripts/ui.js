import { CHILDREN, DAY_LABELS, DAYS } from './constants.js';
import { state } from './store.js';

export function qs(id) { return document.getElementById(id); }

export function toast(message) {
  const el = qs('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
}

export function openModal(id) {
  const el = qs(id);
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}
export function closeModal(id) {
  const el = qs(id);
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
}

export function renderChildTabs(onChange) {
  const wrap = qs('childTabs');
  wrap.innerHTML = '';
  CHILDREN.forEach(child => {
    const button = document.createElement('button');
    button.className = `ctab ${child === state.child ? 'on' : ''}`;
    button.innerHTML = `<div class="av">${child[0]}</div>${child}`;
    button.onclick = () => { state.child = child; onChange(); };
    wrap.appendChild(button);
  });
}

export function switchView(view) {
  state.view = view;
  qs('viewTimetable').hidden = view !== 'timetable';
  qs('viewStats').hidden = view !== 'stats';
  qs('viewList').hidden = view !== 'list';
  document.querySelectorAll('#viewTabs .tabbtn').forEach(b => b.classList.toggle('on', b.dataset.view === view));
}

export function switchMode(mode) {
  state.mode = mode;
  document.querySelectorAll('#modeTabs .tabbtn').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
}

export function timeOptions(selected='15:00', startHour=9, endHour=20) {
  const out = [];
  for (let h = startHour; h <= endHour; h++) {
    for (const m of ['00','10','20','30','40','50']) {
      const value = `${String(h).padStart(2,'0')}:${m}`;
      out.push(`<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`);
    }
  }
  return out.join('');
}

export function renderLegend(academies) {
  const wrap = qs('legend');
  const academyItems = academies.map(a => `
    <span class="lgi"><span class="lgb academy" style="background:${a.color}22;border-left-color:${a.color}"></span>${a.name}</span>
  `).join('');
  wrap.innerHTML = `
    <span class="lgi"><span class="lgb school"></span>학교</span>
    <span class="lgi"><span class="lgb transit"></span>이동시간</span>
    ${academyItems}
  `;
}

export function renderSchoolEditor(school) {
  const byDay = Object.fromEntries(school.map(s => [s.day, s]));
  qs('schoolEditor').innerHTML = DAYS.map(day => {
    const item = byDay[day] || { day, enabled: false, end: '14:00', name: '학교' };
    return `<div class="school-day" data-day="${day}">
      <strong>${DAY_LABELS[day]}요일</strong>
      <label class="check"><input type="checkbox" data-school-enabled="${day}" ${item.enabled !== false && byDay[day] ? 'checked' : ''}> 표시</label>
      <div class="fgroup"><label>종료시간</label><select data-school-end="${day}">${timeOptions(item.end || '14:00', 9, 20)}</select></div>
    </div>`;
  }).join('');
}
