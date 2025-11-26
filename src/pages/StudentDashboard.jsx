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
  const [mensajesNuevos, setMensajesNuevos] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [misTareas, evs, historial] = await Promise.all([
          apiMisTareas().catch(() => []),
          apiListEventos().catch(() => []),
          apiHistorialAsistencia(user.id).catch(() => null)
        ]);

        setTareas(Array.isArray(misTareas) ? misTareas : []);
        // mostrar eventos relevantes: generales o del curso (backend puede incluir curso_id)
        setEventos((evs || []).filter(e => e.es_general || !e.curso_id || true).slice(0, 8));
        if (historial && historial.estadisticas) {
          setAsistenciaStats(historial.estadisticas);
        } else {
          setAsistenciaStats(historial || null);
        }

        // Mensajes: ejemplo -> tareas pendientes
        const pendientes = (Array.isArray(misTareas) ? misTareas : []).filter(t => !t.entregada).length;
        setMensajesNuevos(pendientes);
      } catch (e) {
        console.error("StudentDashboard load error:", e);
        setError(e.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) load();
  }, [user, authLoading]);

  if (authLoading || loading) return <div className="sd-loading">Cargando panel...</div>;

  return (
    <div className="student-dashboard-container">
      <div className="student-dashboard-card">
        <header className="dashboard-header">
          <div>
            <h2 className="dashboard-title">📚 Panel del Estudiante</h2>
            <p className="dashboard-subtitle">Bienvenido(a) {user?.nombre || ""}. Revisa tu rendimiento, tareas y próximas actividades.</p>
          </div>
        </header>

        {error && <div className="sd-error">{error}</div>}

        <section className="stats-grid">
          <article className="stat-card">
            <BookOpen className="icon purple" />
            <div className="info">
              <h3>{(asistenciaStats && asistenciaStats.porcentaje_asistencia) ?? "—"}</h3>
              <p>Porcentaje Asistencia</p>
            </div>
          </article>

          <article className="stat-card">
            <ClipboardList className="icon blue" />
            <div className="info">
              <h3>{tareas.length}</h3>
              <p>Tareas Totales</p>
            </div>
          </article>

          <article className="stat-card">
            <CalendarDays className="icon green" />
            <div className="info">
              <h3>{eventos.length}</h3>
              <p>Eventos Próximos</p>
            </div>
          </article>

          <article className="stat-card">
            <MessageSquare className="icon pink" />
            <div className="info">
              <h3>{mensajesNuevos}</h3>
              <p>Mensajes / Pendientes</p>
            </div>
          </article>
        </section>

        <div className="sd-panels">
          <section className="panel tasks-panel">
            <h3 className="section-title">📚 Tareas recientes</h3>
            {tareas.length === 0 ? (
              <div className="empty">No tienes tareas asignadas.</div>
            ) : (
              <div className="list">
                {tareas.slice(0, 6).map(t => (
                  <div key={t.id} className="activity-card">
                    <div className="activity-info">
                      <h4 className="task-title">{t.titulo}</h4>
                      <p className="task-desc">{t.descripcion || "Sin descripción"}</p>
                      <div className="task-meta">Vence: {t.fecha_entrega} {t.materia?.nombre ? `• ${t.materia.nombre}` : ""}</div>
                    </div>
                    <div className={`tag ${t.prioridad === 'alta' ? 'red' : t.prioridad === 'baja' ? 'gray' : 'blue'}`}>{t.prioridad || 'Tarea'}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="panel events-panel">
            <h3 className="section-title">📅 Próximos eventos</h3>
            {eventos.length === 0 ? (
              <div className="empty">No hay eventos próximos.</div>
            ) : (
              <div className="list">
                {eventos.map(ev => (
                  <div key={ev.id} className="activity-card small">
                    <div className="activity-info">
                      <h4 className="task-title">{ev.titulo}</h4>
                      <div className="task-meta">{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}</div>
                      {ev.descripcion ? <p className="task-desc small">{ev.descripcion}</p> : null}
                    </div>
                    <div className={`tag ${ev.tipo === "examen" ? "red" : "green"}`}>{ev.tipo || 'Evento'}</div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}