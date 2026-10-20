import type { Metadata } from "next";
import { CharactersView } from "@/components/CharactersView";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Personagens",
};

export const dynamic = "force-dynamic";

export default async function CharactersPage() {
  await requireUser();
  return <CharactersView />;
}
