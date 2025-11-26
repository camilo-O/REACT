/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  apiListCursos,
  apiListMaterias,
  apiListEventos,
  apiResumenHoy
} from "../config/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    cursos: 0,
    materias: 0,
    eventos: 0,
    usuarios: 0
  });
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [cursos, materias, evs, resumenHoy] = await Promise.all([
          apiListCursos().catch(() => []),
          apiListMaterias().catch(() => []),
          apiListEventos().catch(() => []),
          apiResumenHoy().catch(() => null)
        ]);

        let usuarios = [];
        try {
          const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";
          const res = await fetch(`${API}/auth/admin/usuarios`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          if (res.ok) usuarios = await res.json();
        } catch (_e) {
          usuarios = [];
        }

        setCounts({
          cursos: Array.isArray(cursos) ? cursos.length : 0,
          materias: Array.isArray(materias) ? materias.length : 0,
          eventos: Array.isArray(evs) ? evs.length : 0,
          usuarios: Array.isArray(usuarios) ? usuarios.length : 0
        });

        setEventos((evs || []).slice(0, 6));
        setResumen(resumenHoy || null);
      } catch (e) {
        console.error("AdminDashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) load();
  }, [authLoading]);

  if (authLoading || loading) return <div className="admin-loading">Cargando panel administrativo...</div>;

  return (
    <div className="admin-dashboard">
      <div className="adm-header">
        <div>
          <h1 className="adm-title">Panel Administrativo</h1>
          <p className="adm-sub">Resumen rápido del sistema</p>
        </div>

        <div className="adm-actions">
          <button className="btn" onClick={() => navigate("/admin/users")}>Usuarios</button>
          <button className="btn ghost" onClick={() => navigate("/admin/courses")}>Cursos</button>
          <button className="btn ghost" onClick={() => navigate("/admin/subjects")}>Materias</button>
          <button className="btn ghost" onClick={() => navigate("/admin/tasks")}>Tareas</button>
        </div>
      </div>

      <section className="stats-row">
        <div className="stat-card">
          <div className="stat-num">{counts.usuarios}</div>
          <div className="stat-label">Usuarios</div>
        </div>

        <div className="stat-card">
          <div className="stat-num">{counts.cursos}</div>
          <div className="stat-label">Cursos</div>
        </div>

        <div className="stat-card">
          <div className="stat-num">{counts.materias}</div>
          <div className="stat-label">Materias</div>
        </div>

        <div className="stat-card">
          <div className="stat-num">{counts.eventos}</div>
          <div className="stat-label">Eventos</div>
        </div>
      </section>

      <section className="main-grid">
        <div className="panel recent">
          <h3>Actividad reciente</h3>
          {eventos.length === 0 ? (
            <div className="empty">No hay eventos recientes</div>
          ) : (
            <ul className="recent-list">
              {eventos.map(ev => (
                <li key={ev.id} className="recent-item">
                  <div className="ri-left">
                    <strong className="ri-title">{ev.titulo}</strong>
                    <div className="ri-meta">{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}</div>
                    {ev.descripcion ? <div className="ri-desc">{ev.descripcion}</div> : null}
                  </div>
                  <div className="ri-badge">{ev.tipo || 'Actividad'}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="panel summary">
          <h4>Resumen (hoy)</h4>
          {resumen ? (
            <div className="summary-grid">
              <div className="item"><span className="strong">{resumen.presentes ?? 0}</span><small>Presentes</small></div>
              <div className="item"><span className="strong">{resumen.ausentes ?? 0}</span><small>Ausentes</small></div>
              <div className="item"><span className="strong">{resumen.tardanzas ?? 0}</span><small>Tardanzas</small></div>
              <div className="item"><span className="strong">{resumen.justificados ?? 0}</span><small>Justificados</small></div>
            </div>
          ) : (
            <div className="empty">Resumen no disponible</div>
          )}
        </aside>
      </section>
    </div>
  );
}