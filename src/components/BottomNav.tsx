import { Target, Trophy, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { isDailyRewardAvailable } from "@/game/dailyMissions";

export const navItems = [
  { icon: Target, label: "Missions", path: "/missions" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: User, label: "Profile", path: "/profile" },
];

// Phone navigation; on wider screens the same links sit in the top bar
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [missionRewardReady, setMissionRewardReady] = useState(false);

  useEffect(() => {
    setMissionRewardReady(isDailyRewardAvailable());
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur sm:hidden">
      <div className="grid grid-cols-3">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex h-14 flex-col items-center justify-center gap-1"
            >
              <span className="relative">
                <Icon className={`h-[18px] w-[18px] ${isActive ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />
                {label === "Missions" && missionRewardReady && (
                  <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary" aria-label="Reward ready" />
                )}
              </span>
              <span className={`text-xs ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
