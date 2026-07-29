import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/env";

const googleConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const isGoogleAuthEnabled = googleConfigured;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  // JWT-only: works without Postgres (memory audit store). Account linking in DB is a later step.
  session: { strategy: "jwt" },
  providers: googleConfigured
    ? [
        Google({
          clientId: env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        }),
      ]
    : [],
  pages: {
    signIn: "/",
  },
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.name = profile.name ?? token.name;
        const picture =
          "picture" in profile && typeof profile.picture === "string"
            ? profile.picture
            : undefined;
        if (picture) token.picture = picture;
        if (typeof profile.email === "string") {
          token.email = profile.email;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },
});
