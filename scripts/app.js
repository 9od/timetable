import { currentData, ensureAcademyIds, loadState, saveState, state } from './store.js';
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
  document.querySelectorAll('#modeTabs .tabbtn').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
  document.querySelectorAll('#viewTabs .tabbtn').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
}

loadState();
ensureAcademyIds();
saveState();
initModals(renderAll);
bindStaticEvents();
renderAll();
switchView('timetable');
