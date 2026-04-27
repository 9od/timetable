import { DAY_CLASSES, DAY_LABELS, DAYS, END_MIN, ROW_HEIGHT, SLOT_MIN, START_MIN } from './constants.js';
import { clamp, minutes, textColor, tint, toHHMM } from './utils.js';

const GRID_ROW_OFFSET = 2;
const DAY_COL_OFFSET = 2;

function academyBlocks(data) {
  const blocks = [];
  (data.academies || []).forEach(academy => {
    const transit = Number(academy.transit) || 0;
    const sessionsByDayStart = new Map();

    (academy.subjects || []).forEach(subject => {
      (subject.sessions || []).forEach(session => {
        const start = minutes(session.start);
        const end = minutes(session.end);
        const key = `${session.day}:${start}`;
        if (!sessionsByDayStart.has(key)) sessionsByDayStart.set(key, []);
        sessionsByDayStart.get(key).push({ academy, subject, session, start, end });
      });
    });

    // 같은 학원 과목 중 같은 시작 시간대는 하나의 큰 블록으로 묶고 내부를 가로 N분할한다.
    sessionsByDayStart.forEach(items => {
      const day = items[0].session.day;
      const start = Math.min(...items.map(i => i.start));
      const end = Math.max(...items.map(i => i.end));
      blocks.push({
        type: 'academyGroup',
        id: academy.id,
        day,
        start,
        end,
        academy,
        items
      });
      if (transit > 0) {
        blocks.push({ type: 'transit', day, start: start - transit, end: start, academy, id: `${academy.id}_transit_${day}_${start}` });
      }
    });
  });
  return blocks;
}

function schoolBlocks(data) {
  return (data.school || []).map(s => ({ type: 'school', id: s.id, day: s.day, start: minutes('09:00'), end: minutes(s.end), school: s }));
}

function rowStart(minute) { return GRID_ROW_OFFSET + Math.floor((minute - START_MIN) / SLOT_MIN); }
function rowSpan(start, end) { return Math.max(1, Math.ceil((end - start) / SLOT_MIN)); }
function dayCol(day) { return DAY_COL_OFFSET + DAYS.indexOf(day); }

function clipBlock(block) {
  const clippedStart = clamp(block.start, START_MIN, END_MIN);
  const clippedEnd = clamp(block.end, START_MIN, END_MIN);
  if (clippedEnd <= START_MIN || clippedStart >= END_MIN || clippedEnd <= clippedStart) return null;
  return { ...block, clippedStart, clippedEnd, clipped: block.start < START_MIN || block.end > END_MIN };
}

export function renderTimetable(data, onEditAcademy) {
  const grid = document.getElementById('timetableGrid');
  grid.innerHTML = '';
  const rows = (END_MIN - START_MIN) / SLOT_MIN;
  grid.style.gridTemplateRows = `34px repeat(${rows}, ${ROW_HEIGHT}px)`;

  const corner = document.createElement('div');
  corner.className = 'tt-head tt-corner';
  grid.appendChild(corner);

  DAYS.forEach((day, idx) => {
    const head = document.createElement('div');
    head.className = `tt-head tt-day ${DAY_CLASSES[day]}`;
    head.style.gridColumn = String(idx + DAY_COL_OFFSET);
    head.style.gridRow = '1';
    head.textContent = DAY_LABELS[day];
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
      cell.className = `slot-cell ${isHour ? 'hour-line' : isHalf ? 'half-line' : ''}`;
      cell.style.gridColumn = String(idx + DAY_COL_OFFSET);
      cell.style.gridRow = String(gridRow);
      grid.appendChild(cell);
    });
  }

  const blocks = [...schoolBlocks(data), ...academyBlocks(data)].map(clipBlock).filter(Boolean);
  blocks.forEach(block => {
    if (block.type === 'academyGroup') renderAcademyGroup(grid, block, onEditAcademy);
    if (block.type === 'transit') renderTransit(grid, block);
    if (block.type === 'school') renderSchool(grid, block);
  });
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
  el.style.background = tint(color, '22');
  el.style.borderLeftColor = color;
  el.style.color = textColor('#ffffff');
  el.innerHTML = `<div class="name">🚗 이동</div><div class="meta">${block.academy.name}</div><div class="time">${toHHMM(block.start)}~${toHHMM(block.end)}${block.clipped ? ' <span class="clip-badge">clip</span>' : ''}</div>`;
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
  block.items.forEach(item => {
    const el = document.createElement('div');
    el.className = 'tt-block';
    el.style.background = tint(color, '26');
    el.style.borderLeftColor = color;
    el.style.color = textColor('#ffffff');
    el.innerHTML = `<div class="name">${item.subject.name}</div><div class="meta">${block.academy.name}</div><div class="time">${toHHMM(item.start)}~${toHHMM(item.end)}${block.clipped ? ' <span class="clip-badge">clip</span>' : ''}</div>`;
    group.appendChild(el);
  });
  grid.appendChild(group);
}
