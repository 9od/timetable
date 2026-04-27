# 🎒 아이 시간표 관리

초등학생 자녀의 학교·학원 스케줄과 비용을 한눈에 관리하는 GitHub Pages용 정적 웹앱입니다.

## 반영된 개선사항

- `index.html` 단일 파일 구조 제거
- CSS를 `base / layout / components / timetable / modal`로 분리
- JS를 `app / store / modals / timetable / stats / list / ui / utils`로 분리
- 시간표 범위 09:00~20:00 고정
- 범위 밖 일정은 시간표 안에서 클리핑 표시
- 30분 보조선 표시
- 학원별 색상 직접 지정
- 블록에 학원명 명확히 표시
- 시간표 블록 클릭 시 학원 수정 모달 오픈
- 같은 학원·같은 시간대 여러 과목은 세로 누적이 아니라 가로 N분할
- 학교 시간은 요일별 종료시간만 입력, 시작은 09:00 고정

## 파일 구조

```text
/
├─ index.html
├─ styles/
│  ├─ base.css
│  ├─ layout.css
│  ├─ components.css
│  ├─ timetable.css
│  └─ modal.css
└─ scripts/
   ├─ app.js
   ├─ constants.js
   ├─ list.js
   ├─ modals.js
   ├─ stats.js
   ├─ store.js
   ├─ timetable.js
   ├─ ui.js
   └─ utils.js
```

## GitHub Pages 배포

1. 위 파일 구조 그대로 GitHub 저장소에 업로드
2. `Settings → Pages`
3. Source: `Deploy from a branch`
4. Branch: `main`, Folder: `/root`
5. 저장 후 제공되는 Pages 주소로 접속

## 주의

브라우저 `localStorage`에 저장되므로 기기·브라우저가 바뀌면 데이터가 공유되지 않습니다.
