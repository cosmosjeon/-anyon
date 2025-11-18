use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, SqlitePool};
use ts_rs::TS;
use uuid::Uuid;

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

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
pub struct CreatePlanConversation {
    pub task_id: Uuid,
    pub question_id: String,
    pub question_text: String,
    pub answer: String,
    pub answered_by: Option<String>,
}

impl PlanConversation {
    pub async fn create(
        pool: &SqlitePool,
        data: &CreatePlanConversation,
    ) -> Result<Self, sqlx::Error> {
        let id = Uuid::new_v4();

        sqlx::query_as!(
            PlanConversation,
            r#"INSERT INTO plan_conversations (
                    id,
                    task_id,
                    question_id,
                    question_text,
                    answer,
                    answered_by
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    id as "id!: Uuid",
                    task_id as "task_id!: Uuid",
                    question_id,
                    question_text,
                    answer,
                    answered_by,
                    answered_at as "answered_at!: DateTime<Utc>""#,
            id,
            data.task_id,
            data.question_id,
            data.question_text,
            data.answer,
            data.answered_by
        )
        .fetch_one(pool)
        .await
    }

    pub async fn find_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<Vec<Self>, sqlx::Error> {
        sqlx::query_as!(
            PlanConversation,
            r#"SELECT
                    id as "id!: Uuid",
                    task_id as "task_id!: Uuid",
                    question_id,
                    question_text,
                    answer,
                    answered_by,
                    answered_at as "answered_at!: DateTime<Utc>"
               FROM plan_conversations
               WHERE task_id = $1
               ORDER BY answered_at ASC"#,
            task_id
        )
        .fetch_all(pool)
        .await
    }

    pub async fn update_answer(
        pool: &SqlitePool,
        id: Uuid,
        answer: &str,
        answered_by: Option<&str>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"UPDATE plan_conversations
               SET answer = $2,
                   answered_by = $3,
                   answered_at = datetime('now', 'subsec')
               WHERE id = $1"#,
            id,
            answer,
            answered_by
        )
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
            PlanConversation,
            r#"SELECT
                    id as "id!: Uuid",
                    task_id as "task_id!: Uuid",
                    question_id,
                    question_text,
                    answer,
                    answered_by,
                    answered_at as "answered_at!: DateTime<Utc>"
               FROM plan_conversations
               WHERE task_id = $1 AND question_id = $2
               LIMIT 1"#,
            task_id,
            question_id
        )
        .fetch_optional(pool)
        .await
    }

    pub async fn delete_by_task(pool: &SqlitePool, task_id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!("DELETE FROM plan_conversations WHERE task_id = $1", task_id)
            .execute(pool)
            .await?;
        Ok(())
    }
}
