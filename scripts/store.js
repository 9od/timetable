import { CHILDREN, PALETTE } from './constants.js';
import { uid } from './utils.js';

export const STORAGE_KEY = 'kids_schedule_modular_v1';
export const DEFAULT_DATA_URL = './data/default.json';

export const state = {
  child: CHILDREN[0],
  mode: 'academy',
  view: 'timetable',
  data: Object.fromEntries(CHILDREN.map(c => [c, { school: [], academies: [] }]))
};

function emptyData() {
  return Object.fromEntries(CHILDREN.map(c => [c, { school: [], academies: [] }]));
}

function normalizeLoadedData(payload) {
  const source = payload?.data || payload || {};
  const normalized = emptyData();
  CHILDREN.forEach(child => {
    if (source[child]) {
      normalized[child] = {
        school: Array.isArray(source[child].school) ? source[child].school : [],
        academies: Array.isArray(source[child].academies) ? source[child].academies : []
      };
    }
  });
  return normalized;
}

export async function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.data) {
      state.data = normalizeLoadedData(saved);
      return 'localStorage';
    }
  } catch (_) {}

  try {
    const res = await fetch(DEFAULT_DATA_URL, { cache: 'no-store' });
    if (res.ok) {
      const initial = await res.json();
      state.data = normalizeLoadedData(initial);
      ensureAcademyIds();
      saveState();
      return 'default.json';
    }
  } catch (_) {}

  state.data = emptyData();
  return 'empty';
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state.data }));
}

export function currentData() { return state.data[state.child]; }

export function defaultColor(index) { return PALETTE[index % PALETTE.length]; }

export function ensureAcademyIds() {
  CHILDREN.forEach(child => {
    state.data[child].school ||= [];
    state.data[child].school.forEach(school => {
      school.id ||= uid('school');
      school.name ||= '학교';
      school.start = '09:00';
      school.end ||= '13:00';
      school.enabled = school.enabled !== false;
    });
    state.data[child].academies ||= [];
    state.data[child].academies.forEach((academy, index) => {
      academy.id ||= uid('academy');
      academy.color ||= defaultColor(index);
      academy.cost ||= '';
      academy.transit ||= '';
      academy.memo ||= '';
      academy.subjects ||= [];
      academy.subjects.forEach(subject => {
        subject.id ||= uid('subject');
        subject.name ||= subject.subjectName || '';
        subject.sessions ||= [];
        subject.sessions.forEach(session => {
          session.id ||= uid('session');
          if (!session.start && session.sh) session.start = `${session.sh}:${session.sm || '00'}`;
          if (!session.end && session.eh) session.end = `${session.eh}:${session.em || '00'}`;
        });
      });
    });
  });
}

export function exportBackup() {
  const data = localStorage.getItem(STORAGE_KEY) || JSON.stringify({ data: state.data }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kids-schedule-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
