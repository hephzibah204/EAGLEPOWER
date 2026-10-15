'use client';

import React from 'react';
import PortalDashboard from '../../components/PortalDashboard';

export default function ExecutiveConsolePage() {
  return (
    <PortalDashboard
      isModal={false}
      initialRole="superadmin"
      initialTab="overview"
      isExecutiveConsole={true}
    />
  );
}
