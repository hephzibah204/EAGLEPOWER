'use client';

import React from 'react';
import PortalDashboard from '../../../components/PortalDashboard';

export default function PortalAttendancePage() {
  return <PortalDashboard isModal={false} initialTab="attendance" />;
}
