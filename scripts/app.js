import { currentData, ensureAcademyIds, loadState, saveState, saveAndDownload, state } from './store.js';
import { initModals, openAcademyForm, openSchoolForm } from './modals.js';
import { renderChildTabs, renderLegend, qs, switchMode, switchView, toast } from './ui.js';
import { renderTimetable } from './timetable.js';
import { renderTopStats, renderStats } from './stats.js';
import { renderList } from './list.js';

function renderAll() {
  const data = currentData();
  renderChildTabs(renderAll);
  renderLegend(data.academies || []);
  renderTopStats(data);
  renderTimetable(data, openAcademyForm);
  renderStats(data);
  renderList(data, openAcademyForm, deleteAcademyById);
}

function deleteAcademyById(id) {
  const list = currentData().academies;
  const index = list.findIndex(a => a.id === id);
  if (index >= 0) list.splice(index, 1);
  saveState();
  toast('삭제했습니다');
  renderAll();
}

function bindStaticEvents() {
  qs('addButton').addEventListener('click', () => {
    if (state.mode === 'school') openSchoolForm();
    else openAcademyForm();
  });

  // 💾 저장 버튼 — localStorage + schedule.json 다운로드
  const saveBtn = qs('saveButton');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveAndDownload();
      toast('💾 schedule.json 다운로드 완료! data/ 폴더에 넣고 GitHub에 커밋하세요.');
    });
  }

  // (구) 백업 버튼 하위호환
  const backupButton = qs('backupButton');
  if (backupButton) backupButton.addEventListener('click', () => {
    saveAndDownload();
    toast('💾 schedule.json 다운로드 완료!');
  });

  document.querySelectorAll('#modeTabs .tabbtn').forEach(button =>
    button.addEventListener('click', () => switchMode(button.dataset.mode))
  );
  document.querySelectorAll('#viewTabs .tabbtn').forEach(button =>
    button.addEventListener('click', () => switchView(button.dataset.view))
  );
}

function showDataSource(source) {
  const badge = qs('dataSourceBadge');
  if (!badge) return;
  const labels = {
    'schedule.json': { text: '📁 schedule.json', cls: 'src-file' },
    'default.json':  { text: '📄 default.json',  cls: 'src-default' },
    'localStorage':  { text: '🖥 로컬 저장',      cls: 'src-local' },
    'empty':         { text: '🆕 새 데이터',       cls: 'src-empty' },
  };
  const info = labels[source] || { text: source, cls: '' };
  badge.textContent = info.text;
  badge.className = `data-source-badge ${info.cls}`;
  badge.title = source === 'schedule.json'
    ? 'GitHub repo의 data/schedule.json을 불러왔습니다'
    : source === 'localStorage'
    ? '브라우저 로컬 저장 데이터입니다. 💾 저장 버튼으로 schedule.json을 생성하세요.'
    : '';
}

async function bootstrap() {
  const source = await loadState();
  ensureAcademyIds();
  saveState();          // localStorage 동기화
  showDataSource(source);
  initModals(renderAll);
  bindStaticEvents();
  renderAll();
  switchView('timetable');
}

bootstrap();
