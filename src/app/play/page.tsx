import type { Metadata } from "next";
import { GameProvider } from "@/components/game/GameProvider";
import { PlayScreen } from "@/components/game/PlayScreen";

export const metadata: Metadata = {
  title: "Play",
  description: "Tap the spark and build your universe.",
};

export default function PlayPage() {
  return (
    <GameProvider>
      <PlayScreen />
    </GameProvider>
  );
}
