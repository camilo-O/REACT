import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthForm from "./components/AuthForm";
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
  const [mode, setMode] = useState("login");
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);
  const { reload: reloadAuth } = useContext(AuthContext);

  useEffect(() => {
    if (location.pathname !== "/") return; // solo en login
    if (redirectedRef.current) return;
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    if (token && rol) {
      redirectedRef.current = true;
      navigate(ROLE_PATH[rol] || "/");
    }
  }, [location.pathname, navigate]);

  const handleLogin = async (username, password) => {
    try {
      const data = await apiLogin(username, password);
      await reloadAuth();
      navigate(ROLE_PATH[data.user.rol] || "/");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={coopeLogo} alt="Escudo Colegio Cooperativo" className="login-logo" />
          <h1>Colegio Cooperativo</h1>
          <p>Sistema de Gestión Estudiantil</p>
        </div>

        <div className="login-tabs">
          <button onClick={() => setMode("login")} className={mode === "login" ? "active" : ""}>
            Iniciar sesión
          </button>
          <button onClick={() => setMode("register")} className={mode === "register" ? "active" : ""}>
            Registrarse
          </button>
        </div>

<AuthForm
  mode={mode}
  onLogin={handleLogin}
  onSuccess={(rol) => {
    localStorage.setItem("rol", rol);
    navigate(ROLE_PATH[rol] || "/");
  }}
/>

        <footer>
          © {new Date().getFullYear()} Colegio Cooperativo Garzón — Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}