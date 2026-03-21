import { useNavigate } from "react-router-dom";

const PlayButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/play")}
      className="relative group px-16 py-4 font-display text-2xl font-bold tracking-[0.3em] uppercase
        border-2 border-primary rounded-xl
        bg-primary/10 text-foreground
        neon-box-intense
        transition-all duration-300
        hover:bg-primary/20 hover:tracking-[0.35em]
        active:scale-[0.97]
        animate-pulse-neon"
    >
      Play
      <span className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default PlayButton;
