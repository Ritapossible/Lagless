import { NavLink } from "react-router-dom";
import { navItems } from "./BottomNav";

// Wordmark plus the same destinations as the mobile bottom bar
const TopBar = () => (
  <header className="relative z-20 flex h-16 items-center justify-between px-6 sm:px-8">
    <NavLink to="/" className="flex items-center gap-2 text-lg font-medium">
      <LogoMark />
      Lagless
    </NavLink>
    <nav className="hidden items-center gap-1 sm:flex">
      {navItems.map(({ label, path }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "text-foreground" : "text-subtle hover:text-foreground"}`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  </header>
);

// Three lanes, one lit: the game in a glyph
export const LogoMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M4 18 L7 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M10 18 V2" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 18 L13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export default TopBar;
