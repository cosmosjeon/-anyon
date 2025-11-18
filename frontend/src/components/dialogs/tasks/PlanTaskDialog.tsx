import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { tasksApi } from '@/lib/api';
import type {
  ClarificationQuestion,
  PlanAnswerInput,
  TaskWithAttemptStatus,
} from 'shared/types';

interface PlanTaskDialogProps {
  task: TaskWithAttemptStatus;
}

type AnswerRecord = Record<string, string>;
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const PlanTaskDialog = NiceModal.create<PlanTaskDialogProps>(({ task }) => {
  const modal = useModal();
  const { t } = useTranslation('tasks');
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerRecord>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planSummary, setPlanSummary] = useState<string | null>(
    task.plan_summary ?? null
  );
  const [isComplete, setIsComplete] = useState<boolean>(
    Boolean(task.plan_summary)
  );
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const resetTimers = () => {
    Object.values(timersRef.current).forEach((timer) => {
      clearTimeout(timer);
    });
    timersRef.current = {};
  };

  const initializeAnswers = (existing: PlanAnswerInput[]) => {
    const initial: AnswerRecord = {};
    const initialStates: Record<string, SaveState> = {};
    existing.forEach((entry) => {
      initial[entry.question_id] = entry.answer;
      initialStates[entry.question_id] = 'saved';
    });
    setAnswers(initial);
    if (existing.length) {
      setSaveStates((prev) => ({ ...prev, ...initialStates }));
    }
  };

  const loadPlanState = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await tasksApi.startPlanning(task.id);
      setQuestions(response.questions);
      initializeAnswers(response.existing_answers);
      setPlanSummary(response.plan_summary ?? task.plan_summary ?? null);
      setIsComplete(Boolean(response.plan_summary ?? task.plan_summary));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t('planDialog.errors.loadFailed', 'Failed to load planning data');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [task.id, task.plan_summary, t]);

  useEffect(() => {
    if (modal.visible) {
      void loadPlanState();
    }
    return () => {
      resetTimers();
    };
  }, [modal.visible, loadPlanState]);

  const persistAnswer = useCallback(
    async (questionId: string, value: string) => {
      try {
        setSaveStates((prev) => ({ ...prev, [questionId]: 'saving' }));
        const response = await tasksApi.savePlanAnswers(task.id, {
          answers: [{ question_id: questionId, answer: value }],
        });
        setIsComplete(response.is_complete);
        if (response.plan_summary) {
          setPlanSummary(response.plan_summary);
        }
        setSaveStates((prev) => ({ ...prev, [questionId]: 'saved' }));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : t('planDialog.errors.saveFailed', 'Failed to save answer');
        setSaveStates((prev) => ({ ...prev, [questionId]: 'error' }));
        setError(message);
      }
    },
    [task.id, t]
  );

  const scheduleSave = useCallback(
    (questionId: string, value: string) => {
      timersRef.current[questionId] &&
        clearTimeout(timersRef.current[questionId]);
      timersRef.current[questionId] = setTimeout(() => {
        void persistAnswer(questionId, value);
      }, 500);
    },
    [persistAnswer]
  );

  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      setSaveStates((prev) => ({ ...prev, [questionId]: 'saving' }));
      scheduleSave(questionId, value);
    },
    [scheduleSave]
  );

  const allRequiredAnswered = useMemo(() => {
    const required = questions.filter((question) => question.required);
    if (required.length === 0) return Object.keys(answers).length > 0;
    return required.every((question) => (answers[question.id] || '').trim().length);
  }, [questions, answers]);

  const handleStartDevelopment = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await tasksApi.completePlanning(task.id);
      setPlanSummary(response.plan_summary);
      setIsComplete(true);
      modal.resolve(response);
      modal.hide();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t(
              'planDialog.errors.completeFailed',
              'Unable to start development'
            );
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [modal, t, task.id]);

  const closeDialog = () => {
    resetTimers();
    modal.hide();
  };

  const renderHelperText = (questionId: string) => {
    const state = saveStates[questionId];
    if (state === 'saving') {
      return t('planDialog.saving', 'Saving...');
    }
    if (state === 'saved') {
      return t('planDialog.saved', 'Saved');
    }
    if (state === 'error') {
      return t('planDialog.saveError', 'Could not save answer');
    }
    return null;
  };

  return (
    <Dialog open={modal.visible} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            <DialogTitle>
              {t('planDialog.title', { title: task.title ?? 'Task' })}
            </DialogTitle>
            <Badge variant="secondary">
              {isComplete
                ? t('planDialog.status.complete', 'Complete')
                : t('planDialog.status.inProgress', 'In progress')}
            </Badge>
          </div>
          <DialogDescription>
            {t(
              'planDialog.description',
              'AI clarifies the task before any code is written.'
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('planDialog.loading', 'Generating questions...')}
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('planDialog.noQuestions', 'No clarification questions available.')}
          </p>
        ) : (
          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
            {questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor={`plan-${question.id}`} className="font-medium">
                    {question.question}
                  </Label>
                  <Badge variant="outline">{question.category}</Badge>
                  {question.required && (
                    <span className="text-xs text-destructive">
                      {t('planDialog.required', 'Required')}
                    </span>
                  )}
                </div>

                {question.suggestedAnswers ? (
                  <Select
                    value={answers[question.id] || ''}
                    onValueChange={(value) =>
                      handleAnswerChange(question.id, value)
                    }
                  >
                    <SelectTrigger id={`plan-${question.id}`}>
                      <SelectValue
                        placeholder={t(
                          'planDialog.selectPlaceholder',
                          'Select an option'
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {question.suggestedAnswers.map((option: string) => (
                        <SelectItem value={option} key={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    id={`plan-${question.id}`}
                    rows={3}
                    value={answers[question.id] || ''}
                    onChange={(event) =>
                      handleAnswerChange(question.id, event.target.value)
                    }
                    placeholder={t(
                      'planDialog.answerPlaceholder',
                      'Type your answer'
                    )}
                  />
                )}

                {(() => {
                  const helperText = renderHelperText(question.id);
                  if (!helperText) return null;
                  return (
                    <p className="text-xs text-muted-foreground">{helperText}</p>
                  );
                })()}
              </div>
            ))}

            {planSummary && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {t('planDialog.summaryHeading', 'Clarified requirements')}
                </h3>
                <div className="rounded-md border bg-muted/30 p-4">
                  <MarkdownRenderer content={planSummary} />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t(
              'planDialog.requirementsHint',
              'All required answers must be provided before development can start.'
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              {t('common:buttons.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleStartDevelopment}
              disabled={
                isSubmitting || !allRequiredAnswered || isLoading || questions.length === 0
              }
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('planDialog.startDevelopment', 'Start development')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export { PlanTaskDialog };
