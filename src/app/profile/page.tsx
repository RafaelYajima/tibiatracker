import type { Metadata } from "next";
import { ProfileView } from "@/components/ProfileView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Perfil",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  return <ProfileView user={user} />;
}
