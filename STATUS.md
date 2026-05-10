# Status | 마지막: 2026-05-10
## 현재 작업
식물 상세 내부링크 추천 섹션 구현 완료
## 최근 변경 (최근 5개만)
- 05-10: 식물 상세에 같은 카테고리 추천 식물 내부링크 섹션 추가
- 05-10: 카테고리 허브에 선택 가이드·체크리스트·FAQ·JSON-LD 추가
- 05-10: seed 식물을 5개에서 18개로 확장하고 실내/허브/베란다 카테고리 매핑 추가
- 05-10: 동적 OG 이미지 API와 페이지별 og:image 메타 추가
- 05-10: 식물 상세에 관리 가이드·계절 체크·FAQ 섹션 추가
## TODO
- [ ] 최종 AdSense 신청 전 전 페이지 QA
## 결정사항
- IndexNow 보호 토큰은 `INTERNAL_API_TOKEN`, 키는 `INDEXNOW_KEY` 사용
- IndexNow keyLocation은 `https://askore.kr/{INDEXNOW_KEY}.txt`
- IndexNow payload는 제출 URL origin별로 나눠 `host/keyLocation` 생성
- 대표 도메인: https://askore.kr
- 배포 기준 GitHub: https://github.com/lsk7209/askorekr
- DB: Drizzle + libSQL/Turso 호환 SQLite 스키마 우선
## 주의
- 실제 API 키와 Turso 토큰은 커밋하지 않음
- dev 서버는 검증 시 비어있는 3001/3002 포트 사용
- Vercel 프로젝트: limsubs-projects/askorekr
