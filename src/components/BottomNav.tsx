import { Target, Trophy, ShoppingBag, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const navItems = [
  { icon: Target, label: "Missions", path: "/", comingSoon: true },
  { icon: Trophy, label: "Leaderboard", path: "/", comingSoon: true },
  { icon: ShoppingBag, label: "Shop", path: "/", comingSoon: true },
  { icon: User, label: "Profile", path: "/profile", comingSoon: false },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-space-dark/90 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, path, comingSoon }) => {
          const isActive = location.pathname === path && path !== "/";
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
              className={`group flex flex-col items-center gap-1 px-3 py-1 transition-transform duration-200 active:scale-95`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-primary/70 group-hover:text-primary"}`} />
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
