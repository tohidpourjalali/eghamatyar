import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function HostLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute access="host">{children}</ProtectedRoute>;
}
