# 🎒 아이 시간표

초등학생 자녀의 학원 스케줄과 비용을 한눈에 관리하는 웹앱입니다.

## 💾 데이터 저장 방식

GitHub Pages는 서버가 없어서 파일을 직접 쓸 수 없습니다.  
대신 **"💾 저장" 버튼 + GitHub 커밋** 2단계로 영구 저장합니다.

### 저장 흐름

```
앱에서 편집
    ↓
"💾 저장" 버튼 클릭
    ↓
schedule.json 자동 다운로드 + 브라우저 localStorage 저장
    ↓
다운로드된 schedule.json → repo의 data/ 폴더에 복사
    ↓
GitHub에 커밋 & 푸시
    ↓
다음 방문 때 schedule.json 자동 로드 ✅
```

### 로드 우선순위

| 순서 | 소스 | 배지 색상 |
|------|------|-----------|
| 1 | `data/schedule.json` (GitHub 커밋 데이터) | 🟢 초록 |
| 2 | `data/default.json` (초기 샘플) | 🟡 노랑 |
| 3 | localStorage (브라우저 로컬) | 🟣 보라 |
| 4 | 빈 데이터 | 회색 |

화면 우측 상단 배지로 현재 어디서 로드했는지 확인할 수 있습니다.

## 🚀 GitHub Pages 배포

1. https://github.com/9od/timetable 저장소에 파일 업로드
2. **Settings → Pages → Source: main / (root) → Save**
3. https://9od.github.io/timetable 접속

## 📁 파일 구조

```
timetable/
├── index.html
├── data/
│   ├── schedule.json   ← 💾 저장 버튼으로 생성되는 파일 (여기에 커밋)
│   └── default.json    ← 초기 샘플 데이터
├── scripts/
│   ├── app.js
│   ├── store.js        ← 저장/로드 로직
│   ├── timetable.js
│   ├── modals.js
│   ├── stats.js
│   ├── list.js
│   ├── ui.js
│   ├── utils.js
│   └── constants.js
└── styles/
    ├── base.css
    ├── layout.css
    ├── components.css
    ├── timetable.css
    └── modal.css
```

## 아이 추가

`scripts/constants.js`에서:
```js
export const CHILDREN = ['시우', '은우', '새아이'];
```
