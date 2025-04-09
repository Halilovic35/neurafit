import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default async function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  if (requireAdmin && session.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
} 