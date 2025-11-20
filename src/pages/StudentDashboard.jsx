import React, { useEffect, useState, useContext } from "react";
import "./StudentDashboard.css";
import { BookOpen, ClipboardList, MessageSquare, CalendarDays } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { apiMisTareas, apiListEventos, apiHistorialAsistencia } from "../config/api";

export default function StudentDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [tareas, setTareas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [asistenciaStats, setAsistenciaStats] = useState(null);
  const [mensajesNuevos, setMensajesNuevos] = useState(0); // placeholder si no hay endpoint

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const [misTareas, evs, historial] = await Promise.all([
          apiMisTareas().catch(() => []),
          apiListEventos().catch(() => []),
          apiHistorialAsistencia(user.id).catch(() => null)
        ]);

        setTareas(Array.isArray(misTareas) ? misTareas : []);
        // mostrar eventos relevantes al estudiante: generales o del curso si vienen con curso_id
        setEventos((evs || []).filter(e => e.es_general || !e.curso_id || true).slice(0, 6));
        if (historial && historial.estadisticas) {
          setAsistenciaStats(historial.estadisticas);
        } else {
          // si el endpoint devuelve otra forma, intenta extraer conteos
          setAsistenciaStats(historial || null);
        }

        // Mensajes: si hay endpoint real, reemplazar. Por ahora contar tareas sin entregar como "mensajes"
        const pendientes = (Array.isArray(misTareas) ? misTareas : []).filter(t => !t.entregada).length;
        setMensajesNuevos(pendientes > 0 ? pendientes : 0);
      } catch (e) {
        console.error("StudentDashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) load();
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="loading">Cargando panel...</div>;

  return (
    <div className="student-dashboard-container fade-in">
      <div className="student-dashboard-card">
        <div className="dashboard-header">
          <h2 className="dashboard-title">📚 Panel del Estudiante</h2>
          <p className="dashboard-subtitle">
            Bienvenido(a) {user?.nombre || ""}. Revisa tu rendimiento, tareas y próximas actividades.
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <BookOpen className="icon purple" />
            <div className="info">
              <h3>{(asistenciaStats && asistenciaStats.porcentaje_asistencia) ?? "—"}</h3>
              <p>Porcentaje Asistencia</p>
            </div>
          </div>

          <div className="stat-card">
            <ClipboardList className="icon blue" />
            <div className="info">
              <h3>{tareas.length}</h3>
              <p>Tareas Totales</p>
            </div>
          </div>

          <div className="stat-card">
            <CalendarDays className="icon green" />
            <div className="info">
              <h3>{eventos.length}</h3>
              <p>Eventos Próximos</p>
            </div>
          </div>

          <div className="stat-card">
            <MessageSquare className="icon pink" />
            <div className="info">
              <h3>{mensajesNuevos}</h3>
              <p>Mensajes / Pendientes</p>
            </div>
          </div>
        </div>

        <div className="activities">
          <h3 className="section-title">📚 Tareas recientes</h3>
          {tareas.length === 0 ? (
            <div className="empty">No tienes tareas asignadas.</div>
          ) : (
            tareas.slice(0, 6).map(t => (
              <div key={t.id} className="activity-card">
                <div className="activity-info">
                  <h4>{t.titulo}</h4>
                  <p>{t.descripcion || "Sin descripción"}</p>
                  <span className="time">Vence: {t.fecha_entrega}</span>
                </div>
                <span className={`tag ${t.materia?.nombre ? "blue" : "gray"}`}>{t.materia?.nombre || t.prioridad || "Tarea"}</span>
              </div>
            ))
          )}

          <h3 className="section-title" style={{ marginTop: 18 }}>📅 Próximos eventos</h3>
          {eventos.length === 0 ? (
            <div className="empty">No hay eventos próximos.</div>
          ) : (
            eventos.map(ev => (
              <div key={ev.id} className="activity-card">
                <div className="activity-info">
                  <h4>{ev.titulo}</h4>
                  <p>{ev.descripcion || ""}</p>
                  <span className="time">{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}</span>
                </div>
                <span className={`tag ${ev.tipo === "examen" ? "red" : "green"}`}>{ev.tipo}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}