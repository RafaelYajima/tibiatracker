import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();
  return <Dashboard />;
}
