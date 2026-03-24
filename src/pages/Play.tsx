import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Character } from "@/game/types";
import { loadProgress } from "@/game/playerProgress";
import CharacterSelect from "@/components/CharacterSelect";
import GameArena from "@/components/GameArena";
import DiscordUsernameInput from "@/components/DiscordUsernameInput";

const Play = () => {
  const navigate = useNavigate();
  const [hasUsername, setHasUsername] = useState(() => !!loadProgress().discordUsername);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

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

  return <GameArena character={selectedChar} onExit={() => navigate("/")} />;
};

export default Play;
