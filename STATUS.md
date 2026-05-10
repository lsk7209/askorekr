# Status | 마지막: 2026-05-10
## 현재 작업
AdSense 수동 슬롯 연결 구조 구현 완료
## 최근 변경 (최근 5개만)
- 05-10: 슬롯 env가 있을 때만 렌더링되는 AdSense 공통 컴포넌트와 위치 연결 추가
- 05-10: 홈 모바일 home-band 가로 overflow 수정 및 브라우저 표면 QA 완료
- 05-10: `llms.txt`, `llms-full.txt`, `ai-index.json`, docs 미러와 QA 검사 추가
- 05-10: 사이트맵 기반 전 페이지 QA 스크립트와 `qa:site` 명령 추가
- 05-10: 식물 상세에 같은 카테고리 추천 식물 내부링크 섹션 추가
## TODO
- [ ] AdSense 신청 전 운영자 계정에서 최종 제출
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
- 광고 슬롯 ID가 없으면 `.adsense-unit`은 렌더링되지 않음
