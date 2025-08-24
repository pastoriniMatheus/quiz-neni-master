
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout as DashboardLayoutComponent } from '@/components/layout/DashboardLayout';

const DashboardLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <DashboardLayoutComponent>
        <div className="h-full overflow-auto">
          <Outlet />
        </div>
      </DashboardLayoutComponent>
    </div>
  );
};

export default DashboardLayout;
