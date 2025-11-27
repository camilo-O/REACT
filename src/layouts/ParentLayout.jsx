import "./ParentLayout.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Calendar,
  FileText,
  Users,
  Sparkles,
  MessageSquare,
  LogOut,
  Bell
} from "lucide-react";
import coopeLogo from "../assets/coope.png";
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  apiMe,
  apiListMatriculas,
  apiListComunicaciones,
  apiListEventos
} from "../config/api";

export default function ParentLayout() {
  const { user: ctxUser, logout } = useContext(AuthContext);
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [childrenCount, setChildrenCount] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const menuItems = [
    { name: "Inicio", icon: <Home size={18} />, path: "/parent" },
    { name: "Tareas de mi Hijo", icon: <ClipboardList size={18} />, path: "/parent/tasks" },
    { name: "Horario", icon: <Calendar size={18} />, path: "/parent/schedule" },
    { name: "Excusas Médicas", icon: <FileText size={18} />, path: "/parent/excuses" },
    { name: "Citaciones", icon: <Users size={18} />, path: "/parent/appointments" },
    { name: "Eventos", icon: <Sparkles size={18} />, path: "/parent/events" },
    { name: "Comunicación", icon: <MessageSquare size={18} />, path: "/parent/comms" }
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // validar sesión
        const token = localStorage.getItem("token");
        const rol = localStorage.getItem("rol");
        if (!token || rol !== "padre") {
          logout();
          navigate("/login");
          return;
        }

        // usuario (preferir AuthContext; fallback apiMe)
        let base = ctxUser;
        if (!base) {
          const me = await apiMe().catch(() => null);
          base = me?.user || null;
        }
        setParent(base);

        // hijos desde matrículas (padre sólo ve hijos vinculados)
        const mats = await apiListMatriculas().catch(() => []);
        const hijosSet = new Set();
        (Array.isArray(mats) ? mats : []).forEach(m => {
          if (m.estudiante_id) hijosSet.add(m.estudiante_id);
          else if (m.estudiante?.id) hijosSet.add(m.estudiante.id);
        });
        setChildrenCount(hijosSet.size);

        // comunicaciones recibidas (tipo comunicacion) -> contar
        const comms = await apiListComunicaciones().catch(() => []);
        setUnreadMsgs(Array.isArray(comms) ? comms.length : 0);

        // eventos generales (backend ya filtra) limitar próximos
        const evs = await apiListEventos().catch(() => []);
        setEventsCount(Array.isArray(evs) ? evs.length : 0);
      } catch (e) {
        setError(e.message || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ctxUser, logout, navigate]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function getInitials(u) {
    if (!u) return "CC";
    const partes = [u.nombre, u.apellido1].filter(Boolean);
    return partes.map(p => p[0].toUpperCase()).join("").slice(0, 2);
  }

  function nombreCompleto(u) {
    if (!u) return "";
    return [u.nombre, u.segundo_nombre, u.apellido1, u.apellido2].filter(Boolean).join(" ");
  }

  return (
    <div className="parent-layout">
      <aside className="parent-sidebar">
        <div className="brand">
          <img src={coopeLogo} alt="Escudo Colegio Cooperativo" className="brand-logo" />
          <h1>Colegio Cooperativo</h1>
          <p>Agenda Estudiantil Digital</p>
        </div>

        <nav className="parent-menu">
          {menuItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.icon}
              {item.name}
              {item.path === "/parent/comms" && unreadMsgs > 0 && (
                <span className="badge-pill">{unreadMsgs}</span>
              )}
              {item.path === "/parent/events" && eventsCount > 0 && (
                <span className="badge-pill gray">{eventsCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="logout">
          <button onClick={handleLogout}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="parent-main">
        <header className="parent-header">
          <div className="left">
            <Bell size={18} />
            Panel del Padre
            {childrenCount > 0 && (
              <span className="inline-badge">{childrenCount} hijo(s)</span>
            )}
          </div>

          <div className="profile">
            <div className="avatar">{getInitials(parent)}</div>
            <div className="info">
              <p className="name">
                {loading ? "Cargando..." : nombreCompleto(parent) || "Sin datos"}
              </p>
              <p className="role">Padre de Familia</p>
            </div>
          </div>
        </header>

        {error && <div className="pl-error">{error}</div>}

        <div className="parent-badges">
          <div className="mini-card">
            <strong>{childrenCount}</strong>
            <span>Hijos vinculados</span>
          </div>
          <div className="mini-card">
            <strong>{unreadMsgs}</strong>
            <span>Comunicaciones</span>
          </div>
          <div className="mini-card">
            <strong>{eventsCount}</strong>
            <span>Eventos</span>
          </div>
        </div>

        <div className="parent-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}