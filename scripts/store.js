import { CHILDREN, PALETTE } from './constants.js';
import { uid } from './utils.js';

export const STORAGE_KEY       = 'kids_schedule_modular_v1';
export const SCHEDULE_JSON_URL = './data/schedule.json';
export const DEFAULT_JSON_URL  = './data/default.json';

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
        school:    Array.isArray(source[child].school)    ? source[child].school    : [],
        academies: Array.isArray(source[child].academies) ? source[child].academies : []
      };
    }
  });
  return normalized;
}

async function tryFetchJson(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) { return null; }
}

/**
 * 로드 우선순위:
 * 1. data/schedule.json  — GitHub에 커밋된 영구 데이터
 * 2. data/default.json   — 초기 샘플
 * 3. localStorage        — 브라우저 로컬 캐시
 * 4. empty
 */
export async function loadState() {
  const scheduleJson = await tryFetchJson(SCHEDULE_JSON_URL);
  if (scheduleJson) {
    state.data = normalizeLoadedData(scheduleJson);
    ensureAcademyIds();
    _saveToLocalStorage();
    return 'schedule.json';
  }

  const defaultJson = await tryFetchJson(DEFAULT_JSON_URL);
  if (defaultJson) {
    state.data = normalizeLoadedData(defaultJson);
    ensureAcademyIds();
    _saveToLocalStorage();
    return 'default.json';
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.data) {
      state.data = normalizeLoadedData(saved);
      return 'localStorage';
    }
  } catch (_) {}

  state.data = emptyData();
  return 'empty';
}

function _saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: state.data }));
  } catch (_) {}
}

function _downloadJson(filename) {
  const payload = JSON.stringify({ data: state.data }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/**
 * saveState — 모든 저장 경로의 공통 입구
 * @param {boolean} downloadJson  true면 schedule.json 다운로드
 */
export function saveState({ downloadJson = false } = {}) {
  _saveToLocalStorage();
  if (downloadJson) _downloadJson('schedule.json');
}

/** 💾 버튼용: localStorage + schedule.json 다운로드 */
export function saveAndDownload() {
  saveState({ downloadJson: true });
}

/** 하위 호환 */
export function exportBackup() { saveAndDownload(); }

export function currentData() { return state.data[state.child]; }
export function defaultColor(index) { return PALETTE[index % PALETTE.length]; }

export function ensureAcademyIds() {
  CHILDREN.forEach(child => {
    state.data[child].school ||= [];
    state.data[child].school.forEach(school => {
      school.id      ||= uid('school');
      school.name    ||= '학교';
      school.start     = '09:00';
      school.end     ||= '13:00';
      school.enabled   = school.enabled !== false;
    });
    state.data[child].academies ||= [];
    state.data[child].academies.forEach((academy, index) => {
      academy.id      ||= uid('academy');
      academy.color   ||= defaultColor(index);
      academy.cost    ||= '';
      academy.transit ||= '';
      academy.memo    ||= '';
      academy.subjects ||= [];
      academy.subjects.forEach(subject => {
        subject.id   ||= uid('subject');
        subject.name ||= subject.subjectName || '';
        subject.sessions ||= [];
        subject.sessions.forEach(session => {
          session.id ||= uid('session');
          if (!session.start && session.sh)
            session.start = `${session.sh}:${session.sm || '00'}`;
          if (!session.end && session.eh)
            session.end = `${session.eh}:${session.em || '00'}`;
        });
      });
    });
  });
}
