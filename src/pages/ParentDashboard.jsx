/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./ParentDashboard.css";
import { AuthContext } from "../context/AuthContext";
import { apiListMatriculas, apiTareasEstudiante, apiHistorialAsistencia, apiListEventos } from "../config/api";

export default function ParentDashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [asistencia, setAsistencia] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadChildren() {
      setLoading(true);
      try {
        // la ruta /matriculas devolverá las matrículas del/los hijos para rol 'padre'
        const mats = await apiListMatriculas().catch(() => []);
        // normalizar lista de estudiantes desde matriculas
        const kidsMap = new Map();
        (Array.isArray(mats) ? mats : []).forEach(m => {
          const est = m.estudiante || (m.estudiante_id ? { id: m.estudiante_id, nombre: m.estudiante_nombre } : null);
          if (est && est.id) {
            if (!kidsMap.has(est.id)) kidsMap.set(est.id, { id: est.id, nombre: `${est.nombre || ''} ${est.apellido1 || ''}`.trim() || `Alumno ${est.id}` });
          }
        });
        const kids = Array.from(kidsMap.values());
        setChildren(kids);
        if (kids.length > 0) setSelectedChildId(kids[0].id);
      } catch (e) {
        console.error("loadChildren:", e);
        setError("No se pudieron cargar los hijos.");
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) loadChildren();
  }, [authLoading]);

  useEffect(() => {
    if (!selectedChildId) return;
    let mounted = true;
    async function loadChildData() {
      setLoading(true);
      setError(null);
      try {
        const [tareasRes, hist, evs] = await Promise.all([
          apiTareasEstudiante(selectedChildId).catch(() => []),
          apiHistorialAsistencia(selectedChildId).catch(() => null),
          apiListEventos().catch(() => [])
        ]);
        if (!mounted) return;
        setTareas(Array.isArray(tareasRes) ? tareasRes : (tareasRes?.tareas || []));
        setAsistencia(hist?.estadisticas || hist || null);
        // filtrar eventos relevantes (opcional)
        setEventos((evs || []).slice(0,6));
      } catch (e) {
        console.error("loadChildData:", e);
        if (mounted) setError("Error cargando datos del estudiante");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadChildData();
    return () => { mounted = false; };
  }, [selectedChildId]);

  // métricas simples
  const tareasTotales = tareas.length;
  const tareasEntregadas = tareas.filter(t => Array.isArray(t.entregas) && t.entregas.length > 0).length;
  const tareasPendientes = tareasTotales - tareasEntregadas;
  const asistenciaPct = asistencia ? (Number(asistencia.porcentaje_asistencia) || 0) : null;

  return (
    <div className="parent-dashboard">
      <h1 className="page-title">Panel del Padre</h1>
      <p className="page-subtitle">Seguimiento de tus hijos</p>

      <div className="pd-controls">
        <label>Seleccionar hijo:</label>
        <select value={selectedChildId || ""} onChange={e => setSelectedChildId(Number(e.target.value))}>
          <option value="">— Selecciona hijo —</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.nombre || `Alumno ${c.id}`}</option>)}
        </select>
        <button onClick={() => { if (selectedChildId) { setSelectedChildId(selectedChildId); } }} className="btn">Refrescar</button>
      </div>

      {loading ? (
        <div className="empty">Cargando datos...</div>
      ) : error ? (
        <div className="empty error">{error}</div>
      ) : !selectedChildId ? (
        <div className="empty">No se detectaron hijos vinculados a tu cuenta.</div>
      ) : (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <h3>Tareas asignadas</h3>
              <p className="value">{tareasTotales}</p>
              <p className="desc">Asignadas</p>
            </div>
            <div className="summary-card">
              <h3>Completadas</h3>
              <p className="value success">{tareasEntregadas}</p>
              <p className="desc">Entregadas</p>
            </div>
            <div className="summary-card">
              <h3>Pendientes</h3>
              <p className="value warning">{tareasPendientes}</p>
              <p className="desc">Sin entregar</p>
            </div>
            <div className="summary-card">
              <h3>Asistencia</h3>
              <p className="value">{asistenciaPct !== null ? `${asistenciaPct}%` : "—"}</p>
              <p className="desc">Último periodo</p>
            </div>
          </div>

          <div className="panels">
            <section className="panel recent-tasks">
              <h3>Tareas recientes</h3>
              {tareas.length === 0 ? <div className="empty">Sin tareas</div> : (
                <ul>
                  {tareas.slice(0,6).map(t => (
                    <li key={t.id} className="task-item">
                      <div className="task-left">
                        <strong>{t.titulo}</strong>
                        <div className="muted small">{t.curso?.nombre || `Curso ${t.curso_id || "—"}` } · Vence: {t.fecha_entrega}</div>
                      </div>
                      <div className={`tag ${ (Array.isArray(t.entregas) && t.entregas.length>0) ? 'done':'pending' }`}>
                        {(Array.isArray(t.entregas) && t.entregas.length>0) ? 'Entregada' : 'Pendiente'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="panel upcoming">
              <h3>Actividad reciente</h3>
              {eventos.length === 0 ? <div className="empty">Sin actividad</div> : (
                <div className="events-list">
                  {eventos.map(ev => (
                    <div key={ev.id} className="event">
                      <div className="ev-title">{ev.titulo}</div>
                      <div className="muted small">{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}