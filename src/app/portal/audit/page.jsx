'use client';

import React from 'react';
import PortalDashboard from '../../../components/PortalDashboard';

export default function PortalAuditPage() {
  return <PortalDashboard isModal={false} initialTab="security" />;
}
