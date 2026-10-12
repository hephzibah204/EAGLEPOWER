import React from 'react';
import PortalDashboard from './PortalDashboard';

/**
 * Eagle Power EduCore Portal Modal
 * Delegates directly to the production PortalDashboard (supporting Admin, Teacher, Bursar, Student & Reception ERP).
 */
export default function PortalModal(props) {
  return <PortalDashboard {...props} />;
}
