import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
} from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
import { useSearch } from '@/contexts/search-context';
import { openTaskForm } from '@/lib/openTaskForm';
import { useProject } from '@/contexts/project-context';
import { useOpenProjectInEditor } from '@/hooks/useOpenProjectInEditor';
import { OpenInIdeButton } from '@/components/ide/OpenInIdeButton';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserSystem } from '@/components/config-provider';

function NavDivider() {
  return (
    <div
      className="mx-2 h-6 w-px bg-border/60"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

export function Navbar() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectId, project } = useProject();
  const { query, setQuery, active, clear, registerInputRef } = useSearch();
  const handleOpenInEditor = useOpenProjectInEditor(project || null);
  const { loginStatus } = useUserSystem();

  const setSearchBarRef = useCallback(
    (node: HTMLInputElement | null) => {
      registerInputRef(node);
    },
    [registerInputRef]
  );
  const { t } = useTranslation(['tasks', 'common']);
  // Navbar is global, but the share tasks toggle only makes sense on the tasks route
  const isTasksRoute = /^\/projects\/[^/]+\/tasks/.test(location.pathname);
  const showSharedTasks = searchParams.get('shared') !== 'off';
  const shouldShowSharedToggle =
    isTasksRoute && active && project?.remote_project_id != null;

  const handleSharedToggle = useCallback(
    (checked: boolean) => {
      const params = new URLSearchParams(searchParams);
      if (checked) {
        params.delete('shared');
      } else {
        params.set('shared', 'off');
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleCreateTask = () => {
    if (projectId) {
      openTaskForm({ projectId });
    }
  };

  const handleOpenInIDE = () => {
    handleOpenInEditor();
  };

  const isOAuthLoggedIn = loginStatus?.status === 'loggedin';

  return (
    <div className="border-b bg-background">
      <div className="w-full px-3">
        <div className="flex items-center h-12 py-2">
          <div className="hidden sm:flex items-center gap-2">
            <SearchBar
              ref={setSearchBarRef}
              className="shrink-0"
              value={query}
              onChange={setQuery}
              disabled={!active}
              onClear={clear}
              project={project || null}
            />
          </div>

          <div className="flex flex-1 items-center justify-end gap-1">
            {isOAuthLoggedIn && shouldShowSharedToggle ? (
              <>
                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Switch
                            checked={showSharedTasks}
                            onCheckedChange={handleSharedToggle}
                            aria-label={t('tasks:filters.sharedToggleAria')}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {t('tasks:filters.sharedToggleTooltip')}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <NavDivider />
              </>
            ) : null}

            {projectId ? (
              <>
                <div className="flex items-center gap-1">
                  <OpenInIdeButton
                    onClick={handleOpenInIDE}
                    className="h-9 w-9"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={handleCreateTask}
                    aria-label="Create new task"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <NavDivider />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
