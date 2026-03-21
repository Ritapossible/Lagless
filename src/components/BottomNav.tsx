import { Target, Trophy, ShoppingBag, Users, Wallet } from "lucide-react";

const navItems = [
  { icon: Target, label: "Missions" },
  { icon: Trophy, label: "Leaderboard" },
  { icon: ShoppingBag, label: "Shop" },
  { icon: Users, label: "Characters" },
  { icon: Wallet, label: "Wallet" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-space-dark/90 backdrop-blur-md">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="group flex flex-col items-center gap-1 px-3 py-1 transition-transform duration-200 active:scale-95"
          >
            <Icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors" />
            <span className="font-display text-[10px] font-medium tracking-wider uppercase text-muted-foreground group-hover:text-foreground transition-colors">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
