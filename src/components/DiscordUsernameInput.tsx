import { useState } from "react";
import { loadProgress, setDiscordUsername } from "@/game/playerProgress";

interface Props {
  onContinue: () => void;
}

const DiscordUsernameInput = ({ onContinue }: Props) => {
  const existing = loadProgress().discordUsername;
  const [username, setUsername] = useState(existing);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter your Discord username");
      return;
    }
    setDiscordUsername(trimmed);
    onContinue();
  };

  // If already has username, skip
  if (existing) {
    onContinue();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 neon-box">
          <span className="text-3xl">🎮</span>
        </div>

        <h2 className="font-display text-2xl font-bold tracking-wider neon-glow mb-2">
          Connect Identity
        </h2>
        <p className="font-body text-sm text-muted-foreground text-center mb-8">
          Enter your Discord username to track your run stats and progression.
        </p>

        {/* Input */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            placeholder="e.g. player#1234"
            className="w-full px-4 py-3 rounded-xl bg-secondary/60 border border-border text-foreground
              font-body text-sm placeholder:text-muted-foreground/50
              focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50
              transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {error && (
            <p className="mt-1.5 text-xs text-destructive font-body">{error}</p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 font-display text-lg font-bold tracking-[0.2em] uppercase
            border-2 border-primary rounded-xl bg-primary/10
            active:scale-[0.97] transition-all duration-200 neon-box"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default DiscordUsernameInput;
