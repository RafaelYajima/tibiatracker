import type { Metadata } from "next";
import { Dashboard } from "@/components/Dashboard";
import { LandingPage } from "@/components/LandingPage";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "TibiaTracker — Boss Rotation Profit Tracker",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  
  if (user) {
    return <Dashboard />;
  }
  
  return <LandingPage />;
}
