import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiListCursos,
  apiResumenHoy,
  apiListEventos,
  apiTareasCurso
} from "../config/api";
import { AuthContext } from "../context/AuthContext";
import "./TeacherDashboard.css";

export default function TeacherDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [tareasPreview, setTareasPreview] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAll() {
      if (!user) return;
      setLoading(true);
      try {
        const [allCursos, resumenHoy, evs] = await Promise.all([
          apiListCursos().catch(() => []),
          apiResumenHoy().catch(() => null),
          apiListEventos().catch(() => [])
        ]);

        // Filtrar cursos del profesor (backend incluye campo profesor)
        const myCursos = (allCursos || []).filter(c =>
          (c.profesor && c.profesor.id === user.id) || c.profesor_id === user.id
        );

        setCursos(myCursos);
        setResumen(resumenHoy);
        setEventos(evs || []);

        // cargar tareas del primer curso como preview
        if (myCursos.length > 0) {
          const tareas = await apiTareasCurso(myCursos[0].id).catch(() => []);
          setTareasPreview(tareas.slice(0, 6));
        } else {
          setTareasPreview([]);
        }
      } catch (e) {
        console.error("TeacherDashboard load error:", e);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) loadAll();
  }, [user, authLoading]);

  function goToAttendance(cursoId) {
    navigate("/teacher/attendance", { state: { cursoId } });
  }
  function goToTasks(cursoId) {
    navigate("/teacher/tasks", { state: { cursoId } });
  }
  function goToStudents(cursoId) {
    navigate("/teacher/students", { state: { cursoId } });
  }

  if (authLoading || loading) return <div className="loading">Cargando panel...</div>;

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Panel del Profesor</h2>
          <p className="dashboard-subtitle">Resumen rápido de hoy y accesos rápidos.</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={() => navigate("/teacher/tasks")}>Nueva Tarea</button>
          <button onClick={() => navigate("/teacher/attendance")}>Tomar Asistencia</button>
        </div>
      </div>

      <section className="grid-stats">
        <div className="stat-card">
          <div className="stat-value">{resumen?.presentes ?? "-"}</div>
          <div className="stat-label">Presentes (hoy)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resumen?.ausentes ?? "-"}</div>
          <div className="stat-label">Ausentes (hoy)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resumen?.tardanzas ?? "-"}</div>
          <div className="stat-label">Tardanzas (hoy)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resumen?.justificados ?? "-"}</div>
          <div className="stat-label">Justificados (hoy)</div>
        </div>
      </section>

      <section className="panel-row">
        <div className="panel-col">
          <h3>Mis cursos ({cursos.length})</h3>
          {cursos.length === 0 ? (
            <div className="empty">No tienes cursos asignados.</div>
          ) : (
            <ul className="course-list">
              {cursos.map(c => (
                <li key={c.id} className="course-item">
                  <div>
                    <strong>{c.nombre}</strong>
                    <div className="meta">{c.grado} • Grupo {c.grupo}</div>
                  </div>
                  <div className="controls">
                    <button onClick={() => goToStudents(c.id)}>Estudiantes</button>
                    <button onClick={() => goToTasks(c.id)}>Tareas</button>
                    <button onClick={() => goToAttendance(c.id)}>Asistencia</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-col">
          <h3>Próximos eventos</h3>
          {eventos.length === 0 ? (
            <div className="empty">No hay eventos</div>
          ) : (
            <ul className="event-list">
              {eventos
                .filter(e => e.es_general || cursos.some(c => c.id === e.curso_id))
                .slice(0, 6)
                .map(ev => (
                  <li key={ev.id}>
                    <div className="event-title">{ev.titulo}</div>
                    <div className="meta">{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""} — {ev.es_general ? "General" : `Curso ${ev.curso_id}`}</div>
                  </li>
                ))}
            </ul>
          )}

          <h3 style={{ marginTop: 16 }}>Tareas recientes ({tareasPreview.length})</h3>
          {tareasPreview.length === 0 ? (
            <div className="empty">Sin tareas recientes</div>
          ) : (
            <ul className="task-list">
              {tareasPreview.map(t => (
                <li key={t.id}>
                  <strong>{t.titulo}</strong>
                  <div className="meta">Vence: {t.fecha_entrega} — Curso: {t.Curso?.nombre || t.curso_id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
