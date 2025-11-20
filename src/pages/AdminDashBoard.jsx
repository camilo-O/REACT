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
import "./AdminCourses.css";

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

        // usuarios: ruta admin
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

  if (authLoading || loading) return <div>Cargando panel administrativo...</div>;

  return (
    <div className="admin-dashboard">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2>Panel Administrativo</h2>
          <p style={{ margin: 0, color: "#6b7280" }}>Resumen rápido del sistema</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/admin/users")}>Usuarios</button>
          <button onClick={() => navigate("/admin/courses")}>Cursos</button>
          <button onClick={() => navigate("/admin/subjects")}>Materias</button>
          <button onClick={() => navigate("/admin/tasks")}>Tareas</button>
        </div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
        <div className="course-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{counts.usuarios}</div>
          <div style={{ color: "#6b7280" }}>Usuarios</div>
        </div>

        <div className="course-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{counts.cursos}</div>
          <div style={{ color: "#6b7280" }}>Cursos</div>
        </div>

        <div className="course-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{counts.materias}</div>
          <div style={{ color: "#6b7280" }}>Materias</div>
        </div>

        <div className="course-card" style={{ padding: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{counts.eventos}</div>
          <div style={{ color: "#6b7280" }}>Eventos</div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
        <div className="course-card">
          <h3 style={{ marginTop: 0 }}>Actividad reciente</h3>
          {eventos.length === 0 ? (
            <div className="empty">No hay eventos recientes</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {eventos.map(ev => (
                <li key={ev.id} style={{ padding: 8, borderBottom: "1px solid #eef2f7" }}>
                  <strong>{ev.titulo}</strong>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}</div>
                  {ev.descripcion ? <div style={{ marginTop: 6 }}>{ev.descripcion}</div> : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="course-card">
          <h4 style={{ marginTop: 0 }}>Resumen (hoy)</h4>
          {resumen ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div>Presentes: {resumen.presentes ?? 0}</div>
              <div>Ausentes: {resumen.ausentes ?? 0}</div>
              <div>Tardanzas: {resumen.tardanzas ?? 0}</div>
              <div>Justificados: {resumen.justificados ?? 0}</div>
            </div>
          ) : (
            <div className="empty">Resumen no disponible</div>
          )}
        </div>
      </section>
    </div>
  );
}