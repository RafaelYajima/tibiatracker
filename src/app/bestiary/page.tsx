import type { Metadata } from "next";
import { BestiaryView } from "@/components/BestiaryView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Bestiário",
};

export const dynamic = "force-dynamic";

export default async function BestiaryPage() {
  await requireUser();
  return <BestiaryView />;
}
