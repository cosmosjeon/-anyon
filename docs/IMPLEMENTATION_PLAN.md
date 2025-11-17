# Zero-Git 자동화 시스템 구현 계획

> **참조:** [ZERO_GIT_ARCHITECTURE.md](./ZERO_GIT_ARCHITECTURE.md)

**작성일:** 2025-11-17
**버전:** 1.0
**예상 기간:** 6주
**팀:** Backend (1명), Frontend (1명)

---

## 📋 목차

1. [실행 요약](#1-실행-요약)
2. [Phase 1: 핵심 자동화](#phase-1-핵심-자동화-2주)
3. [Phase 2: Webhook 연동](#phase-2-webhook-연동-1주)
4. [Phase 3: 고급 기능](#phase-3-고급-기능-2주)
5. [위험 관리](#5-위험-관리)
6. [성공 지표](#6-성공-지표)

---

## 1. 실행 요약

### 목표
사용자가 Git 명령어를 **한 번도 사용하지 않고** Anyon 칸반 보드만으로 협업 개발을 완료할 수 있는 시스템 구축

### 핵심 성과 지표 (KPI)
- 🆕 **재작업 발생률: 30% → 15%** (Plan Stage로 50% 감소)
- 🆕 **AI 개발 정확도: 70% → 90%** (명확한 요구사항)
- Git 명령어 사용 횟수: **9회 → 0회**
- Task 시작 시간: **3분 → 30초** (자동 sync)
- PR 생성 시간: **5분 → 10초** (자동화)
- 사용자 만족도: **+50%** (설문조사)

### 투자 대비 효과 (ROI)
- 개발 시간: 6주
- 절감 효과: 팀원 1명당 주당 2시간 절약
- Break-even: 5명 팀 기준 6주 후

---

## Phase 0: 🆕 Plan Stage - AI Task Clarification (1.5주)

### 개요

**목표:** Task 개발 전 AI가 요구사항을 명확히 하여 재작업 50% 감소

**Why First?**
- Zero-Git과 독립적으로 작동
- 요구사항 품질 향상으로 모든 후속 Phase에 긍정적 영향
- 즉시 사용자 가치 전달 가능
- 빠른 ROI (2주 내)

**핵심 기능:**
1. AI 기반 Task 분석 및 질문 생성
2. 대화형 Q&A 인터페이스
3. 명확화된 요구사항 문서 자동 생성
4. AI Executor에 context 전달

---

### Week 0.5: Database & Service (Day 1-3)

#### Day 1: Database Migration

**담당:** Backend
**목표:** Plan Stage 데이터 구조 생성

**작업 항목:**

1. **Migration 파일 생성**
   ```bash
   # 파일: crates/db/migrations/20251119000000_add_planning_stage.sql
   ```

   **내용:**
   ```sql
   -- TaskStatus enum에 'planning' 추가
   -- Tasks 테이블 확장
   ALTER TABLE tasks ADD COLUMN plan_summary TEXT;
   ALTER TABLE tasks ADD COLUMN plan_started_at TIMESTAMP;
   ALTER TABLE tasks ADD COLUMN plan_completed_at TIMESTAMP;

   -- Plan Questions 테이블
   CREATE TABLE plan_questions (
       id TEXT PRIMARY KEY,
       task_id TEXT NOT NULL,
       question_id TEXT NOT NULL,
       question_text TEXT NOT NULL,
       category TEXT NOT NULL,
       required BOOLEAN DEFAULT FALSE,
       suggested_answers TEXT,  -- JSON array
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

       FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
       UNIQUE(task_id, question_id)
   );

   CREATE INDEX idx_plan_questions_task ON plan_questions(task_id);

   -- Plan Conversations 테이블
   CREATE TABLE plan_conversations (
       id TEXT PRIMARY KEY,
       task_id TEXT NOT NULL,
       question_id TEXT NOT NULL,
       question_text TEXT NOT NULL,
       answer TEXT NOT NULL,
       answered_by TEXT,
       answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

       FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
       UNIQUE(task_id, question_id)
   );

   CREATE INDEX idx_plan_conversations_task ON plan_conversations(task_id);
   CREATE INDEX idx_plan_conversations_answered ON plan_conversations(answered_at DESC);
   ```

2. **TaskStatus Enum 업데이트**
   ```rust
   // 파일: crates/db/src/models/task.rs

   #[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq)]
   pub enum TaskStatus {
       #[serde(rename = "todo")]
       Todo,

       #[serde(rename = "planning")]  // 🆕
       Planning,

       #[serde(rename = "inprogress")]
       InProgress,

       #[serde(rename = "inreview")]
       InReview,

       #[serde(rename = "done")]
       Done,
   }
   ```

**산출물:**
- ✅ Migration SQL 파일
- ✅ TaskStatus enum 업데이트
- ✅ Migration 테스트

**테스트:**
```bash
sqlx migrate run
cargo test -p db task_status
```

---

#### Day 2: Database Models

**담당:** Backend
**목표:** Plan Stage 모델 구현

**작업 항목:**

1. **PlanQuestion 모델**
   ```rust
   // 파일: crates/db/src/models/plan_question.rs

   #[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
   pub struct PlanQuestion {
       pub id: Uuid,
       pub task_id: Uuid,
       pub question_id: String,
       pub question_text: String,
       pub category: QuestionCategory,
       pub required: bool,
       pub suggested_answers: Option<Vec<String>>,
       pub created_at: DateTime<Utc>,
   }

   #[derive(Debug, Clone, Serialize, Deserialize, TS)]
   pub enum QuestionCategory {
       Authentication,
       Security,
       Features,
       Performance,
       UI,
       Integration,
       Other,
   }

   impl PlanQuestion {
       pub async fn create(pool: &SqlitePool, data: CreatePlanQuestion) -> Result<Self, SqlxError>;
       pub async fn find_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<Vec<Self>, SqlxError>;
       pub async fn delete_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<(), SqlxError>;
   }
   ```

2. **PlanConversation 모델**
   ```rust
   // 파일: crates/db/src/models/plan_conversation.rs

   #[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
   pub struct PlanConversation {
       pub id: Uuid,
       pub task_id: Uuid,
       pub question_id: String,
       pub question_text: String,
       pub answer: String,
       pub answered_by: Option<String>,
       pub answered_at: DateTime<Utc>,
   }

   impl PlanConversation {
       pub async fn create(pool: &SqlitePool, data: CreatePlanConversation) -> Result<Self, SqlxError>;
       pub async fn find_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<Vec<Self>, SqlxError>;
       pub async fn update_answer(pool: &SqlitePool, id: Uuid, answer: &str) -> Result<(), SqlxError>;
   }
   ```

3. **Task 모델 확장**
   ```rust
   // 파일: crates/db/src/models/task.rs

   impl Task {
       pub async fn update_plan_summary(
           pool: &SqlitePool,
           id: Uuid,
           summary: &str,
       ) -> Result<(), SqlxError>;

       pub async fn mark_plan_started(
           pool: &SqlitePool,
           id: Uuid,
       ) -> Result<(), SqlxError>;

       pub async fn mark_plan_completed(
           pool: &SqlitePool,
           id: Uuid,
       ) -> Result<(), SqlxError>;
   }
   ```

**산출물:**
- ✅ PlanQuestion 모델 (150 lines)
- ✅ PlanConversation 모델 (120 lines)
- ✅ Task 모델 확장
- ✅ 단위 테스트 (10개)

**테스트:**
```bash
cargo test -p db plan_question
cargo test -p db plan_conversation
```

---

#### Day 3: TaskClarificationService

**담당:** Backend
**목표:** AI 명확화 서비스 핵심 로직 구현

**작업 항목:**

1. **서비스 구조**
   ```rust
   // 파일: crates/services/src/services/task_clarification.rs

   pub struct TaskClarificationService {
       db: DBService,
       executor: Box<dyn Executor>,
   }

   impl TaskClarificationService {
       pub fn new(db: DBService, executor: Box<dyn Executor>) -> Self;

       pub async fn generate_questions(&self, task: &Task) -> Result<Vec<ClarificationQuestion>, ClarificationError>;
       pub async fn save_answer(&self, task_id: Uuid, question_id: &str, answer: &str) -> Result<(), ClarificationError>;
       pub async fn generate_plan_summary(&self, task: &Task) -> Result<String, ClarificationError>;
       pub async fn is_plan_complete(&self, task_id: Uuid) -> Result<bool, ClarificationError>;
   }
   ```

2. **질문 생성 로직 구현** (상세 내용은 PLAN_STAGE_DESIGN.md 참조)

3. **요약 생성 로직 구현** (상세 내용은 PLAN_STAGE_DESIGN.md 참조)

**산출물:**
- ✅ TaskClarificationService (500 lines)
- ✅ AI Prompt 템플릿
- ✅ 단위 테스트 (15개, 80% coverage)

**테스트:**
```bash
cargo test -p services task_clarification
```

---

### Week 1: API & Frontend (Day 4-8)

#### Day 4-5: API Endpoints

**담당:** Backend
**목표:** Plan Stage API 구현

**작업 항목:**

1. **start_planning 엔드포인트**
   ```rust
   // 파일: crates/server/src/routes/tasks.rs

   pub async fn start_planning(
       State(deployment): State<DeploymentImpl>,
       Path(task_id): Path<Uuid>,
   ) -> Result<Json<ApiResponse<StartPlanningResponse>>, ApiError>;
   ```

2. **save_plan_answers 엔드포인트**
   ```rust
   pub async fn save_plan_answers(
       State(deployment): State<DeploymentImpl>,
       Path(task_id): Path<Uuid>,
       Json(request): Json<SavePlanAnswersRequest>,
   ) -> Result<Json<ApiResponse<SavePlanAnswersResponse>>, ApiError>;
   ```

3. **complete_planning 엔드포인트**
   ```rust
   pub async fn complete_planning(
       State(deployment): State<DeploymentImpl>,
       Path(task_id): Path<Uuid>,
   ) -> Result<Json<ApiResponse<CompletePlanningResponse>>, ApiError>;
   ```

4. **라우터 등록**
   ```rust
   pub fn task_routes() -> Router<DeploymentImpl> {
       Router::new()
           .route("/:id/start-planning", post(start_planning))      // 🆕
           .route("/:id/plan-answers", post(save_plan_answers))     // 🆕
           .route("/:id/complete-planning", post(complete_planning)) // 🆕
           /* ... */
   }
   ```

5. **TypeScript 타입 생성**
   ```bash
   npm run generate-types
   ```

**산출물:**
- ✅ 3개 API endpoints (300 lines)
- ✅ Request/Response 타입
- ✅ TypeScript 타입 정의
- ✅ API 테스트 (10개)

**테스트:**
```bash
cargo test -p server routes::tasks::plan
```

---

#### Day 6-8: Frontend Implementation

**담당:** Frontend
**목표:** Plan Stage UI 구현

**작업 항목:**

1. **Kanban Board 업데이트**
   ```tsx
   // 파일: frontend/src/components/kanban/KanbanBoard.tsx

   const columns: ColumnConfig[] = [
     { id: 'todo', title: 'To Do', color: 'gray' },
     { id: 'planning', title: '📝 Plan', color: 'blue' },  // 🆕
     { id: 'inprogress', title: 'In Progress', color: 'yellow' },
     { id: 'inreview', title: 'In Review', color: 'purple' },
     { id: 'done', title: 'Done', color: 'green' },
   ];
   ```

2. **PlanTaskDialog 컴포넌트**
   ```tsx
   // 파일: frontend/src/components/dialogs/PlanTaskDialog.tsx
   // 상세 구현은 PLAN_STAGE_DESIGN.md 참조
   ```

   **주요 기능:**
   - AI 질문 로드 및 표시
   - 답변 입력 (텍스트/선택)
   - Auto-save (500ms debounce)
   - Plan Summary Markdown 렌더링
   - "Start Development" 버튼

3. **TaskCard 버튼 로직**
   ```tsx
   // 파일: frontend/src/components/tasks/TaskCard.tsx

   const renderActionButton = () => {
     switch (task.status) {
       case 'todo':
         return <Button onClick={() => setShowPlanDialog(true)}>📝 Plan</Button>;
       case 'planning':
         return <Button onClick={() => setShowPlanDialog(true)}>✏️ Continue Planning</Button>;
       /* ... */
     }
   };
   ```

4. **API Client 함수**
   ```typescript
   // 파일: frontend/src/lib/api.ts

   export const startPlanning = async (taskId: string): Promise<StartPlanningResponse>;
   export const savePlanAnswers = async (taskId: string, request: SavePlanAnswersRequest): Promise<SavePlanAnswersResponse>;
   export const completePlanning = async (taskId: string): Promise<CompletePlanningResponse>;
   ```

**산출물:**
- ✅ Kanban Board 5개 컬럼
- ✅ PlanTaskDialog 컴포넌트 (400 lines)
- ✅ API client 함수
- ✅ UI 테스트 (TypeScript 컴파일)

---

### Week 1.5: Integration & Testing (Day 9-10)

#### Day 9: Zero-Git Integration

**담당:** Backend
**목표:** Plan Summary를 AI Executor에 전달

**작업 항목:**

1. **start_task_attempt 수정**
   ```rust
   // 파일: crates/server/src/routes/task_attempts.rs

   pub async fn start_task_attempt(
       /* ... */
   ) -> Result<...> {
       let task = /* ... */;

       // 🆕 Plan Summary를 AI context에 추가
       let mut context = vec![];
       if let Some(plan_summary) = &task.plan_summary {
           context.push(ExecutionContext {
               role: "system".to_string(),
               content: format!(
                   "## Requirements from Planning Phase\n\n{}",
                   plan_summary
               ),
           });
       }

       // AI Executor 호출
       let execution = executor.execute_coding_agent_initial(ExecutionRequest {
           prompt: task.description.clone().unwrap_or_default(),
           context,  // 🆕 Plan Summary 포함
           /* ... */
       }).await?;

       /* ... */
   }
   ```

**산출물:**
- ✅ Plan Summary → AI Executor 통합
- ✅ 통합 테스트

---

#### Day 10: End-to-End Testing

**담당:** Backend + Frontend
**목표:** 전체 플로우 테스트 및 버그 수정

**작업 항목:**

1. **E2E 테스트 시나리오**
   ```
   Scenario 1: 로그인 기능
   1. Todo에 Task 생성
   2. "Plan" 버튼 클릭
   3. AI 질문 3개 생성 확인
   4. 답변 입력 (auto-save 확인)
   5. Plan Summary 생성 확인
   6. "Start Development" 클릭
   7. InProgress로 이동 확인
   8. AI가 Plan Summary 기반 코드 작성 확인
   ```

2. **성능 테스트**
   - 질문 생성 시간: < 3초
   - 요약 생성 시간: < 5초
   - Auto-save 지연: < 500ms

3. **문서 업데이트**
   - User Guide: Plan Stage 사용법
   - Architecture: Plan Stage 통합 다이어그램
   - README: Plan Stage 소개

**산출물:**
- ✅ E2E 테스트 시나리오 (5개)
- ✅ 성능 벤치마크
- ✅ 사용자 가이드
- ✅ 버그 수정

**테스트:**
```bash
# Backend
cargo test --workspace

# Frontend
npm run type-check
npm run lint

# E2E
npm run test:e2e
```

---

### Phase 0 산출물 요약

**코드:**
- ✅ Database: 2개 테이블 + Task 확장
- ✅ Backend: TaskClarificationService (500 lines) + 3 API endpoints (300 lines)
- ✅ Frontend: PlanTaskDialog (400 lines) + Kanban 확장

**테스트:**
- ✅ 단위 테스트: 35개 (80% coverage)
- ✅ 통합 테스트: 5개
- ✅ E2E 테스트: 5 시나리오

**문서:**
- ✅ PLAN_STAGE_DESIGN.md (완성)
- ✅ User Guide: Plan Stage 사용법
- ✅ API Documentation

**성공 지표:**
- ✅ 재작업 발생률: 30% → 15%
- ✅ AI 질문 생성: < 3초
- ✅ 사용자 만족도: 4.5/5 이상

---

## Phase 1: 핵심 자동화 (2주)

### Week 1: 자동 Sync & Database (Day 1-5)

#### Day 1-2: Database Migration & Models

**담당:** Backend
**목표:** Git 자동화 정보를 저장할 DB 구조 생성

**작업 항목:**

1. **Migration 파일 생성**
   ```bash
   # 파일: crates/db/migrations/20251117000000_git_automation.sql
   ```

   **내용:**
   ```sql
   -- git_sync_logs 테이블
   CREATE TABLE git_sync_logs (
       id TEXT PRIMARY KEY,
       task_attempt_id TEXT NOT NULL,
       sync_type TEXT NOT NULL CHECK(sync_type IN ('pull', 'push', 'pr_create')),
       before_commit TEXT,
       after_commit TEXT,
       commits_count INTEGER DEFAULT 0,
       success BOOLEAN NOT NULL,
       error_message TEXT,
       duration_ms INTEGER,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (task_attempt_id) REFERENCES task_attempts(id) ON DELETE CASCADE
   );

   CREATE INDEX idx_git_sync_logs_task_attempt ON git_sync_logs(task_attempt_id);
   CREATE INDEX idx_git_sync_logs_created ON git_sync_logs(created_at DESC);

   -- task_attempts 확장
   ALTER TABLE task_attempts ADD COLUMN auto_synced BOOLEAN DEFAULT FALSE;
   ALTER TABLE task_attempts ADD COLUMN auto_pushed BOOLEAN DEFAULT FALSE;
   ALTER TABLE task_attempts ADD COLUMN pr_auto_created BOOLEAN DEFAULT FALSE;
   ALTER TABLE task_attempts ADD COLUMN last_sync_at TIMESTAMP;
   ALTER TABLE task_attempts ADD COLUMN upstream_tracking BOOLEAN DEFAULT FALSE;
   ALTER TABLE task_attempts ADD COLUMN sync_commits_pulled INTEGER DEFAULT 0;
   ```

2. **Model 구현**
   ```rust
   // 파일: crates/db/src/models/git_sync_log.rs
   ```

   **구조:**
   ```rust
   #[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
   pub struct GitSyncLog {
       pub id: Uuid,
       pub task_attempt_id: Uuid,
       pub sync_type: GitSyncType,
       pub before_commit: Option<String>,
       pub after_commit: Option<String>,
       pub commits_count: i32,
       pub success: bool,
       pub error_message: Option<String>,
       pub duration_ms: Option<i32>,
       pub created_at: DateTime<Utc>,
   }

   #[derive(Debug, Clone, Serialize, Deserialize, TS)]
   pub enum GitSyncType {
       Pull,
       Push,
       PrCreate,
   }

   impl GitSyncLog {
       pub async fn create(pool: &SqlitePool, data: CreateGitSyncLog) -> Result<Self, SqlxError>;
       pub async fn find_by_task_attempt(pool: &SqlitePool, task_attempt_id: Uuid) -> Result<Vec<Self>, SqlxError>;
       pub async fn find_latest(pool: &SqlitePool, task_attempt_id: Uuid, sync_type: GitSyncType) -> Result<Option<Self>, SqlxError>;
   }
   ```

**산출물:**
- ✅ Migration SQL 파일
- ✅ `git_sync_log.rs` 모델
- ✅ 단위 테스트 (10개)

**테스트:**
```bash
cargo test -p db git_sync_log
```

---

#### Day 3-5: Git Automation Service

**담당:** Backend
**목표:** 핵심 Git 자동화 로직 구현

**작업 항목:**

1. **서비스 파일 생성**
   ```rust
   // 파일: crates/services/src/services/git_automation.rs
   ```

2. **핵심 함수 구현**

   **a) sync_before_start**
   ```rust
   pub async fn sync_before_start(
       &self,
       project: &Project,
       target_branch: &str,
   ) -> Result<SyncResult, GitAutomationError> {
       let start = Instant::now();
       let git_cli = GitCli::new();
       let repo_path = &project.git_repo_path;

       // 1. Fetch
       tracing::info!("Fetching {} from remote...", target_branch);
       git_cli.fetch_with_refspec(
           repo_path,
           "origin",
           &format!("+refs/heads/{}:refs/remotes/origin/{}", target_branch, target_branch),
       )?;

       // 2. 현재 커밋 확인
       let before_commit = self.git.get_head_info(repo_path)?.oid;

       // 3. Fast-forward merge
       git_cli.run_in_repo(repo_path, &[
           "merge",
           "--ff-only",
           &format!("origin/{}", target_branch),
       ])?;

       // 4. 새 커밋 확인
       let after_commit = self.git.get_head_info(repo_path)?.oid;

       // 5. 커밋 개수 계산
       let commits_count = if before_commit != after_commit {
           git_cli.count_commits_between(repo_path, &before_commit, &after_commit)?
       } else {
           0
       };

       let duration = start.elapsed();

       Ok(SyncResult {
           before_commit,
           after_commit,
           commits_pulled: commits_count,
           duration_ms: duration.as_millis() as i32,
       })
   }
   ```

   **b) push_branch**
   ```rust
   pub async fn push_branch(
       &self,
       project: &Project,
       branch: &str,
   ) -> Result<PushResult, GitAutomationError> {
       let git_cli = GitCli::new();
       let repo_path = &project.git_repo_path;

       // upstream 설정 포함 push
       git_cli.push(repo_path, "origin", branch)?;

       Ok(PushResult {
           branch: branch.to_string(),
           success: true,
       })
   }
   ```

   **c) auto_commit_changes**
   ```rust
   pub async fn auto_commit_changes(
       &self,
       worktree_path: &Path,
       message: &str,
   ) -> Result<CommitResult, GitAutomationError> {
       let git_cli = GitCli::new();

       // 변경사항 확인
       if !self.git.has_changes(worktree_path)? {
           return Ok(CommitResult {
               committed: false,
               commit_sha: None,
           });
       }

       // Stage all
       git_cli.run_in_repo(worktree_path, &["add", "."])?;

       // Commit
       git_cli.commit(worktree_path, message)?;

       let commit_sha = self.git.get_head_info(worktree_path)?.oid;

       Ok(CommitResult {
           committed: true,
           commit_sha: Some(commit_sha),
       })
   }
   ```

3. **에러 핸들링**
   ```rust
   #[derive(Debug, Error)]
   pub enum GitAutomationError {
       #[error("Git operation failed: {0}")]
       GitError(#[from] GitServiceError),

       #[error("Cannot fast-forward: diverged branches")]
       CannotFastForward,

       #[error("No changes to commit")]
       NoChanges,

       #[error("Database error: {0}")]
       Database(#[from] SqlxError),
   }
   ```

4. **로깅 통합**
   ```rust
   async fn log_sync(
       &self,
       task_attempt_id: Uuid,
       sync_type: GitSyncType,
       result: &Result<SyncResult, GitAutomationError>,
   ) -> Result<(), SqlxError> {
       let (success, error_msg, before, after, count, duration) = match result {
           Ok(r) => (true, None, Some(r.before_commit.clone()), Some(r.after_commit.clone()), r.commits_pulled, Some(r.duration_ms)),
           Err(e) => (false, Some(e.to_string()), None, None, 0, None),
       };

       GitSyncLog::create(&self.db.pool, CreateGitSyncLog {
           task_attempt_id,
           sync_type,
           before_commit: before,
           after_commit: after,
           commits_count: count,
           success,
           error_message: error_msg,
           duration_ms: duration,
       }).await?;

       Ok(())
   }
   ```

**산출물:**
- ✅ `git_automation.rs` (500 lines)
- ✅ 단위 테스트 (20개)
- ✅ 통합 테스트 (5개)

**테스트:**
```bash
cargo test -p services git_automation
```

---

### Week 2: Container Service 통합 & PR 생성 (Day 6-10)

#### Day 6-7: Container Service 개선

**담당:** Backend
**목표:** Worktree 생성 시 자동 sync 통합

**작업 항목:**

1. **LocalContainerService 수정**
   ```rust
   // 파일: crates/local-deployment/src/container.rs
   ```

   **create() 함수 개선:**
   ```rust
   async fn create(&self, task_attempt: &TaskAttempt)
       -> Result<ContainerRef, ContainerError>
   {
       let task = /* ... */;
       let project = /* ... */;

       // 🆕 Git Automation Service 초기화
       let git_automation = GitAutomationService::new(
           self.db.clone(),
           self.git.clone(),
       );

       // 🆕 1. 자동 동기화
       tracing::info!("Auto-syncing before creating worktree...");

       let sync_result = git_automation
           .sync_before_start(&project, &task_attempt.target_branch)
           .await
           .map_err(|e| {
               tracing::error!("Auto-sync failed: {}", e);
               ContainerError::Other(anyhow!("Failed to sync: {}", e))
           })?;

       tracing::info!(
           "✅ Pulled {} commits ({}..{})",
           sync_result.commits_pulled,
           &sync_result.before_commit[..7],
           &sync_result.after_commit[..7],
       );

       // 🆕 2. DB 업데이트
       TaskAttempt::mark_auto_synced(
           &self.db.pool,
           task_attempt.id,
           sync_result.commits_pulled,
       ).await?;

       // 3. Worktree 생성 (기존)
       let worktree_path = WorktreeManager::get_worktree_base_dir()
           .join(Self::dir_name_from_task_attempt(&task_attempt.id, &task.title));

       WorktreeManager::create_worktree(
           &project.git_repo_path,
           &task_attempt.branch,
           &worktree_path,
           &task_attempt.target_branch,
           true,
       ).await?;

       // 🆕 4. 브랜치 자동 push (upstream 설정)
       git_automation
           .push_branch(&project, &task_attempt.branch)
           .await
           .map_err(|e| {
               tracing::warn!("Failed to push branch (non-fatal): {}", e);
               // Push 실패는 치명적이지 않음 (나중에 재시도 가능)
           })
           .ok();

       // 🆕 5. DB 업데이트
       TaskAttempt::mark_upstream_tracking(&self.db.pool, task_attempt.id).await?;

       // Copy files, images (기존)
       /* ... */

       Ok(worktree_path.to_string_lossy().to_string())
   }
   ```

2. **TaskAttempt 모델 확장**
   ```rust
   // 파일: crates/db/src/models/task_attempt.rs
   ```

   **새 함수:**
   ```rust
   impl TaskAttempt {
       pub async fn mark_auto_synced(
           pool: &SqlitePool,
           id: Uuid,
           commits_pulled: i32,
       ) -> Result<(), SqlxError> {
           sqlx::query!(
               "UPDATE task_attempts
                SET auto_synced = TRUE,
                    last_sync_at = CURRENT_TIMESTAMP,
                    sync_commits_pulled = ?
                WHERE id = ?",
               commits_pulled,
               id
           )
           .execute(pool)
           .await?;
           Ok(())
       }

       pub async fn mark_upstream_tracking(
           pool: &SqlitePool,
           id: Uuid,
       ) -> Result<(), SqlxError> {
           sqlx::query!(
               "UPDATE task_attempts
                SET upstream_tracking = TRUE
                WHERE id = ?",
               id
           )
           .execute(pool)
           .await?;
           Ok(())
       }
   }
   ```

**산출물:**
- ✅ 수정된 `container.rs`
- ✅ TaskAttempt 모델 확장
- ✅ 통합 테스트

**테스트:**
```bash
cargo test -p local-deployment container::tests::test_create_with_auto_sync
```

---

#### Day 8-10: Complete Task API & PR 자동 생성

**담당:** Backend
**목표:** Task 완료 시 PR 자동 생성

**작업 항목:**

1. **API 엔드포인트 추가**
   ```rust
   // 파일: crates/server/src/routes/task_attempts.rs
   ```

   **Request/Response 타입:**
   ```rust
   #[derive(Debug, Deserialize, Serialize, TS)]
   pub struct CompleteTaskRequest {
       pub auto_create_pr: bool,
       pub pr_title: Option<String>,
       pub pr_body: Option<String>,
       pub force_if_dirty: bool,
   }

   #[derive(Debug, Serialize, Deserialize, TS)]
   pub struct CompleteTaskResponse {
       pub committed: bool,
       pub commit_sha: Option<String>,
       pub pushed: bool,
       pub pr_created: bool,
       pub pr_info: Option<PullRequestInfo>,
       pub task_status: TaskStatus,
   }
   ```

   **핸들러 구현:**
   ```rust
   pub async fn complete_task_attempt(
       State(deployment): State<DeploymentImpl>,
       Extension(task_attempt): Extension<TaskAttempt>,
       Json(request): Json<CompleteTaskRequest>,
   ) -> Result<Json<ApiResponse<CompleteTaskResponse>>, ApiError> {
       let db = deployment.db();
       let git_automation = GitAutomationService::new(db.clone(), deployment.git().clone());

       // 1. Task & Project 가져오기
       let task = task_attempt.parent_task(&db.pool).await?
           .ok_or(ApiError::NotFound("Task not found".to_string()))?;

       let project = task.parent_project(&db.pool).await?
           .ok_or(ApiError::NotFound("Project not found".to_string()))?;

       let worktree_path = PathBuf::from(
           task_attempt.container_ref.as_ref()
               .ok_or(ApiError::BadRequest("No worktree found".to_string()))?
       );

       // 2. 자동 커밋
       let commit_msg = format!("Complete: {}", task.title);
       let commit_result = git_automation
           .auto_commit_changes(&worktree_path, &commit_msg)
           .await?;

       // 3. Push
       let pushed = if commit_result.committed || request.force_if_dirty {
           git_automation
               .push_branch(&project, &task_attempt.branch)
               .await?;
           true
       } else {
           false
       };

       // 4. PR 생성
       let (pr_created, pr_info) = if request.auto_create_pr && pushed {
           let github = GitHubService::new()?;
           let repo_info = github.get_repo_info_from_path(&project.git_repo_path).await?;

           let pr_request = CreatePrRequest {
               title: request.pr_title.unwrap_or_else(||
                   format!("feat: {}", task.title)
               ),
               body: request.pr_body.or(task.description.clone()),
               head_branch: task_attempt.branch.clone(),
               base_branch: task_attempt.target_branch.clone(),
           };

           let pr_info = github.create_pr(&repo_info, &pr_request).await?;

           // Merge 레코드 생성
           Merge::create_pr(&db.pool, task_attempt.id, &pr_info).await?;

           // Sync log
           GitSyncLog::create(&db.pool, CreateGitSyncLog {
               task_attempt_id: task_attempt.id,
               sync_type: GitSyncType::PrCreate,
               success: true,
               /* ... */
           }).await?;

           (true, Some(pr_info))
       } else {
           (false, None)
       };

       // 5. Task 상태 업데이트
       let new_status = if pr_created {
           TaskStatus::InReview
       } else {
           TaskStatus::InProgress // 변경 없음
       };

       if task.status != new_status {
           Task::update_status(&db.pool, task.id, new_status.clone()).await?;

           // 원격 동기화
           if let Ok(publisher) = deployment.share_publisher() {
               publisher.update_shared_task_by_id(task.id).await?;
           }
       }

       Ok(Json(ApiResponse::success(CompleteTaskResponse {
           committed: commit_result.committed,
           commit_sha: commit_result.commit_sha,
           pushed,
           pr_created,
           pr_info,
           task_status: new_status,
       })))
   }
   ```

2. **라우터 등록**
   ```rust
   pub fn task_attempt_routes() -> Router<DeploymentImpl> {
       Router::new()
           .route("/:id/start", post(start_task_attempt))
           .route("/:id/complete", post(complete_task_attempt))  // 🆕
           /* ... */
   }
   ```

**산출물:**
- ✅ Complete API 엔드포인트
- ✅ 통합 테스트
- ✅ Postman 컬렉션 업데이트

**테스트:**
```bash
cargo test -p server routes::task_attempts::tests::test_complete_task_with_pr
```

---

### Week 2: Frontend 통합 (Day 8-10, 병렬)

**담당:** Frontend
**목표:** Complete 버튼 및 Dialog UI

**작업 항목:**

1. **CompleteTaskDialog 컴포넌트**
   ```tsx
   // 파일: frontend/src/components/dialogs/CompleteTaskDialog.tsx
   ```

   **구현:**
   ```tsx
   interface CompleteTaskDialogProps {
     task: Task;
     taskAttempt: TaskAttempt;
     onClose: () => void;
     onComplete: () => void;
   }

   export const CompleteTaskDialog: React.FC<CompleteTaskDialogProps> = ({
     task,
     taskAttempt,
     onClose,
     onComplete,
   }) => {
     const [autoCreatePR, setAutoCreatePR] = useState(true);
     const [prTitle, setPrTitle] = useState(`feat: ${task.title}`);
     const [prBody, setPrBody] = useState(task.description || '');
     const [isSubmitting, setIsSubmitting] = useState(false);

     const handleSubmit = async () => {
       setIsSubmitting(true);
       try {
         const result = await api.completeTaskAttempt(taskAttempt.id, {
           auto_create_pr: autoCreatePR,
           pr_title: prTitle,
           pr_body: prBody,
           force_if_dirty: false,
         });

         if (result.pr_created && result.pr_info) {
           toast.success(`✅ PR #${result.pr_info.number} created!`);
         } else if (result.committed) {
           toast.success('✅ Changes committed and pushed!');
         }

         onComplete();
         onClose();
       } catch (error) {
         toast.error(`Failed to complete task: ${error.message}`);
       } finally {
         setIsSubmitting(false);
       }
     };

     return (
       <Dialog open onOpenChange={onClose}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Complete Task</DialogTitle>
             <DialogDescription>
               Finalize your work and optionally create a pull request
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-4">
             <div className="flex items-center space-x-2">
               <Checkbox
                 id="auto-pr"
                 checked={autoCreatePR}
                 onCheckedChange={setAutoCreatePR}
               />
               <label htmlFor="auto-pr" className="text-sm font-medium">
                 Create Pull Request
               </label>
             </div>

             {autoCreatePR && (
               <>
                 <div>
                   <Label htmlFor="pr-title">PR Title</Label>
                   <Input
                     id="pr-title"
                     value={prTitle}
                     onChange={(e) => setPrTitle(e.target.value)}
                     placeholder="feat: Your feature"
                   />
                 </div>

                 <div>
                   <Label htmlFor="pr-body">PR Description</Label>
                   <Textarea
                     id="pr-body"
                     value={prBody}
                     onChange={(e) => setPrBody(e.target.value)}
                     placeholder="Describe your changes..."
                     rows={5}
                   />
                 </div>
               </>
             )}
           </div>

           <DialogFooter>
             <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
               Cancel
             </Button>
             <Button onClick={handleSubmit} disabled={isSubmitting}>
               {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {autoCreatePR ? 'Complete & Create PR' : 'Complete'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     );
   };
   ```

2. **TaskCard에 Complete 버튼 추가**
   ```tsx
   // 파일: frontend/src/components/tasks/TaskCard.tsx
   ```

   ```tsx
   const [showCompleteDialog, setShowCompleteDialog] = useState(false);

   return (
     <Card>
       {/* ... existing content ... */}
       <CardFooter>
         <Button
           onClick={() => setShowCompleteDialog(true)}
           disabled={task.status !== 'inprogress'}
         >
           ✅ Complete
         </Button>
       </CardFooter>

       {showCompleteDialog && (
         <CompleteTaskDialog
           task={task}
           taskAttempt={currentAttempt}
           onClose={() => setShowCompleteDialog(false)}
           onComplete={() => queryClient.invalidateQueries(['tasks'])}
         />
       )}
     </Card>
   );
   ```

3. **API Client 확장**
   ```typescript
   // 파일: frontend/src/lib/api.ts
   ```

   ```typescript
   export const completeTaskAttempt = async (
     taskAttemptId: string,
     request: CompleteTaskRequest,
   ): Promise<CompleteTaskResponse> => {
     const response = await fetch(`/api/task-attempts/${taskAttemptId}/complete`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(request),
     });

     if (!response.ok) {
       throw new Error(`Failed to complete task: ${response.statusText}`);
     }

     const result = await response.json();
     return result.data;
   };
   ```

**산출물:**
- ✅ CompleteTaskDialog 컴포넌트
- ✅ TaskCard 통합
- ✅ API client 함수
- ✅ UI 테스트

---

## Phase 2: Webhook 연동 (1주)

### Week 3: GitHub Webhook (Day 11-15)

#### Day 11-12: Webhook Handler

**담당:** Backend
**목표:** GitHub Webhook 수신 및 처리

**작업 항목:**

1. **Webhook 테이블 생성**
   ```sql
   -- 파일: crates/db/migrations/20251118000000_webhook_events.sql

   CREATE TABLE webhook_events (
       id TEXT PRIMARY KEY,
       source TEXT NOT NULL CHECK(source IN ('github', 'gitlab')),
       event_type TEXT NOT NULL,
       payload TEXT NOT NULL,
       signature TEXT,
       processed BOOLEAN DEFAULT FALSE,
       task_attempt_id TEXT,
       error_message TEXT,
       created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
       processed_at TIMESTAMP,
       FOREIGN KEY (task_attempt_id) REFERENCES task_attempts(id) ON DELETE SET NULL
   );

   CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);
   CREATE INDEX idx_webhook_events_source_type ON webhook_events(source, event_type);
   ```

2. **Webhook 모델**
   ```rust
   // 파일: crates/db/src/models/webhook_event.rs

   #[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
   pub struct WebhookEvent {
       pub id: Uuid,
       pub source: WebhookSource,
       pub event_type: String,
       pub payload: String,  // JSON
       pub signature: Option<String>,
       pub processed: bool,
       pub task_attempt_id: Option<Uuid>,
       pub error_message: Option<String>,
       pub created_at: DateTime<Utc>,
       pub processed_at: Option<DateTime<Utc>>,
   }

   #[derive(Debug, Clone, Serialize, Deserialize, TS)]
   pub enum WebhookSource {
       GitHub,
       GitLab,
   }
   ```

3. **Webhook Handler 구현**
   ```rust
   // 파일: crates/server/src/routes/webhooks.rs

   use axum::{
       Json, Router,
       extract::{State, RawBody},
       http::{HeaderMap, StatusCode},
       routing::post,
   };
   use hmac::{Hmac, Mac};
   use sha2::Sha256;

   type HmacSha256 = Hmac<Sha256>;

   #[derive(Deserialize)]
   pub struct GitHubWebhookPayload {
       pub action: String,
       pub pull_request: Option<PullRequestPayload>,
   }

   #[derive(Deserialize)]
   pub struct PullRequestPayload {
       pub number: i32,
       pub title: String,
       pub html_url: String,
       pub state: String,
       pub merged: bool,
       pub head: BranchInfo,
       pub base: BranchInfo,
   }

   #[derive(Deserialize)]
   pub struct BranchInfo {
       #[serde(rename = "ref")]
       pub ref_name: String,
   }

   fn verify_github_signature(
       payload: &[u8],
       signature: &str,
       secret: &str,
   ) -> Result<(), WebhookError> {
       let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
           .map_err(|_| WebhookError::InvalidSecret)?;

       mac.update(payload);
       let expected = hex::encode(mac.finalize().into_bytes());

       let actual = signature
           .strip_prefix("sha256=")
           .ok_or(WebhookError::InvalidSignature)?;

       if expected != actual {
           return Err(WebhookError::SignatureMismatch);
       }

       Ok(())
   }

   pub async fn handle_github_webhook(
       State(deployment): State<DeploymentImpl>,
       headers: HeaderMap,
       body: String,
   ) -> Result<Json<ApiResponse<()>>, ApiError> {
       // 1. Signature 검증
       let signature = headers
           .get("X-Hub-Signature-256")
           .and_then(|v| v.to_str().ok())
           .ok_or(ApiError::BadRequest("Missing signature".to_string()))?;

       let secret = std::env::var("GITHUB_WEBHOOK_SECRET")
           .unwrap_or_else(|_| "".to_string());

       if !secret.is_empty() {
           verify_github_signature(body.as_bytes(), signature, &secret)?;
       }

       // 2. Payload 파싱
       let payload: GitHubWebhookPayload = serde_json::from_str(&body)
           .map_err(|e| ApiError::BadRequest(format!("Invalid payload: {}", e)))?;

       // 3. Webhook 이벤트 저장
       let event_id = Uuid::new_v4();
       WebhookEvent::create(&deployment.db().pool, CreateWebhookEvent {
           id: event_id,
           source: WebhookSource::GitHub,
           event_type: payload.action.clone(),
           payload: body,
           signature: Some(signature.to_string()),
       }).await?;

       // 4. 이벤트 처리
       if let Some(pr) = payload.pull_request {
           process_pr_event(&deployment, &payload.action, &pr).await?;
       }

       // 5. 처리 완료 표시
       WebhookEvent::mark_processed(&deployment.db().pool, event_id).await?;

       Ok(Json(ApiResponse::success(())))
   }

   async fn process_pr_event(
       deployment: &DeploymentImpl,
       action: &str,
       pr: &PullRequestPayload,
   ) -> Result<(), ApiError> {
       let db = deployment.db();

       match action {
           "opened" => {
               // PR이 열림 - 특별한 처리 없음 (이미 InReview 상태)
               tracing::info!("PR #{} opened: {}", pr.number, pr.title);
           }

           "closed" if pr.merged => {
               // PR이 merge됨! 🎉
               let branch = &pr.head.ref_name;

               // 해당 브랜치의 TaskAttempt 찾기
               if let Some(task_attempt) = TaskAttempt::find_by_branch(&db.pool, branch).await? {
                   // Task 상태 → Done
                   if let Some(task) = task_attempt.parent_task(&db.pool).await? {
                       Task::update_status(&db.pool, task.id, TaskStatus::Done).await?;

                       // 원격 서버 동기화
                       if let Ok(publisher) = deployment.share_publisher() {
                           publisher.update_shared_task_by_id(task.id).await?;
                       }

                       tracing::info!(
                           "✅ Auto-completed task {} via PR merge",
                           task.id
                       );
                   }

                   // Merge 레코드 업데이트
                   if let Some(merge) = Merge::find_latest_by_task_attempt_id(&db.pool, task_attempt.id).await? {
                       Merge::update_status(&db.pool, merge.id(), MergeStatus::Merged).await?;
                   }
               }
           }

           _ => {
               // 다른 이벤트는 무시
               tracing::debug!("Ignoring PR event: {}", action);
           }
       }

       Ok(())
   }

   pub fn webhook_routes() -> Router<DeploymentImpl> {
       Router::new()
           .route("/github", post(handle_github_webhook))
   }
   ```

4. **라우터 등록**
   ```rust
   // 파일: crates/server/src/lib.rs

   pub fn app_router() -> Router<DeploymentImpl> {
       Router::new()
           .nest("/api/projects", projects::project_routes())
           .nest("/api/tasks", tasks::task_routes())
           .nest("/api/task-attempts", task_attempts::task_attempt_routes())
           .nest("/api/webhooks", webhooks::webhook_routes())  // 🆕
           /* ... */
   }
   ```

**산출물:**
- ✅ Webhook handler
- ✅ Signature 검증
- ✅ 이벤트 처리 로직
- ✅ 단위 테스트

**테스트:**
```bash
# Webhook 시뮬레이션 테스트
cargo test -p server webhooks::tests::test_github_pr_merge_webhook
```

---

#### Day 13-14: Frontend 실시간 업데이트

**담당:** Frontend
**목표:** Webhook 이벤트를 SSE로 받아 UI 실시간 업데이트

**작업 항목:**

1. **SSE Hook 확장**
   ```typescript
   // 파일: frontend/src/hooks/useTaskUpdates.ts

   export const useTaskUpdates = (projectId: string) => {
     const queryClient = useQueryClient();

     useEffect(() => {
       const eventSource = new EventSource(`/api/events/projects/${projectId}/tasks`);

       eventSource.addEventListener('task_patch', (event) => {
         const patch = JSON.parse(event.data);

         if (patch.op === 'replace' && patch.path.includes('/status')) {
           // Task 상태 변경 감지
           const taskId = extractTaskIdFromPath(patch.path);
           const newStatus = patch.value;

           // 로컬 캐시 업데이트
           queryClient.setQueryData(['tasks', taskId], (old) => ({
             ...old,
             status: newStatus,
           }));

           // 애니메이션 트리거
           if (newStatus === 'done') {
             toast.success('✅ Task completed!', {
               description: 'PR was merged successfully',
             });
           }
         }
       });

       return () => eventSource.close();
     }, [projectId, queryClient]);
   };
   ```

2. **칸반 보드 애니메이션**
   ```tsx
   // 파일: frontend/src/components/tasks/KanbanBoard.tsx

   const KanbanBoard: React.FC = () => {
     const { tasks } = useTasks();
     const [animatingTaskId, setAnimatingTaskId] = useState<string | null>(null);

     useTaskUpdates(projectId);  // 🆕

     const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
       // 애니메이션 트리거
       setAnimatingTaskId(taskId);
       setTimeout(() => setAnimatingTaskId(null), 1000);
     };

     return (
       <div className="grid grid-cols-4 gap-4">
         {['todo', 'inprogress', 'inreview', 'done'].map((status) => (
           <Column key={status} status={status}>
             {tasks
               .filter((t) => t.status === status)
               .map((task) => (
                 <TaskCard
                   key={task.id}
                   task={task}
                   className={cn(
                     animatingTaskId === task.id && 'animate-pulse',
                   )}
                 />
               ))}
           </Column>
         ))}
       </div>
     );
   };
   ```

**산출물:**
- ✅ SSE 실시간 업데이트
- ✅ 칸반 보드 애니메이션
- ✅ Toast 알림

---

#### Day 15: GitHub Webhook 설정 가이드

**담당:** Documentation
**목표:** 사용자가 GitHub Webhook을 쉽게 설정할 수 있도록 문서화

**작업 항목:**

1. **설정 가이드 작성**
   ```markdown
   # GitHub Webhook 설정 가이드

   ## 1. Webhook Secret 생성

   ```bash
   openssl rand -base64 32
   # 출력: xK8jZp2+vL9mN4qR6sT8uV0wX3yA5bC7dE9fG1h=
   ```

   ## 2. 환경 변수 설정

   ```bash
   export GITHUB_WEBHOOK_SECRET=xK8jZp2+vL9mN4qR6sT8uV0wX3yA5bC7dE9fG1h=
   ```

   ## 3. GitHub Repository 설정

   1. Repository → Settings → Webhooks → Add webhook
   2. Payload URL: `https://your-anyon-server.com/api/webhooks/github`
   3. Content type: `application/json`
   4. Secret: (위에서 생성한 값)
   5. Events:
      - ☑ Pull requests
   6. Active: ☑
   7. Add webhook

   ## 4. 테스트

   1. PR 생성
   2. Anyon 로그 확인:
      ```bash
      tail -f logs/anyon.log | grep webhook
      ```
   3. PR merge
   4. Anyon에서 Task 자동 완료 확인
   ```

**산출물:**
- ✅ 설정 가이드 문서
- ✅ 트러블슈팅 섹션

---

## Phase 3: 고급 기능 (2주)

### Week 4-5: 자동 Rebase & 충돌 해결 (Day 16-25)

*(상세 계획은 Phase 1, 2 완료 후 작성)*

**주요 기능:**
- PR 생성 전 자동 rebase
- 충돌 감지 및 AI에게 해결 요청
- 브라우저 Push 알림
- 팀 활동 대시보드

---

## 5. 위험 관리

### 5.1 기술적 위험

| 위험 | 확률 | 영향 | 완화 전략 |
|------|------|------|----------|
| Git 충돌 처리 복잡도 | 높음 | 높음 | Phase 3로 연기, AI 충돌 해결 추가 |
| GitHub API Rate Limit | 중간 | 중간 | Rate Limiter 구현, 캐싱 |
| Webhook 신뢰성 | 낮음 | 높음 | Retry 메커니즘, 이벤트 큐 |
| 성능 저하 (대용량 Repo) | 중간 | 중간 | Shallow fetch, 병렬 처리 |

### 5.2 일정 위험

| 위험 | 완화 전략 |
|------|----------|
| Week 1 지연 | Week 2에서 버퍼 1일 확보 |
| 테스트 시간 부족 | 주말 버퍼 활용 |
| 통합 이슈 | 매일 standup으로 조기 발견 |

---

## 6. 성공 지표

### 6.1 기술 지표

- ✅ 단위 테스트 커버리지: 80% 이상
- ✅ 통합 테스트: 각 Phase당 5개 이상
- ✅ API 응답 시간: 평균 500ms 이하
- ✅ Webhook 처리 시간: 평균 1초 이하

### 6.2 사용성 지표

- ✅ Task 시작 클릭 수: 1회 (이전: 3회+)
- ✅ PR 생성 클릭 수: 1회 (이전: 5회+)
- ✅ Git 명령어 사용: 0회 (이전: 9회)
- ✅ 사용자 만족도: 4.5/5 이상

### 6.3 비즈니스 지표

- ✅ 팀 생산성: 20% 향상
- ✅ 온보딩 시간: 50% 감소
- ✅ 에러율: 30% 감소

---

## 7. 배포 계획

### 7.1 Alpha (Week 3)
- 내부 팀 테스트
- 피드백 수집

### 7.2 Beta (Week 5)
- 5-10개 파일럿 팀
- 버그 수정

### 7.3 GA (Week 6)
- 전체 공개
- 문서 완성
- 마케팅 시작

---

**문서 버전:** 1.0
**최종 업데이트:** 2025-11-17
**담당:** Engineering Team
