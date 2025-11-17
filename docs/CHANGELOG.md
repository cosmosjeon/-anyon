# Zero-Git & Plan Stage Delivery Log

본 파일은 Phase별 완료 내역과 외부 의존 준비 상태를 추적하기 위한 단일 소스입니다. 각 Phase가 완료될 때마다 ✅ 로 마킹하고, 필요한 경우 관련 PR/문서 링크를 추가하세요.

## Phase 0 – AI Plan Stage (1.5주)
- [ ] DB 스키마 적용 (`plan_questions`, `plan_conversations`, `tasks.plan_summary`)
- [ ] TaskClarificationService 배포 및 단위 테스트 보고
- [ ] PlanTaskDialog 릴리스 (Kanban `planning` 컬럼 포함)
- [ ] AI 질문/요약 품질 리뷰 완료 (샘플 5건)
- [ ] AI/GitHub 토큰 체크리스트 아래 항목 충족 (Plan Stage용)

## Phase 1 – Zero-Git 핵심 자동화 (2주)
- [ ] GitAutomationService (`sync_before_start`, `auto_commit`, `push_branch`) 릴리스
- [ ] Container/Server 통합, Start/Complete API 통합 테스트 통과
- [ ] Complete Dialog + TS 타입 생성
- [ ] Git sync 로그 및 Telemetry 대시보드 초안 공유
- [ ] AI/GitHub 토큰 체크리스트 아래 항목 충족 (Zero-Git용)

## Phase 2 – Webhook & 실시간 (1주)
- [ ] GitHub Webhook Handler 배포 및 서명 검증 테스트
- [ ] SSE/SSE-hook 기반 실시간 업데이트 확인 (머지→Done 자동 이동)
- [ ] GitHub Sandbox 레포에서 이벤트 리플레이 10건 성공 로그 첨부

## Phase 3 – 고급 기능 (2주)
- [ ] 자동 Rebase 파이프라인 베타 플래그 생성
- [ ] AI 충돌 해결 실험 2건 이상 보고
- [ ] Notification & Dashboard 기능의 GA 여부 결정 (Feature flag 상태 기록)

## Week 6 – 테스트 & 배포
- [ ] 회귀/부하 테스트 성적 공유
- [ ] 운영/지원 문서(README, 사용자 가이드) 최종 업데이트
- [ ] 롤백/온보딩 플레이북 링크 추가

---

## 외부 의존 체크리스트
| 항목 | 설명 | 상태 | 담당 |
|------|------|------|------|
| AI API Key | `PLAN_STAGE_AI_PROVIDER`, `PLAN_STAGE_AI_API_KEY` 설정 (Plan Stage/Zero-Git 공통) | ☐ | |
| GitHub Token/App | `ZERO_GIT_GITHUB_TOKEN` 또는 GitHub App 설치 (repo + pull_request scope) | ☐ | |
| GitHub Webhook Secret | `GITHUB_WEBHOOK_SECRET` 환경변수 및 GitHub 설정 | ☐ | |
| Sandbox Repository | 자동화/웹훅을 테스트할 개인 레포 (예: `zero-git-sandbox`) | ☐ | |
| MCP Client Backward Compatibility | 기존 MCP 사용자가 영향받지 않는지 확인 (Feature flag) | ☐ | |

> 체크리스트는 Phase 시작 전에 모두 체크되어야 하며, 변경 시 본 파일을 최신화하세요.
