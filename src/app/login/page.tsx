import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/');
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
