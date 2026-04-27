import { DAY_LABELS } from './constants.js';
import { durationHours, minutes, money, tint } from './utils.js';

export function renderList(data, onEditAcademy, onDeleteAcademy) {
  const wrap = document.getElementById('eventList');
  const count = document.getElementById('listCount');
  wrap.innerHTML = '';
  let total = 0;

  if ((data.school || []).length) {
    wrap.insertAdjacentHTML('beforeend', '<div class="lgrp">🏫 학교</div>');
    data.school.forEach(s => {
      total++;
      wrap.insertAdjacentHTML('beforeend', `<div class="ei"><div class="edot" style="background:var(--school)"></div><div class="einfo"><div class="ename">학교</div><div class="emeta2">${DAY_LABELS[s.day]}요일 09:00 ~ ${s.end}</div></div><div class="ecost"></div></div>`);
    });
  }

  if ((data.academies || []).length) {
    wrap.insertAdjacentHTML('beforeend', '<div class="lgrp">🎒 학원</div>');
    data.academies.forEach(academy => {
      total++;
      const subjects = (academy.subjects || []).map(subject => {
        const tags = (subject.sessions || []).map(session => `<span class="etag" style="background:${tint(academy.color, '22')};color:${academy.color}">${DAY_LABELS[session.day]} ${session.start}~${session.end}</span>`).join('');
        const hours = (subject.sessions || []).reduce((sum, s) => sum + durationHours(minutes(s.start), minutes(s.end)), 0);
        return `<div style="margin-bottom:5px"><div class="esubj">📖 ${subject.name} <span style="color:var(--tx3);font-size:10px">${hours.toFixed(1)}h/주</span></div><div class="etags">${tags}</div></div>`;
      }).join('');
      const row = document.createElement('div');
      row.className = 'ei';
      row.innerHTML = `<div class="edot" style="background:${academy.color}"></div><div class="einfo"><div class="ename">${academy.name}${academy.transit ? ' 🚗'+academy.transit+'분' : ''}${academy.memo ? ' · '+academy.memo : ''}</div>${subjects}</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0"><div class="ecost">${academy.cost ? money(academy.cost) : ''}</div><button class="bdel" data-edit="${academy.id}">수정</button><button class="bdel" data-delete="${academy.id}">삭제</button></div>`;
      wrap.appendChild(row);
    });
  }

  if (!total) wrap.innerHTML = '<div class="empty"><span>📋</span>아직 등록된 수업이 없습니다</div>';
  count.textContent = `총 ${total}개`;
  wrap.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => onEditAcademy(button.dataset.edit)));
  wrap.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => onDeleteAcademy(button.dataset.delete)));
}
