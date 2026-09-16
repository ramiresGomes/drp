import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { demoLoginEnabled, googleOAuthEnabled } from "@/lib/auth-mode";

const googleEnabled = googleOAuthEnabled();
const demoEnabled = demoLoginEnabled();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
    ...(demoEnabled
      ? [
          Credentials({
            name: "Acesso de demonstração",
            credentials: {
              email: { label: "E-mail", type: "email" },
            },
            async authorize(credentials) {
              const email = String(credentials?.email ?? "")
                .trim()
                .toLowerCase();
              if (!email) return null;
              const person = await prisma.person.findUnique({ where: { email } });
              if (!person || person.status !== "ACTIVE") return null;
              return { id: person.id, email: person.email, name: person.name };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const person = await prisma.person.findUnique({
        where: { email: user.email.toLowerCase() },
      });
      if (!person || person.status !== "ACTIVE") {
        return "/entrar?error=nao-cadastrado";
      }
      user.id = person.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const person = await prisma.person.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (person) {
          token.personId = person.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.personId ?? token.sub ?? "");
      }
      return session;
    },
  },
});
