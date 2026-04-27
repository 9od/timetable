import { CHILDREN, PALETTE } from './constants.js';
import { uid } from './utils.js';

const STORAGE_KEY = 'kids_schedule_modular_v1';

export const state = {
  child: CHILDREN[0],
  mode: 'academy',
  view: 'timetable',
  data: Object.fromEntries(CHILDREN.map(c => [c, { school: [], academies: [] }]))
};

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved?.data) return;
    CHILDREN.forEach(child => {
      if (saved.data[child]) state.data[child] = saved.data[child];
    });
  } catch (_) {}
}

export function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state.data }));
}

export function currentData() { return state.data[state.child]; }

export function defaultColor(index) { return PALETTE[index % PALETTE.length]; }

export function ensureAcademyIds() {
  CHILDREN.forEach(child => {
    state.data[child].academies.forEach((academy, index) => {
      academy.id ||= uid('academy');
      academy.color ||= defaultColor(index);
      academy.subjects ||= [];
      academy.subjects.forEach(subject => {
        subject.id ||= uid('subject');
        subject.sessions ||= [];
        subject.sessions.forEach(session => { session.id ||= uid('session'); });
      });
    });
  });
}
