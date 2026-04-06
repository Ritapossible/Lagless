import { Target, Trophy, ShoppingBag, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { isDailyRewardAvailable } from "@/game/dailyMissions";

const navItems = [
  { icon: Target, label: "Missions", path: "/missions", comingSoon: false },
  { icon: Trophy, label: "Leaderboard", path: "/", comingSoon: true },
  { icon: ShoppingBag, label: "Shop", path: "/", comingSoon: true },
  { icon: User, label: "Profile", path: "/profile", comingSoon: false },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [missionRewardReady, setMissionRewardReady] = useState(false);

  useEffect(() => {
    setMissionRewardReady(isDailyRewardAvailable());
    const interval = setInterval(() => setMissionRewardReady(isDailyRewardAvailable()), 5000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-space-dark/90 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path, comingSoon }) => {
          const isActive = location.pathname === path && path !== "/";
          const showDot = label === "Missions" && missionRewardReady;
          return (
            <button
              key={label}
              onClick={() => {
                if (comingSoon) {
                  toast(`${label} — Coming Soon`, { description: "This feature is under development." });
                  return;
                }
                navigate(path);
              }}
              className={`group relative flex flex-col items-center gap-1 px-3 py-1 transition-transform duration-200 active:scale-95`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-primary/70 group-hover:text-primary"}`} />
                {showDot && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-accent border border-background animate-pulse" />
                )}
              </div>
              <span className={`font-display text-[10px] font-medium tracking-wider uppercase transition-colors ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
