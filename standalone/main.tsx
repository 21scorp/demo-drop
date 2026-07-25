import { createRoot } from "react-dom/client";
import { GameProvider } from "@/components/game/GameProvider";
import { PlayScreen } from "@/components/game/PlayScreen";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <GameProvider>
      <PlayScreen />
    </GameProvider>,
  );
}
