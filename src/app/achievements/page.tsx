import type { Metadata } from "next";
import { AchievementsView } from "@/components/AchievementsView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Conquistas" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  await requireUser();
  return <AchievementsView />;
}
