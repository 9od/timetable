import { DAY_LABELS, DAYS } from './constants.js';
import { currentData, saveState, defaultColor } from './store.js';
import { minutes, uid } from './utils.js';
import { closeModal, openModal, qs, renderSchoolEditor, timeOptions, toast } from './ui.js';

let draftSubjects = [];
let afterSave = () => {};

function newSession(day='mon') { return { id: uid('session'), day, start: '15:00', end: '17:00' }; }
function newSubject() { return { id: uid('subject'), name: '', sessions: [newSession()] }; }

export function initModals(renderAll) {
  afterSave = renderAll;
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(button.dataset.close)));
  document.querySelectorAll('.overlay').forEach(overlay => overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); }));
  qs('addSubjectButton').addEventListener('click', () => { draftSubjects.push(newSubject()); renderSubjectEditor(); });
  qs('saveAcademyButton').addEventListener('click', saveAcademy);
  qs('deleteAcademyButton').addEventListener('click', deleteAcademy);
  qs('saveSchoolButton').addEventListener('click', saveSchool);
}

export function openAcademyForm(academyId=null) {
  const academy = academyId ? currentData().academies.find(a => a.id === academyId) : null;
  qs('academyEditId').value = academy?.id || '';
  qs('academyModalTitle').innerHTML = academy ? '🎒 학원 수정 <span class="mbadge ba">학원</span>' : '🎒 학원 등록 <span class="mbadge ba">학원</span>';
  qs('academyName').value = academy?.name || '';
  qs('academyColor').value = academy?.color || defaultColor(currentData().academies.length);
  qs('academyCost').value = academy?.cost || '';
  qs('academyTransit').value = academy?.transit || '';
  qs('academyMemo').value = academy?.memo || '';
  qs('deleteAcademyButton').hidden = !academy;
  draftSubjects = academy ? structuredClone(academy.subjects || []) : [newSubject()];
  renderSubjectEditor();
  openModal('academyModal');
}

export function openSchoolForm() {
  renderSchoolEditor(currentData().school || []);
  openModal('schoolModal');
}

function renderSubjectEditor() {
  qs('subjectEditor').innerHTML = draftSubjects.map((subject, si) => `
    <div class="subj-item" data-subject-index="${si}">
      <div class="subj-head">
        <div class="fgroup"><label>과목명</label><input data-subject-name="${si}" value="${subject.name || ''}" placeholder="예: 영어, 수학, 라이팅"></div>
        <button class="btn-xs" data-delete-subject="${si}" ${draftSubjects.length === 1 ? 'style="visibility:hidden"' : ''}>과목 삭제</button>
      </div>
      <div>
        ${(subject.sessions || []).map((session, ssi) => `
          <div class="session-row">
            <div class="fgroup"><label>요일</label><select data-session-field="day" data-si="${si}" data-ssi="${ssi}">${DAYS.map(d => `<option value="${d}" ${session.day === d ? 'selected' : ''}>${DAY_LABELS[d]}</option>`).join('')}</select></div>
            <div class="fgroup"><label>시작</label><select data-session-field="start" data-si="${si}" data-ssi="${ssi}">${timeOptions(session.start || '15:00')}</select></div>
            <div class="fgroup"><label>종료</label><select data-session-field="end" data-si="${si}" data-ssi="${ssi}">${timeOptions(session.end || '17:00')}</select></div>
            <button class="btn-xs" data-delete-session="${si}:${ssi}" ${(subject.sessions || []).length === 1 ? 'style="visibility:hidden"' : ''}>삭제</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-xs" data-add-session="${si}" style="margin-top:8px">+ 요일 추가</button>
    </div>
  `).join('');

  document.querySelectorAll('[data-subject-name]').forEach(el => el.addEventListener('input', () => { draftSubjects[+el.dataset.subjectName].name = el.value; }));
  document.querySelectorAll('[data-session-field]').forEach(el => el.addEventListener('change', () => { draftSubjects[+el.dataset.si].sessions[+el.dataset.ssi][el.dataset.sessionField] = el.value; }));
  document.querySelectorAll('[data-add-session]').forEach(el => el.addEventListener('click', () => {
    const si = +el.dataset.addSession;
    const last = draftSubjects[si].sessions.at(-1) || newSession();
    const nextDay = DAYS[(DAYS.indexOf(last.day) + 1) % DAYS.length];
    draftSubjects[si].sessions.push(newSession(nextDay));
    renderSubjectEditor();
  }));
  document.querySelectorAll('[data-delete-session]').forEach(el => el.addEventListener('click', () => {
    const [si, ssi] = el.dataset.deleteSession.split(':').map(Number);
    draftSubjects[si].sessions.splice(ssi, 1);
    renderSubjectEditor();
  }));
  document.querySelectorAll('[data-delete-subject]').forEach(el => el.addEventListener('click', () => {
    draftSubjects.splice(+el.dataset.deleteSubject, 1);
    renderSubjectEditor();
  }));
}

function saveAcademy() {
  const id = qs('academyEditId').value || uid('academy');
  const name = qs('academyName').value.trim();
  if (!name) return toast('학원명을 입력해주세요');

  const subjects = draftSubjects.map(subject => ({
    ...subject,
    name: (subject.name || '').trim(),
    sessions: (subject.sessions || []).map(session => ({ ...session }))
  }));

  for (const subject of subjects) {
    if (!subject.name) return toast('과목명을 입력해주세요');
    if (!subject.sessions.length) return toast('과목별 수업 시간을 하나 이상 입력해주세요');
    for (const session of subject.sessions) {
      if (minutes(session.end) <= minutes(session.start)) return toast(`${subject.name} ${DAY_LABELS[session.day]}요일 시간을 확인해주세요`);
    }
  }

  const academy = {
    id,
    name,
    color: qs('academyColor').value,
    cost: qs('academyCost').value,
    transit: qs('academyTransit').value,
    memo: qs('academyMemo').value.trim(),
    subjects
  };

  const list = currentData().academies;
  const idx = list.findIndex(a => a.id === id);
  if (idx >= 0) list[idx] = academy;
  else list.push(academy);
  saveState();
  closeModal('academyModal');
  toast('학원 시간이 저장됐습니다');
  afterSave();
}

function deleteAcademy() {
  const id = qs('academyEditId').value;
  if (!id) return;
  const list = currentData().academies;
  const idx = list.findIndex(a => a.id === id);
  if (idx >= 0) list.splice(idx, 1);
  saveState();
  closeModal('academyModal');
  toast('삭제했습니다');
  afterSave();
}

function saveSchool() {
  const school = [];
  DAYS.forEach(day => {
    const checked = document.querySelector(`[data-school-enabled="${day}"]`).checked;
    const end = document.querySelector(`[data-school-end="${day}"]`).value;
    if (checked) school.push({ id: uid('school'), day, name: '학교', start: '09:00', end, enabled: true });
  });
  currentData().school = school;
  saveState();
  closeModal('schoolModal');
  toast('학교 시간이 저장됐습니다');
  afterSave();
}
