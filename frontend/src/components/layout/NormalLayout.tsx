import { Outlet } from 'react-router-dom';
import { DevBanner } from '@/components/DevBanner';
import { Sidebar } from '@/components/layout/Sidebar';

export function NormalLayout() {
  return (
    <div className="flex flex-col h-full">
      <DevBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-background">
          <div className="flex-1 min-h-0 overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
