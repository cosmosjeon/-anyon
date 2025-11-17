# Plan Stage Design - AI Task Clarification

> **목표:** Task 개발 전에 AI가 애매한 요구사항을 명확히 하여 잘못된 구현 방지

**작성일:** 2025-11-17
**버전:** 1.0
**상태:** 설계 단계

---

## 📋 목차

1. [개요](#1-개요)
2. [문제 정의](#2-문제-정의)
3. [Plan Stage 워크플로우](#3-plan-stage-워크플로우)
4. [AI 명확화 서비스](#4-ai-명확화-서비스)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [API 설계](#6-api-설계)
7. [Frontend UI 설계](#7-frontend-ui-설계)
8. [Zero-Git 통합](#8-zero-git-통합)
9. [구현 계획](#9-구현-계획)

---

## 1. 개요

### 1.1 핵심 가치 제안

**Before (현재):**
```
Todo → InProgress (개발 시작)
  ↓
❌ "로그인 기능 추가" → 어떤 로그인? OAuth? Email? 소셜?
❌ 불명확한 요구사항으로 잘못 개발
❌ 재작업 필요
```

**After (Plan Stage 추가):**
```
Todo → Plan (AI 질문) → InProgress (명확한 개발)
  ↓
✅ AI: "어떤 인증 방식을 원하시나요? OAuth, Email/Password, 소셜 로그인?"
✅ 사용자: "Google OAuth와 Email/Password 둘 다"
✅ 명확한 요구사항으로 정확한 개발
```

### 1.2 목표

- **재작업 50% 감소**: 명확한 요구사항으로 첫 시도에 성공
- **AI 개발 정확도 향상**: 구체적인 지시로 더 나은 코드
- **사용자 경험 개선**: "뭘 만들지 모르겠다" → "이거 만들면 되는구나!"

---

## 2. 문제 정의

### 2.1 현재 문제

**예시 1: 애매한 Task**
```
Title: "로그인 기능 추가"
Description: "사용자가 로그인할 수 있게 해주세요"

❌ 불명확한 부분:
- 인증 방식? (OAuth, Email/Password, 소셜)
- 2FA 필요?
- 비밀번호 재설정 포함?
- 세션 vs JWT?
```

**예시 2: 기술적 디테일 부족**
```
Title: "API 성능 개선"
Description: "API가 느려요"

❌ 불명확한 부분:
- 어떤 API?
- 현재 응답 시간? 목표 응답 시간?
- 병목 지점? (DB, 네트워크, 로직)
- 캐싱 전략?
```

### 2.2 해결 방안

**Plan Stage에서 AI가 자동으로 질문:**
1. Task title과 description 분석
2. 애매하거나 부족한 정보 감지
3. 구체적인 질문 생성
4. 사용자 답변 수집
5. 명확한 요구사항 문서화

---

## 3. Plan Stage 워크플로우

### 3.1 전체 플로우

```
┌─────────┐
│  Todo   │  사용자가 Task 생성
└────┬────┘
     │ "Plan" 버튼 클릭
     ▼
┌─────────┐
│  Plan   │  🆕 AI가 질문 생성 및 Q&A
└────┬────┘      - AI: "어떤 인증 방식?"
     │           - 사용자: "Google OAuth"
     │           - AI: "2FA 필요?"
     │           - 사용자: "아니요"
     │
     │ "Start Development" 클릭
     ▼
┌──────────────┐
│ InProgress   │  개발 시작 (Zero-Git Auto Sync)
└──────────────┘
```

### 3.2 상세 단계

#### Step 1: Todo → Plan 전환

**Trigger:** 사용자가 "Plan" 버튼 클릭

**Backend:**
1. Task status를 `planning`으로 변경
2. AI Clarification Service 호출
3. Initial questions 생성

**Frontend:**
1. Plan Dialog 표시
2. AI 질문 리스트 표시
3. 답변 입력 UI

#### Step 2: AI 질문 생성

**AI Prompt:**
```
You are a technical product manager. Analyze this task and ask clarifying questions.

Task Title: "{title}"
Task Description: "{description}"

Identify ambiguous or missing information and generate 3-5 specific questions.
Focus on:
- Technical implementation details
- User experience requirements
- Performance/scalability needs
- Security considerations
- Dependencies or integrations

Format: JSON array of questions
```

**AI Response:**
```json
[
  {
    "id": "q1",
    "question": "어떤 인증 방식을 원하시나요? (OAuth, Email/Password, 소셜 로그인)",
    "category": "authentication",
    "required": true
  },
  {
    "id": "q2",
    "question": "2단계 인증(2FA)이 필요한가요?",
    "category": "security",
    "required": false
  },
  {
    "id": "q3",
    "question": "비밀번호 재설정 기능을 포함해야 하나요?",
    "category": "features",
    "required": false
  }
]
```

#### Step 3: 사용자 답변 수집

**UI:**
- 각 질문에 대한 입력 필드
- Required 질문은 필수 표시
- 답변 저장은 실시간 (auto-save)

**Database:**
- `plan_conversations` 테이블에 Q&A 저장

#### Step 4: 명확화된 요구사항 생성

**AI가 최종 요구사항 문서 생성:**
```
Original Task: "로그인 기능 추가"

Clarified Requirements:
✅ 인증 방식: Google OAuth + Email/Password 로그인
✅ 2FA: 불필요
✅ 비밀번호 재설정: 포함
✅ 세션 관리: JWT 토큰 기반
✅ UI: 기존 디자인 시스템 사용

Technical Details:
- OAuth Library: passport.js
- Password Hashing: bcrypt
- Token Expiry: 7 days
```

**저장 위치:** Task의 `plan_summary` 필드

#### Step 5: Plan → InProgress 전환

**Trigger:** 사용자가 "Start Development" 클릭

**Backend:**
1. Task status를 `inprogress`로 변경
2. Zero-Git Auto Sync 실행
3. Worktree 생성
4. AI Executor에게 `plan_summary` 전달

**Frontend:**
1. Plan Dialog 닫기
2. Kanban 카드 InProgress 컬럼으로 이동
3. "Sync in progress..." 표시

---

## 4. AI 명확화 서비스

### 4.1 서비스 구조

**위치:** `crates/services/src/services/task_clarification.rs`

```rust
pub struct TaskClarificationService {
    db: DBService,
    executor: Box<dyn Executor>,
}

impl TaskClarificationService {
    /// Task 분석 및 질문 생성
    pub async fn generate_questions(
        &self,
        task: &Task,
    ) -> Result<Vec<ClarificationQuestion>, ClarificationError>;

    /// 사용자 답변 저장
    pub async fn save_answer(
        &self,
        task_id: Uuid,
        question_id: &str,
        answer: &str,
    ) -> Result<(), ClarificationError>;

    /// 최종 요구사항 문서 생성
    pub async fn generate_plan_summary(
        &self,
        task: &Task,
    ) -> Result<String, ClarificationError>;

    /// Plan 완료 여부 확인
    pub async fn is_plan_complete(
        &self,
        task_id: Uuid,
    ) -> Result<bool, ClarificationError>;
}
```

### 4.2 질문 생성 로직

```rust
pub async fn generate_questions(
    &self,
    task: &Task,
) -> Result<Vec<ClarificationQuestion>, ClarificationError> {
    // 1. AI Prompt 구성
    let prompt = format!(
        r#"You are a technical product manager analyzing a development task.

Task Title: {}
Task Description: {}

Analyze this task and generate 3-5 clarifying questions to ensure clear requirements.

Focus areas:
1. Technical implementation details (frameworks, libraries, architecture)
2. User experience requirements (UI/UX, workflows)
3. Performance and scalability (response time, concurrent users)
4. Security considerations (authentication, authorization, data protection)
5. Dependencies and integrations (APIs, databases, services)

Return a JSON array with this format:
[
  {{
    "id": "q1",
    "question": "Question text in Korean",
    "category": "authentication|security|features|performance|ui|integration",
    "required": true|false,
    "suggested_answers": ["Option 1", "Option 2", "Option 3"] (optional)
  }}
]

Only ask questions where the answer is not already clear from the title/description.
Prioritize the most impactful questions.
"#,
        task.title,
        task.description.as_deref().unwrap_or(""),
    );

    // 2. AI Executor 호출
    let response = self.executor.execute_coding_agent_initial(
        ExecutionRequest {
            prompt,
            context: vec![],
            max_tokens: 2000,
        }
    ).await?;

    // 3. JSON 파싱
    let questions: Vec<ClarificationQuestion> = serde_json::from_str(&response.output)
        .map_err(|e| ClarificationError::InvalidResponse(e.to_string()))?;

    // 4. Database 저장
    for question in &questions {
        PlanQuestion::create(&self.db.pool, CreatePlanQuestion {
            task_id: task.id,
            question_id: question.id.clone(),
            question_text: question.question.clone(),
            category: question.category.clone(),
            required: question.required,
            suggested_answers: question.suggested_answers.clone(),
        }).await?;
    }

    Ok(questions)
}
```

### 4.3 요약 생성 로직

```rust
pub async fn generate_plan_summary(
    &self,
    task: &Task,
) -> Result<String, ClarificationError> {
    // 1. 모든 Q&A 가져오기
    let conversations = PlanConversation::find_by_task(&self.db.pool, task.id).await?;

    // 2. Q&A를 문자열로 변환
    let qa_text = conversations
        .iter()
        .map(|c| format!("Q: {}\nA: {}", c.question_text, c.answer))
        .collect::<Vec<_>>()
        .join("\n\n");

    // 3. AI Prompt
    let prompt = format!(
        r#"You are a technical writer. Summarize these task clarifications into clear requirements.

Original Task:
Title: {}
Description: {}

Clarification Q&A:
{}

Create a comprehensive requirements document with:
1. Summary of agreed requirements
2. Technical implementation details
3. User experience specifications
4. Performance/security requirements

Format in Markdown. Use ✅ checkmarks for confirmed items.
Write in Korean.
"#,
        task.title,
        task.description.as_deref().unwrap_or(""),
        qa_text,
    );

    // 4. AI 호출
    let response = self.executor.execute_coding_agent_initial(
        ExecutionRequest {
            prompt,
            context: vec![],
            max_tokens: 3000,
        }
    ).await?;

    // 5. Task 업데이트
    Task::update_plan_summary(&self.db.pool, task.id, &response.output).await?;

    Ok(response.output)
}
```

---

## 5. 데이터베이스 스키마

### 5.1 Task Status 확장

```sql
-- 기존 status enum에 'planning' 추가
-- 파일: crates/db/migrations/20251119000000_add_planning_stage.sql

-- Tasks 테이블 확장
ALTER TABLE tasks ADD COLUMN plan_summary TEXT;
ALTER TABLE tasks ADD COLUMN plan_started_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN plan_completed_at TIMESTAMP;
```

**Rust Enum 업데이트:**
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

### 5.2 새 테이블: plan_questions

```sql
CREATE TABLE plan_questions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    question_id TEXT NOT NULL,  -- q1, q2, q3...
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,  -- authentication, security, features, etc.
    required BOOLEAN DEFAULT FALSE,
    suggested_answers TEXT,  -- JSON array
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, question_id)
);

CREATE INDEX idx_plan_questions_task ON plan_questions(task_id);
```

**Rust Model:**
```rust
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
```

### 5.3 새 테이블: plan_conversations

```sql
CREATE TABLE plan_conversations (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    answer TEXT NOT NULL,
    answered_by TEXT,  -- user_id
    answered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, question_id)
);

CREATE INDEX idx_plan_conversations_task ON plan_conversations(task_id);
CREATE INDEX idx_plan_conversations_answered ON plan_conversations(answered_at DESC);
```

**Rust Model:**
```rust
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

---

## 6. API 설계

### 6.1 Plan 시작

```
POST /api/tasks/{id}/start-planning

Request: {}

Response:
{
  "success": true,
  "data": {
    "task_status": "planning",
    "questions": [
      {
        "id": "q1",
        "question": "어떤 인증 방식을 원하시나요?",
        "category": "authentication",
        "required": true,
        "suggested_answers": ["OAuth", "Email/Password", "소셜 로그인"]
      },
      {
        "id": "q2",
        "question": "2FA가 필요한가요?",
        "category": "security",
        "required": false,
        "suggested_answers": ["예", "아니요"]
      }
    ]
  }
}
```

**Handler:**
```rust
pub async fn start_planning(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<ApiResponse<StartPlanningResponse>>, ApiError> {
    let db = deployment.db();
    let clarification = TaskClarificationService::new(db.clone(), deployment.default_executor());

    // 1. Task 가져오기
    let task = Task::find_by_id(&db.pool, task_id).await?
        .ok_or(ApiError::NotFound("Task not found".to_string()))?;

    // 2. 상태 확인
    if task.status != TaskStatus::Todo {
        return Err(ApiError::BadRequest("Task must be in 'todo' status".to_string()));
    }

    // 3. 질문 생성
    let questions = clarification.generate_questions(&task).await?;

    // 4. Task 상태 업데이트
    Task::update_status(&db.pool, task_id, TaskStatus::Planning).await?;
    Task::mark_plan_started(&db.pool, task_id).await?;

    // 5. 원격 동기화
    if let Ok(publisher) = deployment.share_publisher() {
        publisher.update_shared_task_by_id(task_id).await?;
    }

    Ok(Json(ApiResponse::success(StartPlanningResponse {
        task_status: TaskStatus::Planning,
        questions,
    })))
}
```

### 6.2 답변 저장

```
POST /api/tasks/{id}/plan-answers

Request:
{
  "answers": [
    {
      "question_id": "q1",
      "answer": "Google OAuth와 Email/Password 둘 다"
    },
    {
      "question_id": "q2",
      "answer": "아니요"
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "saved_count": 2,
    "is_complete": true,
    "plan_summary": "## 명확화된 요구사항\n\n✅ 인증: Google OAuth + Email/Password\n..."
  }
}
```

**Handler:**
```rust
pub async fn save_plan_answers(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
    Json(request): Json<SavePlanAnswersRequest>,
) -> Result<Json<ApiResponse<SavePlanAnswersResponse>>, ApiError> {
    let db = deployment.db();
    let clarification = TaskClarificationService::new(db.clone(), deployment.default_executor());

    // 1. Task 확인
    let task = Task::find_by_id(&db.pool, task_id).await?
        .ok_or(ApiError::NotFound("Task not found".to_string()))?;

    // 2. 답변 저장
    for answer in &request.answers {
        clarification.save_answer(task_id, &answer.question_id, &answer.answer).await?;
    }

    // 3. 완료 여부 확인
    let is_complete = clarification.is_plan_complete(task_id).await?;

    // 4. 완료 시 요약 생성
    let plan_summary = if is_complete {
        let summary = clarification.generate_plan_summary(&task).await?;
        Task::mark_plan_completed(&db.pool, task_id).await?;
        Some(summary)
    } else {
        None
    };

    Ok(Json(ApiResponse::success(SavePlanAnswersResponse {
        saved_count: request.answers.len(),
        is_complete,
        plan_summary,
    })))
}
```

### 6.3 Plan 완료 및 개발 시작

```
POST /api/tasks/{id}/complete-planning

Request: {}

Response:
{
  "success": true,
  "data": {
    "task_status": "inprogress",
    "plan_summary": "...",
    "sync_info": {
      "synced": true,
      "commits_pulled": 3
    }
  }
}
```

**Handler:**
```rust
pub async fn complete_planning(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
) -> Result<Json<ApiResponse<CompletePlanningResponse>>, ApiError> {
    let db = deployment.db();

    // 1. Task 확인
    let task = Task::find_by_id(&db.pool, task_id).await?
        .ok_or(ApiError::NotFound("Task not found".to_string()))?;

    if task.status != TaskStatus::Planning {
        return Err(ApiError::BadRequest("Task must be in 'planning' status".to_string()));
    }

    // 2. Plan 완료 확인
    let clarification = TaskClarificationService::new(db.clone(), deployment.default_executor());
    if !clarification.is_plan_complete(task_id).await? {
        return Err(ApiError::BadRequest("Please answer all required questions".to_string()));
    }

    // 3. 요약이 없으면 생성
    let plan_summary = if task.plan_summary.is_none() {
        clarification.generate_plan_summary(&task).await?
    } else {
        task.plan_summary.unwrap()
    };

    // 4. Task 상태 → InProgress
    Task::update_status(&db.pool, task_id, TaskStatus::InProgress).await?;

    // 5. 이후 로직은 기존 start_task_attempt와 동일
    // (Zero-Git Auto Sync, Worktree 생성 등)

    Ok(Json(ApiResponse::success(CompletePlanningResponse {
        task_status: TaskStatus::InProgress,
        plan_summary,
        sync_info: None,  // 실제로는 sync 정보 포함
    })))
}
```

---

## 7. Frontend UI 설계

### 7.1 Kanban Board 업데이트

**4개 컬럼 → 5개 컬럼:**
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

### 7.2 Plan Dialog

```tsx
// 파일: frontend/src/components/dialogs/PlanTaskDialog.tsx

interface PlanTaskDialogProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

export const PlanTaskDialog: React.FC<PlanTaskDialogProps> = ({
  task,
  onClose,
  onComplete,
}) => {
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [planSummary, setPlanSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. 질문 로드
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const result = await api.startPlanning(task.id);
        setQuestions(result.questions);
      } catch (error) {
        toast.error('Failed to generate questions');
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [task.id]);

  // 2. 답변 저장 (auto-save)
  const handleAnswerChange = useDebouncedCallback(
    async (questionId: string, answer: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));

      // Auto-save to backend
      try {
        const result = await api.savePlanAnswers(task.id, {
          answers: [{ question_id: questionId, answer }],
        });

        if (result.is_complete && result.plan_summary) {
          setPlanSummary(result.plan_summary);
          toast.success('✅ Planning complete!');
        }
      } catch (error) {
        toast.error('Failed to save answer');
      }
    },
    500
  );

  // 3. 개발 시작
  const handleStartDevelopment = async () => {
    setIsSaving(true);
    try {
      await api.completePlanning(task.id);
      toast.success('🚀 Development started!');
      onComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to start development');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. 완료 여부 확인
  const allRequiredAnswered = questions
    .filter((q) => q.required)
    .every((q) => answers[q.id]?.trim());

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📝 Plan: {task.title}</DialogTitle>
          <DialogDescription>
            AI가 요구사항을 명확히 하기 위해 몇 가지 질문을 드립니다
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">AI가 질문을 생성하고 있습니다...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Questions */}
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id}>
                  {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                  <Badge variant="outline" className="ml-2">
                    {question.category}
                  </Badge>
                </Label>

                {question.suggested_answers ? (
                  <Select
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    <SelectTrigger id={question.id}>
                      <SelectValue placeholder="선택하세요..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.suggested_answers.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    id={question.id}
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="답변을 입력하세요..."
                    rows={3}
                  />
                )}
              </div>
            ))}

            {/* Plan Summary */}
            {planSummary && (
              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-semibold mb-2">✅ 명확화된 요구사항</h3>
                <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md">
                  <ReactMarkdown>{planSummary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleStartDevelopment}
            disabled={!allRequiredAnswered || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🚀 Start Development
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### 7.3 TaskCard 버튼 업데이트

```tsx
// 파일: frontend/src/components/tasks/TaskCard.tsx

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  const renderActionButton = () => {
    switch (task.status) {
      case 'todo':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPlanDialog(true)}
          >
            📝 Plan
          </Button>
        );

      case 'planning':
        return (
          <Button
            size="sm"
            variant="default"
            onClick={() => setShowPlanDialog(true)}
          >
            ✏️ Continue Planning
          </Button>
        );

      case 'inprogress':
        return (
          <Button size="sm" onClick={() => setShowCompleteDialog(true)}>
            ✅ Complete
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{task.title}</CardTitle>
        <CardDescription>{task.description}</CardDescription>
      </CardHeader>

      <CardFooter>{renderActionButton()}</CardFooter>

      {showPlanDialog && (
        <PlanTaskDialog
          task={task}
          onClose={() => setShowPlanDialog(false)}
          onComplete={() => {
            setShowPlanDialog(false);
            queryClient.invalidateQueries(['tasks']);
          }}
        />
      )}
    </Card>
  );
};
```

---

## 8. Zero-Git 통합

### 8.1 Plan Summary를 AI Executor에 전달

**기존 start_task_attempt 수정:**
```rust
pub async fn start_task_attempt(
    State(deployment): State<DeploymentImpl>,
    Path(task_id): Path<Uuid>,
    Json(request): Json<StartTaskAttemptRequest>,
) -> Result<Json<ApiResponse<StartTaskAttemptResponse>>, ApiError> {
    let task = /* ... */;

    // 🆕 Plan Summary를 AI context에 추가
    let mut context = vec![];
    if let Some(plan_summary) = &task.plan_summary {
        context.push(ExecutionContext {
            role: "system",
            content: format!(
                "Requirements from planning phase:\n\n{}",
                plan_summary
            ),
        });
    }

    // AI Executor 호출
    let execution = executor.execute_coding_agent_initial(ExecutionRequest {
        prompt: task.description.clone().unwrap_or_default(),
        context,  // 🆕
        /* ... */
    }).await?;

    /* ... */
}
```

### 8.2 워크플로우 통합

**전체 플로우:**
```
1. Todo: Task 생성
   └─► "Plan" 버튼 클릭

2. Planning: AI 질문 & 답변
   └─► Plan Summary 생성
   └─► "Start Development" 클릭

3. InProgress: (Zero-Git 시작)
   └─► Auto git pull
   └─► Worktree 생성
   └─► AI 개발 (Plan Summary 기반)

4. Complete: (Zero-Git 완료)
   └─► Auto commit
   └─► Auto push
   └─► PR 자동 생성

5. InReview: PR 대기
   └─► GitHub PR Merge

6. Done: (Webhook)
   └─► 자동 완료
```

---

## 9. 구현 계획

### Phase 0: Plan Stage (1.5주, Zero-Git 이전)

**우선순위: 높음**
**이유:** Planning은 Zero-Git과 독립적이며, 먼저 구현하면 요구사항 품질 향상

#### Week 0.5: Database & Service (Day 1-3)

**Day 1: Database**
- Migration 생성 (`20251119000000_add_planning_stage.sql`)
- TaskStatus enum에 `Planning` 추가
- `plan_questions`, `plan_conversations` 테이블 생성
- Model 구현 (`PlanQuestion`, `PlanConversation`)

**Day 2-3: TaskClarificationService**
- Service 구조 생성
- `generate_questions()` 구현
- `save_answer()` 구현
- `generate_plan_summary()` 구현
- 단위 테스트 (10개)

**산출물:**
- ✅ Database migration
- ✅ Service implementation
- ✅ 80% test coverage

#### Week 1: API & Frontend (Day 4-8)

**Day 4-5: API Endpoints**
- `POST /api/tasks/{id}/start-planning`
- `POST /api/tasks/{id}/plan-answers`
- `POST /api/tasks/{id}/complete-planning`
- TypeScript type generation
- API 테스트

**Day 6-8: Frontend**
- Kanban Board 5개 컬럼으로 확장
- PlanTaskDialog 컴포넌트
- TaskCard 버튼 로직
- Auto-save 기능
- UI 테스트

**산출물:**
- ✅ 3개 API endpoints
- ✅ Plan Dialog UI
- ✅ End-to-end 테스트

#### Week 1.5: 통합 & 테스트 (Day 9-10)

**Day 9: Zero-Git 통합**
- `start_task_attempt`에 Plan Summary 전달
- AI Executor context 업데이트

**Day 10: 통합 테스트**
- 전체 플로우 테스트 (Todo → Plan → InProgress → Done)
- 문서 업데이트
- 버그 수정

**산출물:**
- ✅ 완전한 Plan Stage 기능
- ✅ Zero-Git과 통합
- ✅ 사용자 가이드

---

## 10. 성공 지표

### 10.1 기술 지표

- ✅ AI 질문 생성 시간: 평균 3초 이하
- ✅ Plan Summary 생성 시간: 평균 5초 이하
- ✅ 단위 테스트 커버리지: 85% 이상
- ✅ 사용자 답변 Auto-save: 500ms 이하

### 10.2 사용성 지표

- ✅ 재작업 발생률: 50% 감소 (현재 30% → 15%)
- ✅ AI 개발 정확도: 70% → 90%
- ✅ 평균 Planning 시간: 5분
- ✅ 사용자 만족도: 4.5/5 이상

### 10.3 비즈니스 지표

- ✅ 개발 속도: 20% 향상 (재작업 감소로)
- ✅ 요구사항 명확도: 80% → 95%
- ✅ 프로젝트 성공률: 15% 향상

---

## 11. 예시 시나리오

### Scenario 1: 로그인 기능

**Before:**
```
Title: "로그인 기능 추가"
Description: "사용자가 로그인할 수 있게"

→ AI가 Email/Password 로그인 구현
→ PM: "아니 OAuth로 해야 하는데..."
→ 재작업 2일
```

**After:**
```
Title: "로그인 기능 추가"
Description: "사용자가 로그인할 수 있게"

→ Plan Stage:
   Q1: "어떤 인증 방식?" → A: "Google OAuth"
   Q2: "2FA 필요?" → A: "네"
   Q3: "비밀번호 재설정?" → A: "네"

→ AI가 정확히 구현
→ 재작업 0일
```

### Scenario 2: API 성능 개선

**Before:**
```
Title: "API 성능 개선"
Description: "느려요"

→ AI가 무작위로 캐싱 추가
→ 실제 문제는 N+1 쿼리
→ 재작업 3일
```

**After:**
```
Title: "API 성능 개선"
Description: "느려요"

→ Plan Stage:
   Q1: "어떤 API가 느린가요?" → A: "/api/tasks (5초)"
   Q2: "목표 응답 시간?" → A: "500ms 이하"
   Q3: "병목 지점을 아시나요?" → A: "N+1 쿼리 의심"

→ AI가 정확히 N+1 쿼리 최적화
→ 재작업 0일
```

---

## 부록 A: AI Prompt 템플릿

### A.1 질문 생성 Prompt

```
You are a technical product manager analyzing a development task.

Task Title: {title}
Task Description: {description}
Project Context: {project_info}

Your goal: Generate 3-5 clarifying questions to ensure the developer has all necessary information.

Categories to consider:
1. **Technical** - Frameworks, libraries, architecture patterns
2. **UX** - User flows, UI components, interactions
3. **Performance** - Response time, scalability, caching
4. **Security** - Authentication, authorization, data protection
5. **Integration** - APIs, databases, third-party services

Guidelines:
- Only ask if the answer is NOT clear from title/description
- Prioritize high-impact questions
- Use specific, actionable language
- Provide suggested answers when applicable
- Mark critical questions as required

Output Format (JSON):
[
  {
    "id": "q1",
    "question": "Question in Korean",
    "category": "technical|ux|performance|security|integration",
    "required": true|false,
    "suggested_answers": ["Option 1", "Option 2"] (optional)
  }
]
```

### A.2 요약 생성 Prompt

```
You are a technical writer creating clear requirements documentation.

Original Task:
Title: {title}
Description: {description}

Q&A from Planning:
{qa_pairs}

Create a comprehensive requirements document:

## ✅ 명확화된 요구사항
[Summary of agreed requirements]

## 🔧 기술 구현 사항
[Technical details: frameworks, libraries, patterns]

## 🎨 사용자 경험
[UI/UX specifications]

## ⚡ 성능 & 보안
[Performance targets, security requirements]

## 📦 종속성
[Dependencies, integrations, APIs]

Format: Markdown
Language: Korean
Use ✅ for confirmed items
Be specific and actionable
```

---

**문서 버전:** 1.0
**최종 업데이트:** 2025-11-17
**작성자:** Architecture Team
