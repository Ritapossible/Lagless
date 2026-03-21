import { useNavigate } from "react-router-dom";
import GameArena from "@/components/GameArena";

const Play = () => {
  const navigate = useNavigate();
  return <GameArena onExit={() => navigate("/")} />;
};

export default Play;
