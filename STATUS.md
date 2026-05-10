# Status | 마지막: 2026-05-10
## 현재 작업
식물 seed 데이터 18개 확장 및 운영 검증 완료
## 최근 변경 (최근 5개만)
- 05-10: seed 식물을 5개에서 18개로 확장하고 실내/허브/베란다 카테고리 매핑 추가
- 05-10: 동적 OG 이미지 API와 페이지별 og:image 메타 추가
- 05-10: 식물 상세에 관리 가이드·계절 체크·FAQ 섹션 추가
- 05-10: 홈을 AdSense 검수용 사용자 안내·FAQ·정책 링크 중심으로 보강
- 05-10: sitemap 식물 상세 URL을 실제 렌더링 가능한 plantMetrics 보유 식물로 제한
## TODO
- [ ] 카테고리 허브 본문 확장
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
