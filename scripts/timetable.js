import { DAY_CLASSES, DAY_LABELS, DAYS, END_MIN, ROW_HEIGHT, SLOT_MIN, START_MIN } from './constants.js';
import { blockBg, blockText, clamp, minutes, transitBg, toHHMM } from './utils.js';

const GRID_ROW_OFFSET = 2;
const DAY_COL_OFFSET = 2;

const JS_DAY_TO_KEY = ['sun','mon','tue','wed','thu','fri','sat'];

/** 현재 요일(mon..fri)과 분 반환 */
export function getNow() {
  const d = new Date();
  return { day: JS_DAY_TO_KEY[d.getDay()], nowMin: d.getHours() * 60 + d.getMinutes() };
}

/** 현재 시간에 겹치는 블록 목록 반환 */
export function findCurrentBlocks(data) {
  const { day, nowMin } = getNow();
  const results = [];

  (data.school || []).filter(s => s.enabled !== false && s.day === day).forEach(s => {
    const start = minutes('09:00'), end = minutes(s.end);
    if (nowMin >= start && nowMin < end)
      results.push({ kind: 'school', label: '학교', detail: `~${s.end}`, color: '#4A5568' });
  });

  (data.academies || []).forEach(ac => {
    const transit = Number(ac.transit) || 0;
    (ac.subjects || []).forEach(sub => {
      (sub.sessions || []).filter(s => s.day === day).forEach(s => {
        const start = minutes(s.start), end = minutes(s.end);
        if (nowMin >= start && nowMin < end)
          results.push({ kind: 'academy', label: `${ac.name} · ${sub.name}`, detail: `${s.start}~${s.end}`, color: ac.color });
        if (transit > 0 && nowMin >= start - transit && nowMin < start)
          results.push({ kind: 'transit', label: `🚗 이동 (${ac.name})`, detail: `→ ${s.start}`, color: ac.color });
        if (transit > 0 && nowMin >= end && nowMin < end + transit)
          results.push({ kind: 'transit', label: `🚗 귀가 (${ac.name})`, detail: `${s.end}~`, color: ac.color });
      });
    });
  });

  return { day, nowMin, results };
}

function schoolBlocks(data) {
  return (data.school || []).map(s => ({
    type: 'school', id: s.id, day: s.day,
    start: minutes('09:00'), end: minutes(s.end), school: s
  }));
}

function academySessionItems(academy) {
  const items = [];
  (academy.subjects || []).forEach(subject => {
    (subject.sessions || []).forEach(session => {
      const start = minutes(session.start);
      const end = minutes(session.end);
      if (end > start) items.push({ academy, subject, session, day: session.day, start, end });
    });
  });
  return items;
}

function groupAcademyItems(items) {
  const byDay = new Map();
  items.forEach(item => {
    if (!byDay.has(item.day)) byDay.set(item.day, []);
    byDay.get(item.day).push(item);
  });

  const groups = [];
  byDay.forEach((dayItems, day) => {
    dayItems.sort((a, b) => a.start - b.start || a.end - b.end);
    let current = null;
    dayItems.forEach(item => {
      if (!current || item.start > current.end) {
        current = { day, start: item.start, end: item.end, items: [item] };
        groups.push(current);
      } else {
        current.items.push(item);
        current.end = Math.max(current.end, item.end);
      }
    });
  });
  return groups;
}

function academyBlocks(data) {
  const blocks = [];
  (data.academies || []).forEach(academy => {
    const transit = Number(academy.transit) || 0;
    groupAcademyItems(academySessionItems(academy)).forEach(group => {
      blocks.push({
        type: 'academyGroup',
        id: `${academy.id}_${group.day}_${group.start}_${group.end}`,
        day: group.day, start: group.start, end: group.end, academy, items: group.items
      });
      if (transit > 0) {
        blocks.push({ type: 'transit', phase: 'before', day: group.day, start: group.start - transit, end: group.start, academy, id: `${academy.id}_before_${group.day}_${group.start}` });
        blocks.push({ type: 'transit', phase: 'after',  day: group.day, start: group.end, end: group.end + transit, academy, id: `${academy.id}_after_${group.day}_${group.end}` });
      }
    });
  });
  return blocks;
}

function rowStart(minute) { return GRID_ROW_OFFSET + Math.floor((minute - START_MIN) / SLOT_MIN); }
function rowSpan(start, end) { return Math.max(1, Math.ceil((end - start) / SLOT_MIN)); }
function dayCol(day) { return DAY_COL_OFFSET + DAYS.indexOf(day); }

function clipBlock(block) {
  const clippedStart = clamp(block.start, START_MIN, END_MIN);
  const clippedEnd   = clamp(block.end,   START_MIN, END_MIN);
  if (clippedEnd <= START_MIN || clippedStart >= END_MIN || clippedEnd <= clippedStart) return null;
  return { ...block, clippedStart, clippedEnd, clipped: block.start < START_MIN || block.end > END_MIN };
}

/** 현재 시간선 그리기 */
function renderNowLine(grid) {
  const { day, nowMin } = getNow();
  const dayIndex = DAYS.indexOf(day);
  if (dayIndex < 0) return; // 주말
  if (nowMin < START_MIN || nowMin >= END_MIN) return;

  // 시간 라벨 열에 가로선
  const row = rowStart(nowMin);
  const progressWithinRow = ((nowMin - START_MIN) % SLOT_MIN) / SLOT_MIN;
  const topOffset = progressWithinRow * ROW_HEIGHT;

  const line = document.createElement('div');
  line.id = 'nowLine';
  line.className = 'now-line';
  line.style.gridColumn = `1 / span ${DAYS.length + 1}`;
  line.style.gridRow = String(row);
  line.style.top = `${topOffset}px`;
  grid.appendChild(line);

  // 해당 요일 칸 강조 점
  const dot = document.createElement('div');
  dot.className = 'now-dot';
  dot.style.gridColumn = String(dayIndex + DAY_COL_OFFSET);
  dot.style.gridRow = String(row);
  dot.style.top = `${topOffset - 5}px`;
  grid.appendChild(dot);
}

export function renderTimetable(data, onEditAcademy) {
  const grid = document.getElementById('timetableGrid');
  grid.innerHTML = '';
  const rows = (END_MIN - START_MIN) / SLOT_MIN;
  grid.style.gridTemplateRows = `34px repeat(${rows}, ${ROW_HEIGHT}px)`;

  const corner = document.createElement('div');
  corner.className = 'tt-head tt-corner';
  grid.appendChild(corner);

  const { day: todayKey } = getNow();

  DAYS.forEach((day, idx) => {
    const head = document.createElement('div');
    head.className = `tt-head tt-day ${DAY_CLASSES[day]}${day === todayKey ? ' today' : ''}`;
    head.style.gridColumn = String(idx + DAY_COL_OFFSET);
    head.style.gridRow = '1';
    head.textContent = DAY_LABELS[day];
    if (day === todayKey) {
      const badge = document.createElement('span');
      badge.className = 'today-badge';
      badge.textContent = '오늘';
      head.appendChild(badge);
    }
    grid.appendChild(head);
  });

  for (let i = 0; i < rows; i++) {
    const minute = START_MIN + i * SLOT_MIN;
    const gridRow = i + GRID_ROW_OFFSET;
    const isHour = minute % 60 === 0;
    const isHalf = minute % 30 === 0;

    const time = document.createElement('div');
    time.className = `time-cell ${isHour ? 'hour-line' : isHalf ? 'half-line' : ''}`;
    time.style.gridColumn = '1';
    time.style.gridRow = String(gridRow);
    time.textContent = isHour ? toHHMM(minute) : '';
    grid.appendChild(time);

    DAYS.forEach((day, idx) => {
      const cell = document.createElement('div');
      cell.className = `slot-cell ${isHour ? 'hour-line' : isHalf ? 'half-line' : ''}${day === todayKey ? ' today-col' : ''}`;
      cell.style.gridColumn = String(idx + DAY_COL_OFFSET);
      cell.style.gridRow = String(gridRow);
      grid.appendChild(cell);
    });
  }

  [...schoolBlocks(data), ...academyBlocks(data)].map(clipBlock).filter(Boolean).forEach(block => {
    if (block.type === 'academyGroup') renderAcademyGroup(grid, block, onEditAcademy);
    if (block.type === 'transit')      renderTransit(grid, block);
    if (block.type === 'school')       renderSchool(grid, block);
  });

  renderNowLine(grid);
}

function renderSchool(grid, block) {
  const el = document.createElement('div');
  el.className = 'tt-block tt-school';
  el.style.gridColumn = String(dayCol(block.day));
  el.style.gridRow = `${rowStart(block.clippedStart)} / span ${rowSpan(block.clippedStart, block.clippedEnd)}`;
  el.innerHTML = `<div class="name">학교</div><div class="meta">${DAY_LABELS[block.day]}요일</div><div class="time">09:00~${toHHMM(block.end)}${block.clipped ? ' <span class="clip-badge">clip</span>' : ''}</div>`;
  grid.appendChild(el);
}

function renderTransit(grid, block) {
  const color = block.academy.color;
  const el = document.createElement('div');
  el.className = 'tt-block tt-transit';
  el.style.gridColumn = String(dayCol(block.day));
  el.style.gridRow = `${rowStart(block.clippedStart)} / span ${rowSpan(block.clippedStart, block.clippedEnd)}`;
  el.style.background = transitBg(color);
  el.style.borderLeftColor = color;
  el.style.color = blockText(color);
  const label = block.phase === 'before' ? '이동(갈 때)' : '이동(올 때)';
  el.innerHTML = `<div class="name">🚗 ${label}</div><div class="meta">${block.academy.name}</div><div class="time">${toHHMM(block.start)}~${toHHMM(block.end)}${block.clipped ? ' <span class="clip-badge">clip</span>' : ''}</div>`;
  grid.appendChild(el);
}

function renderAcademyGroup(grid, block, onEditAcademy) {
  const group = document.createElement('div');
  group.className = 'tt-group';
  group.style.gridColumn = String(dayCol(block.day));
  group.style.gridRow = `${rowStart(block.clippedStart)} / span ${rowSpan(block.clippedStart, block.clippedEnd)}`;
  group.title = `${block.academy.name} 수정`;
  group.addEventListener('click', () => onEditAcademy(block.academy.id));

  const color = block.academy.color;
  const groupDuration = Math.max(1, block.end - block.start);

  block.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'tt-block tt-subblock';
    el.style.background = blockBg(color);
    el.style.borderLeftColor = color;
    el.style.color = blockText(color);

    const overlapping = block.items
      .filter(other => other.start < item.end && other.end > item.start)
      .sort((a, b) => a.start - b.start || a.end - b.end || a.subject.name.localeCompare(b.subject.name));
    const parallelCount = overlapping.length;
    const parallelIndex = Math.max(0, overlapping.findIndex(other => other.session.id === item.session.id));
    const topPct    = ((item.start - block.start) / groupDuration) * 100;
    const heightPct = ((item.end   - item.start)  / groupDuration) * 100;
    const widthPct  = 100 / parallelCount;
    const leftPct   = parallelIndex * widthPct;

    el.style.top    = `${topPct}%`;
    el.style.height = `calc(${heightPct}% - 2px)`;
    el.style.left   = `calc(${leftPct}% + 1px)`;
    el.style.width  = `calc(${widthPct}% - 2px)`;
    el.innerHTML = `<div class="name">${item.subject.name}</div><div class="meta">${block.academy.name}</div><div class="time">${toHHMM(item.start)}~${toHHMM(item.end)}${block.clipped ? ' <span class="clip-badge">clip</span>' : ''}</div>`;
    group.appendChild(el);
  });
  grid.appendChild(group);
}
