import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import coopeLogo from "./assets/coope.png";
import "./App.css";
import { apiLogin } from "./config/api";
import { AuthContext } from "./context/AuthContext";

const ROLE_PATH = {
  estudiante: "/student",
  student: "/student",
  profesor: "/teacher",
  teacher: "/teacher",
  padre: "/parent",
  parent: "/parent",
  admin: "/admin"
};

export default function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);
  const { reload: reloadAuth } = useContext(AuthContext);

  // Redirigir si ya autenticado
  useEffect(() => {
    if (location.pathname !== "/login" && location.pathname !== "/") return;
    if (redirectedRef.current) return;
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    if (token && rol) {
      redirectedRef.current = true;
      navigate(ROLE_PATH[rol] || "/login");
    }
  }, [location.pathname, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Usuario y contraseña son requeridos");
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(username.trim(), password);
      await reloadAuth();
      navigate(ROLE_PATH[data.user.rol] || "/login");
    } catch (e) {
      setError(e.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={coopeLogo} alt="Escudo Colegio Cooperativo" className="login-logo" />
          <h1>Colegio Cooperativo</h1>
          <p>Sistema de Gestión Estudiantil</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            placeholder="Usuario"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading}>{loading ? "Ingresando..." : "Iniciar sesión"}</button>
          {error && <div className="login-feedback error">{error}</div>}
        </form>

        <footer className="login-footer">
          © {new Date().getFullYear()} Colegio Cooperativo Garzón
        </footer>
      </div>
    </div>
  );
}