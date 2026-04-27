# 🎒 아이 시간표 관리

초등학생 자녀의 학원 스케줄과 비용을 한눈에 관리하는 단일 HTML 웹앱입니다.

## ✨ 주요 기능

- **아이별 탭 관리** — 시우, 은우 각각의 시간표 독립 관리
- **시간표 뷰** — 월~금 타임테이블로 시각적 확인
- **과목별 통계** — 주간 수업 시간, 요일별 분포 차트
- **목록 뷰** — 전체 수업 한눈에 보기 + 삭제
- **비용 합산** — 학원별 월 비용 자동 합산
- **로컬 저장** — 브라우저 LocalStorage 자동 저장 (새로고침해도 유지)
- **다크모드** — 시스템 설정에 따라 자동 전환

## 🚀 GitHub Pages 배포 방법

1. 이 저장소를 **Fork** 하거나 새 저장소를 만들어 `index.html` 업로드
2. 저장소 **Settings → Pages**
3. Source: `Deploy from a branch` → `main` 브랜치, `/ (root)` 선택
4. **Save** 클릭 후 잠시 기다리면 `https://[username].github.io/[repo-name]` 으로 접속 가능

## 💻 로컬 실행

별도 설치 없이 `index.html` 파일을 브라우저에서 직접 열면 바로 사용 가능합니다.

## 📱 화면 구성

| 뷰 | 설명 |
|---|---|
| 시간표 | 요일 × 시간 타임테이블. 과목별 컬러 블록 표시 |
| 과목별 통계 | 주간 시간 막대, 요일별 분포 차트 |
| 목록 | 전체 수업 리스트, 개별 삭제 가능 |

## 🛠 기술 스택

- 순수 HTML / CSS / JavaScript (프레임워크 없음)
- Google Fonts (Gmarket Sans, Noto Sans KR)
- 브라우저 LocalStorage 저장

## 아이 추가 방법

`index.html` 내 아래 코드에서 이름 추가:

```javascript
const CHILDREN = ['시우', '은우', '새아이이름'];
```

---

Made with ♥ for 창민's family
