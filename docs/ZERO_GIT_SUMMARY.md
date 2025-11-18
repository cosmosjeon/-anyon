# Zero-Git 자동화 시스템 + AI Plan Stage - 실행 요약

> **"Git을 몰라도, 요구사항 불명확해도 완벽한 협업 개발"**

**작성일:** 2025-11-17
**업데이트:** 2025-11-17 (Plan Stage 추가)
**예상 기간:** 7.5주 (Phase 0 1.5주 + Phase 1 2주 + Phase 2 1주 + Phase 3 2주 + Week 6 통합 테스트 1주)
**투입 인력:** Backend 1명, Frontend 1명
**문서 역할:** KPI, 사용자 가치, ROI 요약을 제공하며 세부 설계/일정은 각각 `ZERO_GIT_ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`를 참조합니다.

---

## 🎯 핵심 목표

1. 🆕 **AI Plan Stage**: Task 개발 전 요구사항 명확화로 재작업 50% 감소
2. **Zero-Git 자동화**: Git 명령어를 한 번도 사용하지 않고 Anyon 칸반 보드만으로 팀 협업 개발 완료

> **최근 업데이트 (2025-11-XX):** PlanTaskDialog, Kanban `planning` 컬럼, Planning API를 배포해 Phase 0 UI/백엔드를 연동했습니다. 남은 Phase 0 액션은 품질 리뷰 및 AI/GitHub 토큰 체크이며, 완료 시 Phase 1로 전환합니다.

---

## 📊 Before & After

| 항목 | Before (수동) | After (자동 + Plan) | 개선율 |
|------|--------------|-------------|--------|
| 🆕 **재작업 발생률** | 30% | **15%** | **50%** ✨ |
| 🆕 **AI 개발 정확도** | 70% | **90%** | **29%** ✨ |
| 🆕 **요구사항 명확도** | 60% | **95%** | **58%** ✨ |
| **Git 명령어 사용** | 9회 | **0회** | **100%** ✨ |
| **Task 시작 시간** | 3분 | **30초** | **83%** |
| **PR 생성 시간** | 5분 | **10초** | **96%** |
| **실수 가능성** | 높음 | **거의 없음** | - |
| **학습 곡선** | 가파름 | **거의 없음** | - |

---

## 🚀 사용자 워크플로우

### Before (수동, 10단계)
```
1. [사용자] Task 생성
2. [사용자] 터미널: git pull origin main        ← Git 명령어
3. [사용자] Anyon: "Start" 클릭
4. [시스템] Worktree 생성
5. [AI] 코드 작성
6. [사용자] 터미널: git add . && git commit    ← Git 명령어
7. [사용자] 터미널: git push                   ← Git 명령어
8. [사용자] GitHub: PR 생성
9. [사용자] GitHub: PR Merge
10. [사용자] Anyon: "Done" 수동 표시

❌ 사용자가 해야 할 일: 7단계
❌ Git 명령어: 9회
```

### After (자동 + Plan Stage, 4단계)
```
1. [사용자] Task 생성
2. 🆕 [사용자] "Plan" 클릭
   └─► [AI] Task 분석 및 질문 생성
   └─► [사용자] 질문에 답변
   └─► [AI] 명확한 요구사항 문서 생성
   └─► [자동] 상태 → "Planning"
3. [사용자] "Start Development" 클릭
   └─► [자동] git pull
   └─► [자동] Worktree 생성
   └─► [자동] 브랜치 push
   └─► [자동] 상태 → "In Progress"
4. [AI] 명확화된 요구사항 기반 코드 작성
5. [사용자] "Complete" 클릭
   └─► [자동] git commit
   └─► [자동] git push
   └─► [자동] PR 생성
   └─► [자동] 상태 → "In Review"
6. [사용자] GitHub: Merge 클릭
   └─► [Webhook] 상태 → "Done" 자동

✅ 사용자가 해야 할 일: 4단계 (Plan 추가로 1단계 증가하지만 재작업 50% 감소!)
✅ Git 명령어: 0회
✅ 재작업: 거의 없음 (명확한 요구사항)
```

---

## 🏗️ 시스템 구조

```
Frontend                  Backend                    GitHub
┌──────────┐            ┌──────────┐              ┌──────────┐
│          │            │          │              │          │
│ Kanban   │────HTTP───►│ Git Auto │◄────Push────│ Repo     │
│ Board    │            │ Service  │────Pull────►│          │
│          │            │          │◄──Webhook───│ PR Events│
│ Complete │            │ Webhook  │              │          │
│ Dialog   │            │ Handler  │              │          │
└──────────┘            └──────────┘              └──────────┘
     │                        │
     │                        │
     └──────SSE──────────────┘
        (실시간 상태 업데이트)
```

---

## 📋 구현 계획 (7.5주)

이 요약은 경영진 시야를 위한 **마일스톤/가치 중심** 뷰입니다. 날짜·담당자·작업 세부는 `IMPLEMENTATION_PLAN.md`를 참고하세요.

| Phase | 기간 | 비즈니스 임팩트 | 주요 산출물 | KPI 게이트 |
|-------|------|----------------|-------------|------------|
| Phase 0 – AI Plan Stage | 1.5주 | 재작업률 50% 감소, 요구사항 명확도 95% 달성 | Plan DB/서비스, Planning 컬럼 UI, 요약 전달 파이프 | Plan Summary 품질 리뷰 + SQLx/FE smoke test |
| Phase 1 – 핵심 Git 자동화 | 2주 | Git 명령어 0회, Task 시작 30초 | GitAutomationService, Container/Server 통합, Complete Dialog | Start/Complete API 통합테스트 + 로컬 Git sandbox 성공 |
| Phase 2 – Webhook & 실시간 | 1주 | PR Merge→Done 100% 자동화 | GitHub Webhook Handler, SSE 업데이트 | GitHub sandbox 이벤트 리플레이 10건 무오류 |
| Phase 3 – 고급 기능 | 2주 | 충돌 처리 시간 50% 단축, 팀 가시성 향상 | 자동 Rebase, AI conflict assist, 알림/대시보드 | Feature flag 하에 dogfooding, 충돌 재현 2건 해결 |
| Week 6 – 테스트 & 배포 | 1주 | Beta→GA 결정 | 회귀/부하 테스트, 문서 패키징, 롤백 플레이북 | 전 스위트 통과 + 운영 승인 |

보조 지침
- Phase 간 의존성(Plan Summary → Git Automation → Webhook Telemetry → Conflict Resolution)을 명시적으로 관리합니다.
- Backend 1명/Frontend 1명 구성을 유지하기 위해 FE 집중 주(Phase0/Phase3)와 BE 집중 주(Phase1/2)를 번갈아 배치했습니다.
- 모든 마일스톤 결과는 `docs/CHANGELOG.md`와 KPI 대시보드에 바로 반영합니다.

---

## 🔧 핵심 기술 컴포넌트

### 1. Git Automation Service (새로 구현)
**위치:** `crates/services/src/services/git_automation.rs`

**주요 함수:**
```rust
// Task 시작 전 자동 동기화
pub async fn sync_before_start(
    &self,
    project: &Project,
    target_branch: &str,
) -> Result<SyncResult, GitAutomationError>;

// Task 완료 후 자동 push + PR
pub async fn auto_complete(
    &self,
    task_attempt: &TaskAttempt,
    request: AutoCompleteRequest,
) -> Result<PullRequestInfo, GitAutomationError>;
```

### 2. Webhook Handler (새로 구현)
**위치:** `crates/server/src/routes/webhooks.rs`

**처리 이벤트:**
- `pull_request.opened` → 로그만 기록
- `pull_request.closed` (merged) → Task 자동 완료

### 3. Database 스키마 (확장)
**새 테이블:**
- `git_sync_logs` - Git 동기화 기록
- `webhook_events` - Webhook 이벤트 로그

**확장 컬럼 (task_attempts):**
- `auto_synced` - 자동 동기화 여부
- `auto_pushed` - 자동 push 여부
- `pr_auto_created` - PR 자동 생성 여부

### 4. API 엔드포인트 (신규)
```
POST /api/task-attempts/{id}/complete
POST /api/webhooks/github
GET  /api/task-attempts/{id}/sync-status
```

---

## 💰 투자 대비 효과

### 개발 비용
- Backend 개발자: 7.5주 (Plan 1.5주 + Zero-Git 6주)
- Frontend 개발자: 2.5주 (병렬)
- **총 개발 시간:** 10주-인력

### 절감 효과 (5명 팀 기준)

**1. Git 자동화 절감:**
- 팀원 1명당: 주 2시간 절약 (Git 작업)
- 5명 팀: **주 10시간 절약**

**2. 🆕 Plan Stage 절감:**
- 재작업 50% 감소 → 팀원 1명당 주 3시간 절약
- 5명 팀: **주 15시간 절약**

**총 절감:**
- 5명 팀: **주 25시간 절약**
- 연간: **1,300시간 (6.5개월 인력) 절약**

### ROI
- Break-even: **4주 후** (Plan Stage로 더 빨라짐!)
- 1년 투자 수익: **13배** (기존 6.5배 → 2배 증가)

---

## 🎯 성공 지표

### 기술 지표
- ✅ 단위 테스트 커버리지: 80%+
- ✅ API 응답 시간: 평균 500ms 이하
- ✅ Webhook 처리 시간: 1초 이하

### 사용성 지표
- ✅ Git 명령어 사용: **0회**
- ✅ Task 완료 시간: **50% 단축**
- ✅ 사용자 만족도: **4.5/5 이상**

### 비즈니스 지표
- ✅ 팀 생산성: **20% 향상**
- ✅ 온보딩 시간: **50% 감소**
- ✅ 에러율: **30% 감소**

---

## ⚠️ 주요 위험 및 완화 전략

| 위험 | 확률 | 영향 | 완화 전략 |
|------|------|------|----------|
| Git 충돌 복잡도 | 높음 | 높음 | Phase 3로 연기, AI 해결 추가 |
| GitHub API Rate Limit | 중간 | 중간 | Rate Limiter + 캐싱 |
| Webhook 신뢰성 | 낮음 | 높음 | Retry + 이벤트 큐 |
| 대용량 Repo 성능 | 중간 | 중간 | Shallow fetch + 병렬 처리 |

---

## 📈 마일스톤

### M0: 🆕 Plan Stage MVP (1.5주 후)
- ✅ AI Task 명확화
- ✅ 대화형 Q&A UI
- ✅ Plan Summary 생성
- ✅ Zero-Git 통합

### M1: Zero-Git MVP (4주 후)
- ✅ 자동 Sync
- ✅ 자동 Push
- ✅ PR 생성
- ✅ 기본 UI

### M2: Production Ready (5.5주 후)
- ✅ Webhook 연동
- ✅ 자동 상태 동기화
- ✅ 보안 강화

### M3: Advanced (7.5주 후)
- ✅ 자동 Rebase
- ✅ AI 충돌 해결
- ✅ 알림 시스템

---

## 🚀 다음 단계

1. **이 문서 리뷰** - 팀원 피드백 수집
2. **Kickoff 미팅** - 역할 분담 및 일정 확정
3. **Week 1 시작** - Database Migration부터

---

## 📚 참고 문서

- 🆕 [Plan Stage 설계](./PLAN_STAGE_DESIGN.md) - AI Task 명확화 상세 설계
- [상세 아키텍처](./ZERO_GIT_ARCHITECTURE.md) - Zero-Git + Plan Stage 통합 아키텍처
- [구현 계획](./IMPLEMENTATION_PLAN.md) - Phase 0~3 상세 일정
- [현재 시스템 분석](../CLAUDE.md)

---

## ❓ FAQ

**Q: 기존 사용자에게 영향이 있나요?**
A: 없습니다. 모든 기능은 옵션이며 기본값으로 활성화됩니다. 원하면 비활성화 가능합니다.

**Q: GitHub 외 GitLab, Bitbucket은?**
A: Phase 1은 GitHub만 지원합니다. 추후 확장 가능합니다.

**Q: 대용량 Repository는?**
A: Shallow fetch와 캐싱으로 최적화됩니다. 실제 테스트는 Phase 2에서 진행합니다.

**Q: 충돌이 발생하면?**
A: Phase 1-2에서는 사용자에게 알림합니다. Phase 3에서 AI 자동 해결을 추가합니다.

---

**승인 필요:**
- [ ] Engineering Lead
- [ ] Product Manager
- [ ] CTO

**승인 후 즉시 시작 가능합니다!** 🚀

---

**문서 버전:** 1.0
**최종 업데이트:** 2025-11-17
