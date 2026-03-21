import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Character } from "@/game/types";
import CharacterSelect from "@/components/CharacterSelect";
import GameArena from "@/components/GameArena";

const Play = () => {
  const navigate = useNavigate();
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

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
