import { deskUser } from "@/lib/auth";
import { listAllPosts } from "@/lib/posts";
import { hasDb } from "@/lib/mongo";
import { streak } from "@/lib/desk-api";
import DeskSignIn from "@/components/desk/DeskSignIn";
import Desk from "@/components/desk/Desk";

export const dynamic = "force-dynamic";

export default async function DeskPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await deskUser();
  if (!user) {
    const { error } = await searchParams;
    return <DeskSignIn error={error} configured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.DESK_ALLOWED_EMAIL && process.env.NEXTAUTH_SECRET)} />;
  }
  const [posts, s] = await Promise.all([listAllPosts(), streak()]);
  return <Desk initialPosts={posts} initialStreak={s} user={user} storage={hasDb ? "database" : "memory"} />;
}
