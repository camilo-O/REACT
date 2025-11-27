import "./TeacherLayout.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  ClipboardList,
  Calendar,
  FileText,
  CheckSquare,
  Megaphone,
  MessageSquare,
  Bell,
  LogOut,
  Sparkles
} from "lucide-react";
import React, { useEffect, useState, useContext } from "react";
import coopeLogo from "../assets/coope.png";
import { AuthContext } from "../context/AuthContext";
import {
  apiMe,
  apiListCursos,
  apiListEventos,
  apiListExcusas
} from "../config/api";

export default function TeacherLayout() {
  const { user: ctxUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cursosCount, setCursosCount] = useState(0);
  const [excusasPendientes, setExcusasPendientes] = useState(0);
  const [eventosCount, setEventosCount] = useState(0);
  const [error, setError] = useState(null);

  const menuItems = [
    { name: "Inicio", icon: <Home size={18} />, path: "/teacher" },
    { name: "Mis Estudiantes", icon: <Users size={18} />, path: "/teacher/students" },
    { name: "Gestionar Tareas", icon: <ClipboardList size={18} />, path: "/teacher/tasks" },
    { name: "Mi Horario", icon: <Calendar size={18} />, path: "/teacher/schedule" },
    { name: "Revisar Excusas", icon: <FileText size={18} />, path: "/teacher/excuses" },
    { name: "Asistencia", icon: <CheckSquare size={18} />, path: "/teacher/attendance" },
    { name: "Enviar Citas", icon: <Megaphone size={18} />, path: "/teacher/appointments" },
    { name: "Comunicación", icon: <MessageSquare size={18} />, path: "/teacher/comms" },
    { name: "Eventos", icon: <Calendar size={18} />, path: "/teacher/events" }
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rol = localStorage.getItem("rol");
        if (rol !== "profesor") {
          logout();
          navigate("/login");
          return;
        }

        let base = ctxUser;
        if (!base) {
          const me = await apiMe().catch(() => null);
          base = me?.user || null;
        }
        setTeacher(base);

        // cursos del profesor
        const cursos = await apiListCursos().catch(() => []);
        const propios = (cursos || []).filter(c =>
          (c.profesor && c.profesor.id === base?.id) || c.profesor_id === base?.id
        );
        setCursosCount(propios.length);

        // excusas pendientes (estado=pendiente dentro de sus cursos)
        let pendientes = 0;
        if (propios.length) {
          const allExc = await apiListExcusas().catch(() => []);
          pendientes = (allExc || []).filter(e =>
            e.estado === "pendiente" &&
            propios.some(c => c.id === e.curso_id)
          ).length;
        }
        setExcusasPendientes(pendientes);

        // eventos (generales + de sus cursos)
        const eventos = await apiListEventos().catch(() => []);
        const visibles = (eventos || []).filter(ev =>
          ev.curso_id == null || propios.some(c => c.id === ev.curso_id)
        );
        setEventosCount(visibles.length);
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
    <div className="teacher-layout">
      <aside className="teacher-sidebar">
        <div className="brand">
          <img src={coopeLogo} alt="Logo Colegio Cooperativo" className="brand-logo" />
          <h1>Colegio Cooperativo</h1>
          <p>Panel Docente</p>
        </div>

        <nav>
          {menuItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.icon}
              {item.name}
              {item.path === "/teacher/excuses" && excusasPendientes > 0 && (
                <span className="badge-pill red">{excusasPendientes}</span>
              )}
              {item.path === "/teacher/events" && eventosCount > 0 && (
                <span className="badge-pill">{eventosCount}</span>
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

      <main className="teacher-main">
        <header className="teacher-header">
          <div className="left">
            <Bell size={18} />
            Panel del Profesor
            {cursosCount > 0 && <span className="inline-badge">{cursosCount} curso(s)</span>}
          </div>

          <div className="profile">
            <div className="avatar">{getInitials(teacher)}</div>
            <div className="info">
              <p className="name">
                {loading ? "Cargando..." : nombreCompleto(teacher) || "Sin datos"}
              </p>
              <p className="role">Profesor</p>
            </div>
          </div>
        </header>

        {error && <div className="tl-error">{error}</div>}

        <div className="teacher-badges">
          <div className="mini-card">
            <strong>{cursosCount}</strong>
            <span>Cursos</span>
          </div>
          <div className="mini-card">
            <strong>{excusasPendientes}</strong>
            <span>Excusas pendientes</span>
          </div>
          <div className="mini-card">
            <strong>{eventosCount}</strong>
            <span>Eventos</span>
          </div>
        </div>

        <div className="teacher-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}