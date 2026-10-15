'use client';

import React from 'react';
import PortalDashboard from '../../components/PortalDashboard';

export default function PortalRootPage() {
  return <PortalDashboard isModal={false} initialTab="overview" />;
}
