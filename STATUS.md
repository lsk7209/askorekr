# Status | 마지막: 2026-05-10
## 현재 작업
식물 상세 페이지 콘텐츠 확장 완료
## 최근 변경 (최근 5개만)
- 05-10: 식물 상세에 관리 가이드·계절 체크·FAQ 섹션 추가
- 05-10: 홈을 AdSense 검수용 사용자 안내·FAQ·정책 링크 중심으로 보강
- 05-10: sitemap 식물 상세 URL을 실제 렌더링 가능한 plantMetrics 보유 식물로 제한
- 05-10: IndexNow 내부 제출 API와 표준 키 파일 라우트 추가
- 05-10: `/diagnose/[regionCode]/[env]` SSR 결과 페이지와 진단 결과 링크 추가
## TODO
- [ ] OG 이미지/대표 이미지 생성
## 결정사항
- IndexNow 보호 토큰은 `INTERNAL_API_TOKEN`, 키는 `INDEXNOW_KEY` 사용
- IndexNow keyLocation은 `https://askore.kr/{INDEXNOW_KEY}.txt`
- IndexNow payload는 제출 URL origin별로 나눠 `host/keyLocation` 생성
- 대표 도메인: https://askore.kr
- 배포 기준 GitHub: https://github.com/lsk7209/askorekr
- DB: Drizzle + libSQL/Turso 호환 SQLite 스키마 우선
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- dev 서버는 검증 시 http://127.0.0.1:3001 사용
- Vercel 프로젝트: limsubs-projects/askorekr
