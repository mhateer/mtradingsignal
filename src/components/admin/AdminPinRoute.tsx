import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminPinGate from '../../pages/admin/AdminPinGate';
import { useAdminPinAuth } from '../../pages/admin/AdminPinGate';

export default function AdminPinRoute({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(useAdminPinAuth());

  if (!verified) {
    return <AdminPinGate onVerified={() => setVerified(true)} />;
  }

  return <>{children}</>;
}