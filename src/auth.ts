import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

declare module 'next-auth' {
  interface Session {
    user: { id: string; name: string; role: string };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Usuario' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? '').trim();
        const password = String(credentials?.password ?? '');
        if (!username || !password) return null;

        const db = getDb();
        const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
        const user = rows[0];
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: String(user.id), name: user.username, email: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = user.email as string;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.role = (token.role as string) ?? 'user';
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  trustHost: true,
});
