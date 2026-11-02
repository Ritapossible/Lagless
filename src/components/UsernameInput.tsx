import { useState, useEffect } from "react";
import { loadProgress, setUsername } from "@/game/playerProgress";

interface Props {
  onContinue: () => void;
}

const UsernameInput = ({ onContinue }: Props) => {
  const [existing] = useState(() => loadProgress().username);
  const [username, setUsername] = useState(existing);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Enter a username, or play as a guest");
      return;
    }
    setUsername(trimmed);
    onContinue();
  };

  const handleGuest = () => {
    setUsername("Guest");
    onContinue();
  };

  // If already has username, skip
  useEffect(() => {
    if (existing) onContinue();
  }, [existing, onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-enter">
        <h1 className="text-[28px] font-medium leading-tight">Choose a username</h1>
        <p className="mt-2 text-sm leading-5 text-subtle">
          Any name you like, up to 20 characters. You can change it later on your profile, or skip it and play as a guest.
        </p>

        <label htmlFor="username" className="mt-8 block text-sm text-subtle">Username</label>
        <input
          id="username"
          maxLength={20}
          autoComplete="nickname"
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          placeholder="e.g. skyrunner"
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

export default UsernameInput;
