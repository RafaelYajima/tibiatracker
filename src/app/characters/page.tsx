import type { Metadata } from "next";
import { CharactersView } from "@/components/CharactersView";

export const metadata: Metadata = {
  title: "Personagens",
};

export default function CharactersPage() {
  return <CharactersView />;
}
