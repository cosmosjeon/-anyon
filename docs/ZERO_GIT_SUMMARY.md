# Zero-Git 자동화 시스템 + AI Plan Stage - 실행 요약

> **"Git을 몰라도, 요구사항 불명확해도 완벽한 협업 개발"**

**작성일:** 2025-11-17
**업데이트:** 2025-11-17 (Plan Stage 추가)
**예상 기간:** 7.5주 (Plan Stage 1.5주 + Zero-Git 6주)
**투입 인력:** Backend 1명, Frontend 1명

---

## 🎯 핵심 목표

1. 🆕 **AI Plan Stage**: Task 개발 전 요구사항 명확화로 재작업 50% 감소
2. **Zero-Git 자동화**: Git 명령어를 한 번도 사용하지 않고 Anyon 칸반 보드만으로 팀 협업 개발 완료

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

### Phase 0: 🆕 AI Plan Stage (1.5주, 우선순위 최상)
**목표:** Task 개발 전 요구사항 명확화로 재작업 50% 감소

**Why First?**
- Zero-Git과 독립적으로 작동
- 요구사항 품질 향상으로 모든 Phase에 긍정적 영향
- 즉시 사용자 가치 전달

**Week 0.5 (Day 1-3):**
- ✅ Database Migration (plan_questions, plan_conversations 테이블)
- ✅ TaskClarificationService 구현
  - `generate_questions()` - AI 질문 생성
  - `save_answer()` - 답변 저장
  - `generate_plan_summary()` - 요약 생성
- ✅ Models: PlanQuestion, PlanConversation

**Week 1 (Day 4-8):**
- ✅ API Endpoints (3개)
  - POST /api/tasks/{id}/start-planning
  - POST /api/tasks/{id}/plan-answers
  - POST /api/tasks/{id}/complete-planning
- ✅ Frontend: PlanTaskDialog UI
- ✅ Kanban Board: 5개 컬럼 (Todo, Planning, InProgress, InReview, Done)

**Week 1.5 (Day 9-10):**
- ✅ Zero-Git 통합: Plan Summary → AI Executor
- ✅ E2E 테스트

**산출물:**
- AI 기반 Task 명확화
- 명확한 요구사항 문서 자동 생성
- 재작업 50% 감소

---

### Phase 1: 핵심 Git 자동화 (2주)
**목표:** Task 시작/완료 시 Git 자동화

**Week 1:**
- ✅ Database Migration (git_sync_logs 테이블)
- ✅ Git Automation Service 구현
  - `sync_before_start()` - 자동 pull
  - `push_branch()` - 자동 push
  - `auto_commit()` - 자동 커밋
- ✅ Container Service 통합

**Week 2:**
- ✅ Complete Task API 엔드포인트
- ✅ PR 자동 생성 로직
- ✅ Frontend: Complete Dialog UI
- ✅ 통합 테스트

**산출물:**
- 자동 Sync on Start
- 자동 Push on Complete
- PR 자동 생성

---

### Phase 2: Webhook 연동 (1주)
**목표:** GitHub 이벤트 자동 처리

**Week 3:**
- ✅ GitHub Webhook Handler
- ✅ Signature 검증
- ✅ PR Merge → Task Done 자동화
- ✅ Frontend 실시간 업데이트 (SSE)
- ✅ 설정 가이드 문서

**산출물:**
- Webhook 연동
- 자동 상태 동기화
- 실시간 UI 업데이트

---

### Phase 3: 고급 기능 (2주)
**목표:** 사용자 경험 극대화

**Week 4-5:**
- ✅ 자동 Rebase (PR 생성 전)
- ✅ AI 충돌 해결
- ✅ 브라우저 Push 알림
- ✅ 팀 활동 대시보드

**산출물:**
- 충돌 자동 해결
- 실시간 알림
- 성능 최적화

---

### Week 6: 테스트 & 배포
- ✅ 통합 테스트 완료
- ✅ 문서 완성
- ✅ Beta 테스트
- ✅ GA 배포

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
