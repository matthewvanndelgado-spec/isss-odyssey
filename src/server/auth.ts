import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { authRateLimiter } from "@/lib/rate-limit";

// Validate NEXTAUTH_SECRET at startup - prevent running with placeholder values
const WEAK_SECRETS = [
  "your-secret-key-here",
  "change-me",
  "secret",
  "password",
  "your-secret-key-here-generate-with-openssl-rand-base64-32",
];

if (process.env.NODE_ENV === "production") {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 16 || WEAK_SECRETS.includes(secret)) {
    throw new Error(
      "NEXTAUTH_SECRET is missing or too weak. Generate a secure secret with: openssl rand -base64 32"
    );
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Rate limit login attempts per email to prevent brute-force attacks
        const rateLimitResult = authRateLimiter.check(`login:${credentials.email}`);
        if (!rateLimitResult.allowed) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
  },
};
