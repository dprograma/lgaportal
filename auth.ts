import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

// ─── Extend NextAuth types ─────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
  interface User {
    role?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "CITIZEN",
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "CITIZEN",
          emailVerified: new Date(),
        };
      },
    }),
    Credentials({
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        if (user.isBanned) throw new Error("BANNED");

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        if (!user.emailVerified) throw new Error("UNVERIFIED");

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role as string,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "CITIZEN";
        // OAuth avatars are short URLs and safe to store in the JWT. Citizen-
        // uploaded avatars are stored as data: URIs (often hundreds of KB) —
        // embedding one here would blow past cookie/response-header size
        // limits and break the session itself. Never let one in.
        token.picture = user.image && !user.image.startsWith("data:") ? user.image : undefined;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        if (typeof session.picture === "string" && !session.picture.startsWith("data:")) {
          token.picture = session.picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "linkedin") {
        await db.user.update({
          where: { email: user.email! },
          data: { emailVerified: new Date() },
        }).catch(() => null);
      }
      return true;
    },
  },
});
