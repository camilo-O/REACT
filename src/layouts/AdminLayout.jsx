import "./AdminLayout.css";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  ClipboardList,
  Calendar,
  FileBarChart,
  Settings,
  Bell,
  LogOut,
  GraduationCap,
  ShieldCheck,
  BookOpen
} from "lucide-react";
import React, { useEffect,useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import coopeLogo from "../assets/coope.png";

export default function AdminLayout() {
  const { user: admin, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    if (!token || rol !== "admin") {
      navigate("/login");
    }
  }, [navigate]);


  const menuItems = [
    { name: "Inicio", icon: <Home size={18} />, path: "/admin" },
    { name: "Usuarios", icon: <Users size={18} />, path: "/admin/users" },
    { name: "Cursos", icon: <GraduationCap size={18} />, path: "/admin/courses" },
    { name: "Materias", icon: <BookOpen size={18} />, path: "/admin/subjects" },
    { name: "Tareas", icon: <ClipboardList size={18} />, path: "/admin/tasks" },
    { name: "Reportes", icon: <FileBarChart size={18} />, path: "/admin/reports" },
    { name: "Calendario", icon: <Calendar size={18} />, path: "/admin/calendar" },
    { name: "Horarios", icon: <Calendar size={18} />, path: "/admin/schedules" },
    { name: "Seguridad", icon: <ShieldCheck size={18} />, path: "/admin/security" },
    { name: "Configuración", icon: <Settings size={18} />, path: "/admin/settings" },
  ];

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
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">
          <img src={coopeLogo} alt="Logo Colegio Cooperativo" className="brand-logo" />
          <h1>Colegio Cooperativo</h1>
          <p>Panel Administrativo</p>
        </div>
        <nav className="admin-menu">
          {menuItems.map(item => (
            <NavLink key={item.name} to={item.path} className={({ isActive }) => (isActive ? "active" : "")}>
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

      <main className="admin-main">
        <header className="admin-header">
          <div className="left">
            <Bell size={18} /> Panel Admin
          </div>
          <div className="profile">
            <div className="avatar">{getInitials(admin)}</div>
            <div className="info">
              <p className="name">
                {loading ? "Cargando..." : admin ? nombreCompleto(admin) : "Sin datos"}
              </p>
              <p className="role">Administrador</p>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}