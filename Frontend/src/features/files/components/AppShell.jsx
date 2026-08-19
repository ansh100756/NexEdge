import { Cloud, Files, LogOut, RadioTower, Share2 } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import ThemeToggle from "../../theme/ThemeToggle";

const navigation = [
  { label: "My files", view: "owned", icon: Files },
  { label: "Shared", view: "shared", icon: Share2 },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = new URLSearchParams(location.search).get("view") || "owned";

  function isActive(view) {
    return location.pathname === "/files" && currentView === view;
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function renderLinks(iconSize) {
    return navigation.map(({ label, view, icon: Icon }) => (
      <Link
        className={isActive(view) ? "active" : ""}
        key={view}
        to={`/files?view=${view}`}
      >
        <Icon size={iconSize} />
        <span>{label}</span>
      </Link>
    ));
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="topbar">
        <Link className="brand" to="/files">
          <span className="brand-mark">
            <Cloud size={22} />
          </span>
          <span>
            Nex<span>Edge</span>
            <small>Private delivery</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="File navigation">
          {renderLinks(19)}
        </nav>

        <div className="topbar-actions">
          <span className="edge-pill">
            <span className="live-dot" />
            <RadioTower size={16} />
            3 edges online
          </span>

          <div className="profile-pill">
            <span className="avatar">{user?.email?.[0]?.toUpperCase()}</span>
            <span>{user?.email}</span>
          </div>

          <ThemeToggle />

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={17} />
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="mobile-nav" aria-label="Mobile file navigation">
        {renderLinks(20)}
        <ThemeToggle compact />
        <button onClick={handleLogout}>
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </nav>
    </div>
  );
}
