import "server-only";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getServerSession } from "next-auth";

const allowed = () =>
  (process.env.DESK_ALLOWED_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export const isAllowedEmail = (email?: string | null) => !!email && allowed().includes(email.toLowerCase());

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: { signIn: "/desk", error: "/desk" },
  callbacks: {
    // Only Vandana's Google account may sign in. Everyone else is turned away here.
    async signIn({ profile, user }) {
      const email = (profile as { email?: string } | undefined)?.email || user?.email;
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified !== false;
      return verified && isAllowedEmail(email);
    },
    async session({ session }) {
      return session;
    },
  },
};

/** Development-only bypass so the desk can be tried without Google credentials. */
export const devBypass = () => process.env.NODE_ENV === "development" && process.env.DESK_DEV_BYPASS === "true";

export async function deskUser(): Promise<{ email: string; name?: string | null; image?: string | null } | null> {
  if (devBypass()) return { email: "dev@localhost", name: "Vandana (dev)" };
  if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") return null; // not configured yet
  const session = await getServerSession(authOptions).catch((e) => {
    console.error("[auth] session check failed", e);
    return null;
  });
  const email = session?.user?.email;
  if (!email || !isAllowedEmail(email)) return null;
  return { email, name: session.user?.name, image: session.user?.image };
}
