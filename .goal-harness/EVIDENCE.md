# Evidence

## 2026-10-23 시작
- HEAD 19d01f5, clean main. 기존 하네스/PROJECT_STATE 없음, STATUS.md를 기존 인수 자료로 확인.
- 기존 TODO에서 진단 V2와 native 모바일 메뉴를 이번 수직 범위로 선택.
- 비용/시간: primary 현재 세션 모델 유지. 읽기 전용 하위 조사 gpt-6-luna/max 1개. Spark selectable 아님. 토큰·비용 미측정. 시작 약 2026-10-23 세션 내 도구 시간 기준; 정확한 경과는 최종 검증 시 기록.

## 2026-10-23 최종 검증 (KST 약 08:55)
Validation level: 5 (격리 샘플 데이터 실제 시나리오). 운영 검증은 아님.

| Command | Result |
|---|---|
| pnpm.cmd test | exit 0, 8/8. 기존 Node MODULE_TYPELESS_PACKAGE_JSON 경고 있음 |
| pnpm.cmd lint | exit 0, 오류 0, 기존 plant-detail-content.tsx img 경고 1 |
| pnpm.cmd build | exit 0, 43페이지. 최종 CSS 변경 후 격리 QA DB로 다시 빌드 성공 |
| pnpm.cmd type-check | exit 0 (next typegen + tsc), 최초 성공 build 이후 실행. 이후 TS 변경 없음 |
| impeccable detect --json (변경 UI 파일) | [] |
| git diff --check | exit 0, CRLF 자동 변환 안내만 있음 |
| playwright-cli run-code --filename=.goal-harness/browser-flow.txt | 프로덕션 next start에서 성공. 실제 API/화면 결과 수 일치, dog+cat 필터, 공유 query·조건·결과 일치 |
| playwright-cli run-code --filename=.goal-harness/browser-states.txt | 성공. 지연 성공/실패, 비JSON·네트워크 오류 복구, 0건, 지표 결측 확인 |
| playwright-cli run-code --filename=.goal-harness/browser-accessibility.txt --raw | 6개 검사 모두 violations: [] |

### UI/상태 증거
- 입력 폭 1440/1024/881/880/640/390/320, 공유 결과 폭 1440/880/390/320: document.scrollWidth <= innerWidth.
- native 메뉴 Enter로 열기, Escape 닫힘과 summary 포커스 복귀, 같은 경로 링크 닫힘 확인.
- JS disabled 새 브라우저 context의 390px 메뉴 열기/소개 이동 성공.
- 프로덕션 흐름 중 pageerror 0. 기존 AdSense data-nscript 경고 및 route CSS preload 경고는 별개로 관찰됨.
- abort를 무시하는 fetch 대체로 지역/환경/안전/광량/경험/관리 시간 6종 변경 후 과거 응답이 화면을 채우지 않음을 실제 React 화면에서 확인. 실패 응답도 무시.
- 별도 qa-empty.db와 dev 3002: 지역 없음 status 표시, option 0개, 제출 disabled 확인.
- axe: /tools/diagnose, /diagnose/11680/indoor?safety=dog%2Ccat, / × 1440/390. 실제 footer 끝까지 스크롤해 content-visibility 렌더 이후 검사.
- 로컬 스크린샷: output/playwright/{diagnose-desktop,diagnose-mobile,menu-mobile,result-desktop,diagnose-no-regions}.png. desktop/메뉴/공유 화면 시각 검토 완료.

### 격리/보존
- .goal-harness/qa-diagnose.db를 새로 생성해 drizzle/*.sql을 순서대로 적용하고, TURSO_DATABASE_URL을 해당 file: 경로로 강제한 자식 프로세스에서 scripts/seed-sample.mjs 실행. 3지역/18종. qa-empty.db는 스키마만 생성. 파일은 Git ignore 대상.
- 원본 local.db에는 쓰기 명령을 보내지 않음. 두 차례 관찰 SHA256 동일: 3240BE487670A035E08FFC4FF11958620BAFD234EA3FB9097FBDCF3009758700 (세션 시작 시점 hash라는 의미는 아님).
- 추천/안전 점수 로직, DB 스키마, 원래 URL, analytics/layout 태그 수정 없음. 외부 DB/서버/배포/커밋/푸시 없음.

### 실패·수리 기록
1. 초기 dev 브라우저 검사 중 반복 Fast Refresh 및 일시적 JSON 파싱 500으로 locator 대기 timeout. 검증 산출물을 .gitignore에 추가하고 dev를 종료한 후 프로덕션 build/start로 전환, 동일 실제 흐름 재검증 성공. 로그 쓰기와 개발 watcher 간 상호작용이 의심되지만 정확한 내부 트리거는 미확정이며 제품 코드 원인으로 단정하지 않음.
2. 첫 axe 모바일 검사에서 화면 밖 footer의 배경을 body 색으로 계산해 대비 경고 발생. 실제 screenshot과 계산 스타일로 어두운 배경을 확인했으며, footer 끝까지 스크롤한 검사에서는 위반 0. footer 코드/색상은 수정하지 않음.
3. 적용 전 패치 hunk 오류 2회는 쓰기 전 거절되어 수정 후 적용. 테스트 약화 없음.

### Review / Limits
- 같은 gpt-6-luna/max 읽기 전용 agent에 탐색 후 최종 diff 리뷰 재사용. substantiated blocker 없음.
- 실기 스크린리더, CLS, 운영 데이터/광고 실노출, OVH 최신 상태는 미검증.
- 실제 총 시간·토큰·비용은 계측하지 않음. 재작업: 개발 QA를 production QA로 전환 1회, offscreen axe 검사 보정 1회.

## GitHub push 후 OVH 자동 배포 확인 요청
사용자가 GitHub push가 OVH 자동 배포로 연결됨을 알려주고 서버 환경 파일 경로를 제공했다. 기존 배포 구성이 없다는 과거 기록은 현재 확인된 사실로 취급하지 않는다.

Risk Notice:
- Task: 검증한 진단 V2/메뉴 변경 커밋·GitHub push 및 read-only 반영 확인.
- Why Needed: 사용자 요청한 기존 OVH 자동 배포 흐름 실행.
- Impact Scope: askorekr main push와 기존 자동 배포 트리거. 서버/DB/환경설정 직접 변경 없음.
- Rollback: 필요 시 해당 커밋을 revert하여 별도 push. 자동 롤백 수행 없음.
- Safer Alternative: push 전 diff·기존 검증 증거 확인, push 후 remote SHA·CI·공개 페이지 확인.
- Approval Needed: 현재 사용자 요청으로 승인됨. 추가 승인 요청 없음.
- 제공 파일 값은 출력/커밋하지 않고 접속에만 사용. known_hosts의 기존 호스트 키를 검증하는 RejectPolicy 사용.
- SSH 비밀번호 인증은 서버 publickey-only 정책으로 거절됨. 공개 사이트 사전 확인 HTTP 200/OVH 응답이나 새 native summary/form-heading 없음.
