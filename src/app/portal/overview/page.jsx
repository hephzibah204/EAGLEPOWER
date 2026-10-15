'use client';

import React from 'react';
import PortalDashboard from '../../../components/PortalDashboard';

export default function PortalOverviewPage() {
  return <PortalDashboard isModal={false} initialTab="overview" />;
}
