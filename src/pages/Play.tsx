import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Character } from "@/game/types";
import { loadProgress } from "@/game/playerProgress";
import CharacterSelect from "@/components/CharacterSelect";
import GameArena from "@/components/GameArena";
import DiscordUsernameInput from "@/components/DiscordUsernameInput";
import StartRunModal from "@/components/StartRunModal";

const Play = () => {
  const navigate = useNavigate();
  const [hasUsername, setHasUsername] = useState(() => !!loadProgress().discordUsername);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [startLevel, setStartLevel] = useState<number | null>(null);

  if (!hasUsername) {
    return <DiscordUsernameInput onContinue={() => setHasUsername(true)} />;
  }

  if (!selectedChar) {
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
