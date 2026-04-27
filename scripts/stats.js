import { DAY_LABELS, DAYS } from './constants.js';
import { durationHours, minutes, money, tint } from './utils.js';

export function renderTopStats(data) {
  let cost = 0, count = 0, hours = 0;
  const academies = new Set();
  (data.academies || []).forEach(academy => {
    cost += Number(academy.cost) || 0;
    academies.add(academy.name);
    (academy.subjects || []).forEach(subject => (subject.sessions || []).forEach(session => {
      count += 1;
      hours += durationHours(minutes(session.start), minutes(session.end));
    }));
  });
  document.getElementById('statCost').textContent = money(cost);
  document.getElementById('statCount').textContent = `${count} 회`;
  document.getElementById('statHours').textContent = `${hours.toFixed(1)} 시간`;
  document.getElementById('statAcademies').textContent = `${academies.size} 곳`;
}

export function renderStats(data) {
  const subjectStats = [];
  (data.academies || []).forEach(academy => {
    const n = Math.max(1, (academy.subjects || []).length);
    (academy.subjects || []).forEach(subject => {
      const hours = (subject.sessions || []).reduce((sum, s) => sum + durationHours(minutes(s.start), minutes(s.end)), 0);
      subjectStats.push({ name: subject.name, academy: academy.name, hours, count: subject.sessions.length, cost: Math.round((Number(academy.cost) || 0) / n), color: academy.color });
    });
  });
  const wrap = document.getElementById('subjectStats');
  wrap.innerHTML = '';
  if (!subjectStats.length) {
    wrap.innerHTML = '<div class="empty"><span>📊</span>수업을 추가하면 통계가 나타납니다</div>';
  } else {
    const max = Math.max(...subjectStats.map(s => s.hours), 0.1);
    subjectStats.sort((a,b) => b.hours - a.hours).forEach(stat => {
      const card = document.createElement('div');
      card.className = 'ssc';
      card.innerHTML = `<div class="ssico" style="background:${tint(stat.color, '22')};color:${stat.color}">${stat.name[0]}</div>
        <div class="ssinf"><div class="ssn">${stat.name}</div><div class="sssb">${stat.academy}</div><div class="ssbw"><div class="ssbar" style="width:${Math.round(stat.hours/max*100)}%;background:${stat.color}"></div></div><div class="ssmt">주 ${stat.count}회 · ${money(stat.cost)}/월</div></div>
        <div class="ssh">${stat.hours.toFixed(1)}<small style="font-size:10px;color:var(--tx3)">h</small></div>`;
      wrap.appendChild(card);
    });
  }

  const dayHours = Object.fromEntries(DAYS.map(d => [d, 0]));
  (data.academies || []).forEach(academy => (academy.subjects || []).forEach(subject => (subject.sessions || []).forEach(session => {
    dayHours[session.day] += durationHours(minutes(session.start), minutes(session.end));
  })));
  const dayWrap = document.getElementById('dayBars');
  const maxDay = Math.max(...Object.values(dayHours), 0.1);
  dayWrap.innerHTML = DAYS.map(day => `<div class="dbrw"><div class="dbrv">${dayHours[day] ? dayHours[day].toFixed(1)+'h' : ''}</div><div class="dbro"><div class="dbri" style="height:${Math.round(dayHours[day]/maxDay*100)}%;min-height:${dayHours[day] ? '4px' : '0'};background:#6C5CE7"></div></div><div class="dbrl">${DAY_LABELS[day]}</div></div>`).join('');
}
