import Github from "next-auth/providers/github";
import type { DefaultSession, NextAuthConfig } from "next-auth";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string | null;
      accessToken: string;
      username: string | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

export const authConfig: NextAuthConfig = {
  providers: [
    Github({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: { scope: "repo user read:org" },
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, account, profile }) => {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.id = profile.id;
        token.username = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.accessToken = token.accessToken as string;
      session.user.username = token.username as string | null;
      return session;
    },
  },
};
