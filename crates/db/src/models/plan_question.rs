use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
#[serde(rename_all = "camelCase")]
#[ts(rename_all = "camelCase")]
pub enum QuestionCategory {
    Authentication,
    Security,
    Features,
    Performance,
    Ui,
    Integration,
    Other,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize, TS)]
pub struct PlanQuestion {
    pub id: Uuid,
    pub task_id: Uuid,
    pub question_id: String,
    pub question_text: String,
    pub category: QuestionCategory,
    pub required: bool,
    #[ts(type = "string[] | null")]
    pub suggested_answers: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct CreatePlanQuestion {
    pub task_id: Uuid,
    pub question_id: String,
    pub question_text: String,
    pub category: QuestionCategory,
    pub required: bool,
    pub suggested_answers: Option<Vec<String>>,
}

impl PlanQuestion {
    pub async fn create(pool: &SqlitePool, data: &CreatePlanQuestion) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();
        let suggested_answers = data
            .suggested_answers
            .as_ref()
            .map(|answers| serde_json::to_string(answers).expect("failed to serialize suggested answers"));

        sqlx::query_as!(
            PlanQuestion,
            r#"INSERT INTO plan_questions (
                    id,
                    task_id,
                    question_id,
                    question_text,
                    category,
                    required,
                    suggested_answers
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING
                    id as "id!: Uuid",
                    task_id as "task_id!: Uuid",
                    question_id,
                    question_text,
                    category as "category!: QuestionCategory",
                    required as "required!: bool",
                    suggested_answers,
                    created_at as "created_at!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.question_id,
            data.question_text,
            data.category,
            data.required,
            suggested_answers
        )
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            PlanQuestion,
            r#"SELECT
                    id as "id!: Uuid",
                    task_id as "task_id!: Uuid",
                    question_id,
                    question_text,
                    category as "category!: QuestionCategory",
                    required as "required!: bool",
                    suggested_answers,
                    created_at as "created_at!: DateTime<Utc>"
               FROM plan_questions
               WHERE task_id = $1
               ORDER BY created_at ASC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn delete_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM plan_questions WHERE task_id = $1", task_id)
            .execute(pool)
            .await?;
        Ok(())
    }

    pub async fn find_by_task_and_question_id(
        pool: &SqlitePool,
        task_id: Uuid,
        question_id: &str,
    ) -> Result<Option<Self>, sqlx::Error> {
        sqlx::query_as!(
            PlanQuestion,
            r#"SELECT
                    id as "id!: Uuid",
                    task_id as "task_id!: Uuid",
                    question_id,
                    question_text,
                    category as "category!: QuestionCategory",
                    required as "required!: bool",
                    suggested_answers,
                    created_at as "created_at!: DateTime<Utc>"
               FROM plan_questions
               WHERE task_id = $1 AND question_id = $2
               LIMIT 1"#,
            task_id,
            question_id
        )
        .fetch_optional(pool)
        .await
    }
}
