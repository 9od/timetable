import { DAY_LABELS, DAYS } from './constants.js';
import { durationHours, minutes, money } from './utils.js';

const SUBJECT_CHART_ID = 'subjectChart';
const DAY_CHART_ID = 'dayChart';

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

function normalizeSubjectName(name) {
  return String(name || '').trim() || '미지정';
}

function buildSubjectStats(data) {
  const map = new Map();

  (data.academies || []).forEach(academy => {
    const subjects = academy.subjects || [];
    const subjectCount = Math.max(1, subjects.length);
    const costShare = Math.round((Number(academy.cost) || 0) / subjectCount);

    subjects.forEach(subject => {
      const key = normalizeSubjectName(subject.name);
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          academies: new Set(),
          hours: 0,
          count: 0,
          cost: 0,
          color: academy.color || '#6c5ce7'
        });
      }
      const stat = map.get(key);
      stat.academies.add(academy.name);
      stat.cost += costShare;
      (subject.sessions || []).forEach(session => {
        stat.hours += durationHours(minutes(session.start), minutes(session.end));
        stat.count += 1;
      });
    });
  });

  return [...map.values()].sort((a, b) => b.hours - a.hours || a.name.localeCompare(b.name));
}

function buildDayStats(data) {
  const dayHours = Object.fromEntries(DAYS.map(day => [day, 0]));

  (data.academies || []).forEach(academy => {
    (academy.subjects || []).forEach(subject => {
      (subject.sessions || []).forEach(session => {
        if (dayHours[session.day] === undefined) return;
        dayHours[session.day] += durationHours(minutes(session.start), minutes(session.end));
      });
    });
  });

  return DAYS.map(day => ({
    day,
    label: DAY_LABELS[day],
    hours: Number(dayHours[day].toFixed(2))
  }));
}

function showChartFallback(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="empty"><span>📊</span>${message}</div>`;
}

function renderSubjectChart(subjectStats) {
  const container = document.getElementById(SUBJECT_CHART_ID);
  if (!container) return;

  if (!subjectStats.length) {
    showChartFallback(SUBJECT_CHART_ID, '수업을 추가하면 과목별 통계가 나타납니다');
    return;
  }

  if (!window.Highcharts) {
    showChartFallback(SUBJECT_CHART_ID, 'Highcharts 로딩에 실패했습니다. 인터넷 연결 또는 CDN 차단 여부를 확인하세요.');
    return;
  }

  Highcharts.chart(SUBJECT_CHART_ID, {
    chart: {
      type: 'bar',
      backgroundColor: 'transparent',
      height: Math.max(280, subjectStats.length * 56)
    },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: subjectStats.map(item => item.name),
      title: { text: null },
      labels: { style: { fontFamily: 'Noto Sans KR, sans-serif', fontSize: '12px' } }
    },
    yAxis: {
      min: 0,
      title: { text: '주간 시간(h)' },
      allowDecimals: true
    },
    tooltip: {
      useHTML: true,
      formatter() {
        const item = subjectStats[this.point.index];
        return `<b>${item.name}</b><br/>주간 시간: ${item.hours.toFixed(1)}h<br/>수업 횟수: ${item.count}회<br/>학원: ${[...item.academies].join(', ')}<br/>월 비용 배분: ${money(item.cost)}`;
      }
    },
    plotOptions: {
      series: {
        borderRadius: 6,
        dataLabels: {
          enabled: true,
          formatter() { return `${this.y.toFixed(1)}h`; }
        }
      }
    },
    series: [{
      name: '과목별 주간 시간',
      data: subjectStats.map(item => ({
        y: Number(item.hours.toFixed(2)),
        color: item.color
      }))
    }]
  });
}

function renderDayChart(dayStats) {
  const container = document.getElementById(DAY_CHART_ID);
  if (!container) return;

  if (!window.Highcharts) {
    showChartFallback(DAY_CHART_ID, 'Highcharts 로딩에 실패했습니다. 인터넷 연결 또는 CDN 차단 여부를 확인하세요.');
    return;
  }

  Highcharts.chart(DAY_CHART_ID, {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: 320
    },
    title: { text: null },
    credits: { enabled: false },
    legend: { enabled: false },
    xAxis: {
      categories: dayStats.map(item => item.label),
      title: { text: null },
      labels: { style: { fontFamily: 'Noto Sans KR, sans-serif', fontSize: '12px' } }
    },
    yAxis: {
      min: 0,
      title: { text: '주간 시간(h)' },
      allowDecimals: true
    },
    tooltip: {
      pointFormatter() { return `학원 시간: <b>${this.y.toFixed(1)}h</b>`; }
    },
    plotOptions: {
      series: {
        borderRadius: 6,
        dataLabels: {
          enabled: true,
          formatter() { return this.y > 0 ? `${this.y.toFixed(1)}h` : ''; }
        }
      }
    },
    series: [{
      name: '요일별 학원 시간',
      data: dayStats.map(item => Number(item.hours.toFixed(2)))
    }]
  });
}

function renderStatsSummary(subjectStats, dayStats) {
  const subjectTotal = subjectStats.reduce((sum, item) => sum + item.hours, 0);
  const busiestDay = [...dayStats].sort((a, b) => b.hours - a.hours)[0];
  const topSubject = subjectStats[0];
  const summary = document.getElementById('statsSummary');
  if (!summary) return;

  summary.innerHTML = `
    <div class="sc"><div class="slbl">과목 수</div><div class="sval vp">${subjectStats.length}개</div></div>
    <div class="sc"><div class="slbl">학원 총 시간</div><div class="sval vo">${subjectTotal.toFixed(1)}h</div></div>
    <div class="sc"><div class="slbl">가장 바쁜 요일</div><div class="sval vt">${busiestDay && busiestDay.hours > 0 ? `${busiestDay.label} ${busiestDay.hours.toFixed(1)}h` : '-'}</div></div>
    <div class="sc"><div class="slbl">최다 과목</div><div class="sval vb">${topSubject ? `${topSubject.name} ${topSubject.hours.toFixed(1)}h` : '-'}</div></div>
  `;
}

export function renderStats(data) {
  const subjectStats = buildSubjectStats(data);
  const dayStats = buildDayStats(data);
  renderStatsSummary(subjectStats, dayStats);
  renderSubjectChart(subjectStats);
  renderDayChart(dayStats);
}
