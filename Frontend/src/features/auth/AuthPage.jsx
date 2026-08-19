import { useState } from "react";
import { ArrowRight, Cloud, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ThemeToggle from "../theme/ThemeToggle";
import { useAuth } from "./AuthContext";

const EMPTY_FORM = { email: "", password: "" };

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/files" replace />;
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(form.email, form.password);
        navigate("/files", { replace: true });
        return;
      }

      await register(form.email, form.password);
      setMessage(
        "Account created. Check your inbox and verify your email before signing in.",
      );
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const title = isLogin ? (
    <>Your files, <span>waiting.</span></>
  ) : (
    <>Start sharing, <span>securely.</span></>
  );

  return (
    <main className="auth-layout">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <header className="auth-header">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Cloud size={22} />
          </span>
          <span>
            Nex<span>Edge</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-topline">
            <span className="live-dot" />
            SECURE EDGE ACCESS
          </div>

          <span className="auth-kicker">
            <i />
            {isLogin ? "WELCOME BACK" : "CREATE YOUR WORKSPACE"}
          </span>

          <h2>{title}</h2>
          <p>
            {isLogin
              ? "Access your private file network."
              : "Create an account with your verified email."}
          </p>

          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <div className="input-wrap">
                <Mail size={18} />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className="input-wrap">
                <LockKeyhole size={18} />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={updateField}
                  placeholder={isLogin ? "Your password" : "At least 6 characters"}
                  minLength={isLogin ? undefined : 6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <div className="form-message error">{error}</div>}
            {message && <div className="form-message success">{message}</div>}

            <button className="primary-button wide" disabled={submitting}>
              {submitting && <span className="spinner small" />}
              {submitting ? "Please wait" : isLogin ? "Sign in" : "Create account"}
              {!submitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            {isLogin ? "New to NexEdge?" : "Already have an account?"}{" "}
            <Link to={isLogin ? "/register" : "/login"}>
              {isLogin ? "Create an account" : "Sign in"}
            </Link>
          </p>
        </div>
      </section>

      <footer className="auth-footer">
        Private by default <span>•</span> Delivered from the edge
      </footer>
    </main>
  );
}
