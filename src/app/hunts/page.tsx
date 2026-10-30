import type { Metadata } from "next";
import { HuntGuideView } from "@/components/HuntGuideView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Guia de Hunts",
};

export const dynamic = "force-dynamic";

export default async function HuntGuidePage() {
  await requireUser();
  return <HuntGuideView />;
}
