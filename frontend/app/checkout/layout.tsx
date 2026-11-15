import type { ReactNode } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute access="signed-in">{children}</ProtectedRoute>;
}
