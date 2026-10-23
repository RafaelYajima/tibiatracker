import type { Metadata } from "next";
import { ClanView } from "@/components/ClanView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Clã",
};

export const dynamic = "force-dynamic";

export default async function ClanPage() {
  await requireUser();
  return <ClanView />;
}
