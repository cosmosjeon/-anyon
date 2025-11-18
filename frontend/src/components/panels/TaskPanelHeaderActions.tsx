import { Button } from '../ui/button';
import { X } from 'lucide-react';
import type { TaskWithAttemptStatus } from 'shared/types';
import { ActionsDropdown } from '../ui/ActionsDropdown';
import type { SharedTaskRecord } from '@/hooks/useProjectTasks';
import NiceModal from '@ebay/nice-modal-react';
import { PlanTaskDialog } from '@/components/dialogs/tasks/PlanTaskDialog';
import { useTranslation } from 'react-i18next';

type Task = TaskWithAttemptStatus;

interface TaskPanelHeaderActionsProps {
  task: Task;
  sharedTask?: SharedTaskRecord;
  onClose: () => void;
}

export const TaskPanelHeaderActions = ({
  task,
  sharedTask,
  onClose,
}: TaskPanelHeaderActionsProps) => {
  const { t } = useTranslation('tasks');
  const canPlan = task.status === 'todo' || task.status === 'planning';

  const handlePlanClick = () => {
    NiceModal.show(PlanTaskDialog, { task });
  };

  return (
    <>
      {canPlan && (
        <Button variant="secondary" size="sm" onClick={handlePlanClick}>
          {task.status === 'planning'
            ? t('planDialog.continueButton', 'Continue planning')
            : t('planDialog.planButton', 'Plan')}
        </Button>
      )}
      <ActionsDropdown task={task} sharedTask={sharedTask} />
      <Button variant="icon" aria-label={t('taskHeader.closePanel', 'Close')} onClick={onClose}>
        <X size={16} />
      </Button>
    </>
  );
};
