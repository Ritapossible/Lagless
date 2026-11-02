import { useState, useEffect } from "react";
import { loadProgress, setDiscordUsername } from "@/game/playerProgress";

interface Props {
  onContinue: () => void;
}

const DiscordUsernameInput = ({ onContinue }: Props) => {
  const [existing] = useState(() => loadProgress().discordUsername);
  const [username, setUsername] = useState(existing);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter a name, or play as guest");
      return;
    }
    setDiscordUsername(trimmed);
    onContinue();
  };

  const handleGuest = () => {
    setDiscordUsername("Guest");
    onContinue();
  };

  // If already has username, skip
  useEffect(() => {
    if (existing) onContinue();
  }, [existing, onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-enter">
        <h1 className="text-[28px] font-medium leading-tight">Pick a pilot name</h1>
        <p className="mt-2 text-sm leading-5 text-subtle">
          Shown on your profile. Your Discord name works if you want friends to find you.
        </p>

        <label htmlFor="pilot-name" className="mt-8 block text-sm text-subtle">Pilot name</label>
        <input
          id="pilot-name"
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          placeholder="e.g. rita"
          className="mt-2 h-12 w-full rounded-[10px] border border-border bg-secondary px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

        <button onClick={handleSubmit} className="btn-primary mt-6 w-full">
          Continue
        </button>
        <button onClick={handleGuest} className="btn-quiet mx-auto mt-3 flex">
          Play as guest
        </button>
      </div>
    </div>
  );
};

export default DiscordUsernameInput;
