'use client';

import React from 'react';
import PortalDashboard from '../../../components/PortalDashboard';

export default function PortalInvoicesPage() {
  return <PortalDashboard isModal={false} initialTab="invoices" />;
}
