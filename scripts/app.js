import { currentData, ensureAcademyIds, loadState, saveState, saveAndDownload, state } from './store.js';
import { initModals, openAcademyForm, openSchoolForm } from './modals.js';
import { renderChildTabs, renderLegend, qs, switchMode, switchView, toast, openModal } from './ui.js';
import { renderTimetable, findCurrentBlocks, getNow } from './timetable.js';
import { renderTopStats, renderStats } from './stats.js';
import { renderList } from './list.js';

const DAY_LABELS_KO = { mon:'월', tue:'화', wed:'수', thu:'목', fri:'금', sat:'토', sun:'일' };

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

function showNowModal() {
  const data = currentData();
  const { day, nowMin, results } = findCurrentBlocks(data);
  const nowH = String(Math.floor(nowMin / 60)).padStart(2,'0');
  const nowM = String(nowMin % 60).padStart(2,'0');
  const nowStr = `${nowH}:${nowM}`;
  const dayName = DAY_LABELS_KO[day] || '';
  const isWeekend = day === 'sat' || day === 'sun';

  qs('nowModalTitle').textContent = `⏱ ${dayName}요일 ${nowStr} 현황`;

  const body = qs('nowModalBody');

  if (isWeekend) {
    body.innerHTML = `
      <div style="text-align:center;padding:24px 0 12px;font-size:40px">🏖️</div>
      <div style="text-align:center;color:var(--tx2);font-size:15px;font-weight:600;margin-bottom:6px">주말이에요! 푹 쉬세요 😊</div>
      <div style="text-align:center;color:var(--tx3);font-size:12px;padding-bottom:8px">${dayName}요일 ${nowStr}</div>
    `;
  } else if (results.length === 0) {
    body.innerHTML = `
      <div style="text-align:center;padding:24px 0 12px;font-size:40px">✅</div>
      <div style="text-align:center;color:var(--tx2);font-size:15px;font-weight:600;margin-bottom:6px">지금은 일정이 없어요</div>
      <div style="text-align:center;color:var(--tx3);font-size:12px;padding-bottom:8px">${dayName}요일 ${nowStr} 기준</div>
    `;
  } else {
    const items = results.map(r => `
      <div class="now-item">
        <div class="now-item-dot" style="background:${r.color}"></div>
        <div class="now-item-info">
          <div class="now-item-label">${r.label}</div>
          <div class="now-item-detail">${r.detail}</div>
        </div>
        <div class="now-item-badge" style="background:${r.color}22;color:${r.color};border:1px solid ${r.color}55">
          ${r.kind === 'school' ? '학교' : r.kind === 'transit' ? '이동 중' : '수업 중'}
        </div>
      </div>
    `).join('');
    body.innerHTML = `
      <div style="font-size:11px;color:var(--tx3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px">진행 중인 일정</div>
      ${items}
    `;
  }

  openModal('nowModal');
}

function bindStaticEvents() {
  qs('addButton').addEventListener('click', () => {
    if (state.mode === 'school') openSchoolForm();
    else openAcademyForm();
  });

  const nowBtn = qs('nowButton');
  if (nowBtn) nowBtn.addEventListener('click', showNowModal);

  const saveBtn = qs('saveButton');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    saveAndDownload();
    toast('💾 schedule.json 다운로드! data/ 폴더에 넣고 GitHub에 커밋하세요.');
  });

  const backupButton = qs('backupButton');
  if (backupButton) backupButton.addEventListener('click', () => {
    saveAndDownload();
    toast('💾 schedule.json 다운로드 완료!');
  });

  document.querySelectorAll('#modeTabs .tabbtn').forEach(b =>
    b.addEventListener('click', () => switchMode(b.dataset.mode))
  );
  document.querySelectorAll('#viewTabs .tabbtn').forEach(b =>
    b.addEventListener('click', () => switchView(b.dataset.view))
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
}

async function bootstrap() {
  const source = await loadState();
  ensureAcademyIds();
  saveState();
  showDataSource(source);
  initModals(renderAll);
  bindStaticEvents();
  renderAll();
  switchView('timetable');

  // 1분마다 시간선 자동 갱신
  setInterval(() => renderTimetable(currentData(), openAcademyForm), 60 * 1000);
}

bootstrap();
