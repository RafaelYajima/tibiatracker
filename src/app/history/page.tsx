import type { Metadata } from "next";
import { HistoryView } from "@/components/HistoryView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Histórico",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  await requireUser();
  return <HistoryView />;
}
