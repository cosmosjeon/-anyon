import { Link, useLocation } from 'react-router-dom';
import { FolderOpen, Settings, LogOut, LogIn, FileText, Code, Building2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/project-context';
import { useTranslation } from 'react-i18next';
import NiceModal from '@ebay/nice-modal-react';
import { OAuthDialog } from '@/components/dialogs';
import { useUserSystem } from '@/components/config-provider';
import { oauthApi } from '@/lib/api';

const PROJECT_TABS = [
  { label: 'sidebar.tabs.documents', icon: FileText, to: '/docs' },
  { label: 'sidebar.tabs.development', icon: Code, to: '/tasks' },
];

export function Sidebar() {
  const location = useLocation();
  const isProjectsActive = location.pathname.startsWith('/projects') || location.pathname === '/';
  const { projectId } = useProject();
  const { t } = useTranslation(['common']);
  const { loginStatus, reloadSystem } = useUserSystem();

  // Check if we're inside a project (e.g., /projects/:projectId/tasks)
  const isInsideProject = projectId && location.pathname.includes(`/projects/${projectId}`);

  const handleOpenOAuth = async () => {
    const profile = await NiceModal.show(OAuthDialog);
    if (profile) {
      await reloadSystem();
    }
  };

  const handleOAuthLogout = async () => {
    try {
      await oauthApi.logout();
      await reloadSystem();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const isOAuthLoggedIn = loginStatus?.status === 'loggedin';

  return (
    <div className="w-64 h-full bg-muted/30 border-r border-border shadow-lg flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <Link to="/projects" className="flex items-center gap-2">
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {isInsideProject ? (
          // Show project tabs when inside a project
          <div className="space-y-1">
            {PROJECT_TABS.map((tab) => {
              const Icon = tab.icon;
              const fullPath = `/projects/${projectId}${tab.to}`;
              const isActive = location.pathname.includes(tab.to);

              return (
                <Link
                  key={tab.to}
                  to={fullPath}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{t(tab.label)}</span>
                </Link>
              );
            })}

            {/* Settings Link */}
            <Link
              to={`/settings/projects?projectId=${projectId}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname.startsWith('/settings')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">{t('common:settings')}</span>
            </Link>
          </div>
        ) : (
          // Show projects link when not inside a project
          <div className="space-y-1">
            <Link
              to="/projects"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isProjectsActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <FolderOpen className="h-5 w-5" />
              <span className="font-medium">{t('sidebar.projects')}</span>
            </Link>

            {/* Organizations Link */}
            <Link
              to="/organizations"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/organizations'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="font-medium">{t('sidebar.organizations')}</span>
            </Link>

            {/* Settings Link */}
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname.startsWith('/settings')
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">{t('common:settings')}</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Login Status */}
      <div className="p-4 border-t border-border">
        {isOAuthLoggedIn ? (
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
            <div className="flex-1 truncate">
              {loginStatus?.profile?.email || loginStatus?.profile?.login || '로그인됨'}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOAuthLogout}
              className="h-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleOpenOAuth}
          >
            <LogIn className="mr-2 h-4 w-4" />
            로그인하기
          </Button>
        )}
      </div>
    </div>
  );
}
