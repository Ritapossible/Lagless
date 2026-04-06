import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Character } from "@/game/types";
import { loadProgress } from "@/game/playerProgress";
import CharacterSelect from "@/components/CharacterSelect";
import GameArena from "@/components/GameArena";
import DiscordUsernameInput from "@/components/DiscordUsernameInput";
import StartRunModal from "@/components/StartRunModal";

const Play = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const startTrial = !!(location.state as any)?.startTrial;
  const [hasUsername, setHasUsername] = useState(() => !!loadProgress().discordUsername);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [startLevel, setStartLevel] = useState<number | null>(startTrial ? 40 : null);
  const [isTrial] = useState(startTrial);

  if (!hasUsername) {
    return <DiscordUsernameInput onContinue={() => setHasUsername(true)} />;
  }

  if (!selectedChar) {
    // For trial mode, skip character select — use default
    if (isTrial) {
      return (
        <GameArena
          startLevel={40}
          startAsTrial={true}
          onExit={() => navigate("/")}
          onBack={() => navigate("/missions")}
        />
      );
    }
    return (
      <CharacterSelect
        onSelect={setSelectedChar}
        onBack={() => navigate("/")}
      />
    );
  }

  if (startLevel === null) {
    return (
      <StartRunModal
        onStart={(level) => setStartLevel(level)}
        onBack={() => setSelectedChar(null)}
      />
    );
  }

  return (
    <GameArena
      character={selectedChar}
      startLevel={startLevel}
      onExit={() => navigate("/")}
      onBack={() => setStartLevel(null)}
    />
  );
};

export default Play;
