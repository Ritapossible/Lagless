import { Heart, Plus } from "lucide-react";
import gmumIcon from "@/assets/gmum-character.jpg";

const TopBar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2">
        <img
          src={gmumIcon}
          alt="GMUM"
          className="w-10 h-10 rounded-full border border-primary/50 object-cover"
        />
      </div>

      <h1 className="font-display text-lg font-bold tracking-widest uppercase neon-glow">
        Home
      </h1>

      <div className="flex items-center gap-1 rounded-full border border-primary/40 bg-secondary/60 px-3 py-1 neon-box">
        <Heart className="w-4 h-4 text-neon-magenta fill-neon-magenta" />
        <span className="font-display text-sm font-semibold text-foreground">250</span>
        <Plus className="w-3.5 h-3.5 text-primary" />
      </div>
    </header>
  );
};

export default TopBar;
