import "./StudentLayout.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  ClipboardList,
  Calendar,
  MessageSquare,
  Sparkles,
  LogOut,
  Bell,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { apiMe } from "../config/api";
import coopeLogo from "../assets/coope.png"; // 🟦 Escudo del colegio

export default function StudentLayout() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/"); // más limpio que window.location
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    apiMe()
      .then(r => setStudent(r.user))
      .catch(handleLogout)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuItems = [
    { name: "Inicio", icon: <Home size={18} />, path: "/student" },
    { name: "Mis Tareas", icon: <ClipboardList size={18} />, path: "/student/tasks" },
    { name: "Mi Horario", icon: <Calendar size={18} />, path: "/student/schedule" },
    { name: "Excusas", icon: <MessageSquare size={18} />, path: "/student/excuses" },
    { name: "Eventos", icon: <Sparkles size={18} />, path: "/student/events" },
    { name: "Mensajes", icon: <MessageSquare size={18} />, path: "/student/messages" },
  ];

  function nombreCompleto(u) {
    if (!u) return "";
    return [u.nombre, u.segundo_nombre, u.apellido1, u.apellido2]
      .filter(Boolean)
      .join(" ");
  }

  function getInitials(u) {
    if (!u) return "CC";
    const partes = [u.nombre, u.apellido1].filter(Boolean);
    return partes.map(p => p[0].toUpperCase()).join("").slice(0, 2);
  }

  return (
    <div className="student-layout">
      <aside className="student-sidebar">
        <div className="brand">
          <img
            src={coopeLogo}
            alt="Escudo Colegio Cooperativo"
            className="brand-logo"
          />
          <h1>Colegio Cooperativo</h1>
          <p>Agenda Estudiantil Digital</p>
        </div>

        <nav className="student-menu">
          {menuItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="logout">
          <button onClick={handleLogout}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="student-main">
        <header className="student-header">
          <div className="left">
            <Bell size={18} />
            Panel del Estudiante
          </div>

            <div className="profile">
              <div className="avatar">{getInitials(student)}</div>
              <div className="info">
                <p className="name">
                  {loading
                    ? "Cargando..."
                    : student
                      ? nombreCompleto(student)
                      : "Sin datos"}
                </p>
                <p className="role">Estudiante</p>
              </div>
            </div>
        </header>

        <div className="student-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


