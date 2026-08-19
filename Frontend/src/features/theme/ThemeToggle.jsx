import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function ThemeToggle({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Use light mode" : "Use dark mode";

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "compact" : ""}`}
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={dark}
      title={label}
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {dark ? <Moon size={14} /> : <Sun size={14} />}
        </span>
      </span>
      {!compact && <span>{dark ? "Dark" : "Light"}</span>}
    </button>
  );
}
