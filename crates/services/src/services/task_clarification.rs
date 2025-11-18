use std::{collections::HashSet, sync::Arc};

use async_trait::async_trait;
use db::{
    DBService,
    models::{
        plan_conversation::{CreatePlanConversation, PlanConversation},
        plan_question::{CreatePlanQuestion, PlanQuestion, QuestionCategory},
        task::Task,
    },
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::Error as SqlxError;
use thiserror::Error;
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
pub struct ClarificationQuestion {
    pub id: String,
    pub question: String,
    pub category: QuestionCategory,
    pub required: bool,
    pub suggested_answers: Option<Vec<String>>,
}

impl From<PlanQuestion> for ClarificationQuestion {
    fn from(value: PlanQuestion) -> Self {
        let suggested_answers = value
            .suggested_answers
            .as_ref()
            .and_then(|raw| serde_json::from_str(raw).ok());

        Self {
            id: value.question_id,
            question: value.question_text,
            category: value.category,
            required: value.required,
            suggested_answers,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct ClarificationAnswer {
    pub question_id: String,
    pub answer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct ClarificationExecutionContext {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct ClarificationExecutionRequest {
    pub prompt: String,
    pub context: Vec<ClarificationExecutionContext>,
    pub max_tokens: u32,
}

#[derive(Debug, Clone)]
pub struct ClarificationExecutionResponse {
    pub output: String,
}

#[derive(Debug, Error)]
pub enum ClarificationExecutorError {
    #[error("executor unavailable: {0}")]
    Unavailable(String),
    #[error("executor failed: {0}")]
    Failed(String),
}

#[async_trait]
pub trait ClarificationExecutor: Send + Sync {
    async fn execute_coding_agent_initial(
        &self,
        request: ClarificationExecutionRequest,
    ) -> Result<ClarificationExecutionResponse, ClarificationExecutorError>;
}

#[derive(Debug, Clone, Default)]
pub struct StubClarificationExecutor;

impl StubClarificationExecutor {
    fn parse_field(prompt: &str, marker: &str) -> String {
        prompt
            .lines()
            .find_map(|line| line.strip_prefix(marker))
            .map(|value| value.trim().to_string())
            .unwrap_or_default()
    }
}

#[async_trait]
impl ClarificationExecutor for StubClarificationExecutor {
    async fn execute_coding_agent_initial(
        &self,
        request: ClarificationExecutionRequest,
    ) -> Result<ClarificationExecutionResponse, ClarificationExecutorError> {
        if request.prompt.contains("Return a JSON array") {
            let title = Self::parse_field(&request.prompt, "Task Title:");
            let description = Self::parse_field(&request.prompt, "Task Description:");
            let feature_question = if title.is_empty() {
                "구현하려는 주요 기능의 핵심 흐름을 설명해주세요.".to_string()
            } else {
                format!("'{title}' 작업의 핵심 사용자 흐름은 무엇인가요?")
            };
            let ux_question = if description.is_empty() {
                "완료 후 사용자가 보게 될 주요 화면 상태는 무엇인가요?".to_string()
            } else {
                format!("설명된 시나리오에서 중요한 UI/UX 제약은 무엇인가요? ({description})")
            };
            let integration_question =
                "외부 서비스나 API 연동이 필요하다면 어떤 데이터가 오가나요?".to_string();

            let json = json!([
                {
                    "id": "q1",
                    "question": feature_question,
                    "category": "features",
                    "required": true,
                    "suggested_answers": ["Happy-path 상세", "Edge case", "기타"]
                },
                {
                    "id": "q2",
                    "question": ux_question,
                    "category": "ui",
                    "required": false,
                    "suggested_answers": ["데스크톱", "모바일", "반응형"]
                },
                {
                    "id": "q3",
                    "question": integration_question,
                    "category": "integration",
                    "required": false,
                    "suggested_answers": ["내부 API", "서드파티", "필요 없음"]
                }
            ])
            .to_string();

            return Ok(ClarificationExecutionResponse { output: json });
        }

        if request
            .prompt
            .contains("Summarize these task clarifications into clear requirements")
        {
            let title = Self::parse_field(&request.prompt, "Title:");
            let description = Self::parse_field(&request.prompt, "Description:");
            let qa = request
                .prompt
                .split("Clarification Q&A:")
                .nth(1)
                .map(|section| section.trim())
                .unwrap_or("(질문/답변 없음)");

            let summary = format!(
                "## 요구사항 요약\n✅ 작업명: {title}\n\n### 목표\n- {description}\n\n### Clarification\n{qa}\n\n위 정리 내용은 Stub Clarification Executor가 생성한 예시입니다.",
            );

            return Ok(ClarificationExecutionResponse { output: summary });
        }

        Err(ClarificationExecutorError::Failed(
            "Stub executor cannot interpret the provided prompt".to_string(),
        ))
    }
}

#[derive(Debug, Error)]
pub enum ClarificationError {
    #[error(transparent)]
    Database(#[from] SqlxError),
    #[error(transparent)]
    Executor(#[from] ClarificationExecutorError),
    #[error("invalid executor response: {0}")]
    InvalidResponse(String),
    #[error("question not found: {0}")]
    QuestionNotFound(String),
    #[error("no clarification questions available")]
    NoQuestions,
    #[error("no clarification answers available")]
    NoAnswers,
}

#[derive(Clone)]
pub struct TaskClarificationService {
    db: DBService,
    executor: Arc<dyn ClarificationExecutor>,
}

impl TaskClarificationService {
    pub fn new(db: DBService, executor: Arc<dyn ClarificationExecutor>) -> Self {
        Self { db, executor }
    }

    fn pool(&self) -> &sqlx::SqlitePool {
        &self.db.pool
    }

    pub async fn load_existing_questions(
        &self,
        task_id: Uuid,
    ) -> Result<Vec<ClarificationQuestion>, ClarificationError> {
        let stored = PlanQuestion::find_by_task(self.pool(), task_id).await?;
        Ok(stored
            .into_iter()
            .map(ClarificationQuestion::from)
            .collect())
    }

    pub async fn load_saved_answers(
        &self,
        task_id: Uuid,
    ) -> Result<Vec<ClarificationAnswer>, ClarificationError> {
        let conversations = PlanConversation::find_by_task(self.pool(), task_id).await?;
        Ok(conversations
            .into_iter()
            .map(|conversation| ClarificationAnswer {
                question_id: conversation.question_id,
                answer: conversation.answer,
            })
            .collect())
    }

    pub async fn generate_questions(
        &self,
        task: &Task,
    ) -> Result<Vec<ClarificationQuestion>, ClarificationError> {
        // Remove any stale records before generating new ones.
        PlanConversation::delete_by_task(self.pool(), task.id).await?;
        PlanQuestion::delete_by_task(self.pool(), task.id).await?;

        let prompt = format!(
            r#"You are a technical product manager analyzing a development task.

Task Title: {title}
Task Description: {description}

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
    "suggested_answers": ["Option 1", "Option 2"]
  }}
]

Only ask questions where the answer is not already clear from the title/description.
Prioritize the most impactful questions.
"#,
            title = task.title,
            description = task.description.clone().unwrap_or_default()
        );

        let response = self
            .executor
            .execute_coding_agent_initial(ClarificationExecutionRequest {
                prompt,
                context: vec![],
                max_tokens: 2_000,
            })
            .await?;

        let questions: Vec<ClarificationQuestion> = serde_json::from_str(&response.output)
            .map_err(|e| ClarificationError::InvalidResponse(e.to_string()))?;

        if questions.is_empty() {
            return Err(ClarificationError::NoQuestions);
        }

        for question in &questions {
            PlanQuestion::create(
                self.pool(),
                &CreatePlanQuestion {
                    task_id: task.id,
                    question_id: question.id.clone(),
                    question_text: question.question.clone(),
                    category: question.category.clone(),
                    required: question.required,
                    suggested_answers: question.suggested_answers.clone(),
                },
            )
            .await?;
        }

        Ok(questions)
    }

    pub async fn save_answer(
        &self,
        task_id: Uuid,
        question_id: &str,
        answer: &str,
    ) -> Result<(), ClarificationError> {
        let question =
            PlanQuestion::find_by_task_and_question_id(self.pool(), task_id, question_id)
                .await?
                .ok_or_else(|| ClarificationError::QuestionNotFound(question_id.to_string()))?;

        if let Some(existing) =
            PlanConversation::find_by_task_and_question_id(self.pool(), task_id, question_id)
                .await?
        {
            PlanConversation::update_answer(self.pool(), existing.id, answer, None).await?;
        } else {
            PlanConversation::create(
                self.pool(),
                &CreatePlanConversation {
                    task_id,
                    question_id: question.question_id.clone(),
                    question_text: question.question_text.clone(),
                    answer: answer.to_string(),
                    answered_by: None,
                },
            )
            .await?;
        }

        Ok(())
    }

    pub async fn generate_plan_summary(&self, task: &Task) -> Result<String, ClarificationError> {
        let conversations = PlanConversation::find_by_task(self.pool(), task.id).await?;
        if conversations.is_empty() {
            return Err(ClarificationError::NoAnswers);
        }

        let qa_text = conversations
            .iter()
            .map(|c| format!("Q: {}\nA: {}", c.question_text, c.answer))
            .collect::<Vec<_>>()
            .join("\n\n");

        let prompt = format!(
            r#"You are a technical writer. Summarize these task clarifications into clear requirements.

Original Task:
Title: {title}
Description: {description}

Clarification Q&A:
{qa}

Create a comprehensive requirements document with:
1. Summary of agreed requirements
2. Technical implementation details
3. User experience specifications
4. Performance/security requirements

Format in Markdown. Use ✅ checkmarks for confirmed items.
Write in Korean.
"#,
            title = task.title,
            description = task.description.clone().unwrap_or_default(),
            qa = qa_text
        );

        let response = self
            .executor
            .execute_coding_agent_initial(ClarificationExecutionRequest {
                prompt,
                context: vec![],
                max_tokens: 3_000,
            })
            .await?;

        Task::update_plan_summary(self.pool(), task.id, &response.output).await?;

        Ok(response.output)
    }

    pub async fn is_plan_complete(&self, task_id: Uuid) -> Result<bool, ClarificationError> {
        let questions = PlanQuestion::find_by_task(self.pool(), task_id).await?;
        if questions.is_empty() {
            return Ok(false);
        }

        let answers = PlanConversation::find_by_task(self.pool(), task_id).await?;
        if answers.is_empty() {
            return Ok(false);
        }

        let answered_ids: HashSet<String> = answers
            .iter()
            .map(|conversation| conversation.question_id.clone())
            .collect();

        let has_required = questions.iter().any(|q| q.required);
        let required_complete = questions
            .iter()
            .filter(|q| q.required)
            .all(|q| answered_ids.contains(&q.question_id));

        if has_required {
            Ok(required_complete)
        } else {
            Ok(!answered_ids.is_empty())
        }
    }
}
