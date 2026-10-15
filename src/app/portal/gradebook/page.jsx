'use client';

import React from 'react';
import PortalDashboard from '../../../components/PortalDashboard';

export default function PortalGradebookPage() {
  return <PortalDashboard isModal={false} initialTab="gradebook" />;
}
