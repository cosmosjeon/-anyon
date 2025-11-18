PRAGMA foreign_keys = OFF;

CREATE TABLE tasks_new (
    id                  BLOB PRIMARY KEY,
    project_id          BLOB NOT NULL,
    title               TEXT NOT NULL,
    description         TEXT,
    status              TEXT NOT NULL DEFAULT 'todo'
                            CHECK (status IN ('todo','planning','inprogress','done','cancelled','inreview')),
    plan_summary        TEXT,
    plan_started_at     TEXT,
    plan_completed_at   TEXT,
    parent_task_attempt BLOB REFERENCES task_attempts(id),
    shared_task_id      BLOB REFERENCES shared_tasks(id) ON DELETE SET NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

INSERT INTO tasks_new (
    id,
    project_id,
    title,
    description,
    status,
    plan_summary,
    plan_started_at,
    plan_completed_at,
    parent_task_attempt,
    shared_task_id,
    created_at,
    updated_at
)
SELECT
    id,
    project_id,
    title,
    description,
    status,
    NULL AS plan_summary,
    NULL AS plan_started_at,
    NULL AS plan_completed_at,
    parent_task_attempt,
    shared_task_id,
    created_at,
    updated_at
FROM tasks;

DROP TABLE tasks;

ALTER TABLE tasks_new RENAME TO tasks;

CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_attempt ON tasks(parent_task_attempt);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_shared_task_unique
    ON tasks(shared_task_id)
    WHERE shared_task_id IS NOT NULL;

PRAGMA foreign_keys = ON;

CREATE TABLE plan_questions (
    id                 BLOB PRIMARY KEY,
    task_id            BLOB NOT NULL,
    question_id        TEXT NOT NULL,
    question_text      TEXT NOT NULL,
    category           TEXT NOT NULL,
    required           INTEGER NOT NULL DEFAULT 0,
    suggested_answers  TEXT,
    created_at         TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, question_id)
);

CREATE INDEX idx_plan_questions_task ON plan_questions(task_id);

CREATE TABLE plan_conversations (
    id             BLOB PRIMARY KEY,
    task_id        BLOB NOT NULL,
    question_id    TEXT NOT NULL,
    question_text  TEXT NOT NULL,
    answer         TEXT NOT NULL,
    answered_by    TEXT,
    answered_at    TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE(task_id, question_id)
);

CREATE INDEX idx_plan_conversations_task ON plan_conversations(task_id);
CREATE INDEX idx_plan_conversations_answered ON plan_conversations(answered_at DESC);
