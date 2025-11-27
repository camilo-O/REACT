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
  const [loadingChild, setLoadingChild] = useState(false);
  const [error, setError] = useState(null);

  // Cargar hijos desde matrículas
  useEffect(() => {
    async function loadChildren() {
      setLoading(true);
      setError(null);
      try {
        const mats = await apiListMatriculas().catch(() => []);
        const map = new Map();
        (Array.isArray(mats) ? mats : []).forEach(m => {
          const est = m.estudiante || (m.estudiante_id ? { id: m.estudiante_id, nombre: m.estudiante_nombre, apellido1: m.estudiante_apellido1 } : null);
          if (est && est.id) {
            const nombre = `${est.nombre || ""} ${est.apellido1 || ""}`.trim() || `Alumno ${est.id}`;
            if (!map.has(est.id)) map.set(est.id, { id: est.id, nombre });
          }
        });
        const kids = Array.from(map.values());
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

  // Cargar datos del hijo seleccionado
  useEffect(() => {
    if (!selectedChildId) return;
    let mounted = true;
    async function loadChildData() {
      setLoadingChild(true);
      setError(null);
      try {
        const [tareasRes, hist, evs] = await Promise.all([
          apiTareasEstudiante(Number(selectedChildId)).catch(() => []),
          apiHistorialAsistencia(Number(selectedChildId)).catch(() => null),
          apiListEventos().catch(() => [])
        ]);
        if (!mounted) return;
        const tareasList = Array.isArray(tareasRes) ? tareasRes : (tareasRes?.tareas || []);
        setTareas(tareasList);
        setAsistencia(hist?.estadisticas || hist || null);
        // Previsualizar eventos generales y primeros 6
        setEventos((evs || []).slice(0, 6));
      } catch (e) {
        console.error("loadChildData:", e);
        if (mounted) setError("Error cargando datos del estudiante");
      } finally {
        if (mounted) setLoadingChild(false);
      }
    }
    loadChildData();
    return () => { mounted = false; };
  }, [selectedChildId]);

  // métricas
  const tareasTotales = tareas.length;
  const tareasEntregadas = tareas.filter(t => Array.isArray(t.entregas) && t.entregas.length > 0).length;
  const tareasPendientes = Math.max(0, tareasTotales - tareasEntregadas);
  const asistenciaPct = asistencia ? (Number(asistencia.porcentaje_asistencia) || 0) : null;

  if (authLoading || loading) return <div className="empty">Cargando panel...</div>;

  return (
    <div className="parent-dashboard">
      <h1 className="page-title">Panel del Padre</h1>
      <p className="page-subtitle">Seguimiento de tus hijos</p>

      <div className="pd-controls">
        <label>Seleccionar hijo:</label>
        <select value={selectedChildId || ""} onChange={e => setSelectedChildId(Number(e.target.value))}>
          <option value="">— Selecciona hijo —</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button onClick={() => { if (selectedChildId) setSelectedChildId(selectedChildId); }} className="btn">Refrescar</button>
      </div>

      {error && <div className="empty error">{error}</div>}
      {(!selectedChildId && !loadingChild) && <div className="empty">No se detectaron hijos vinculados a tu cuenta.</div>}

      {selectedChildId && (
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
              {loadingChild ? (
                <div className="empty">Cargando tareas...</div>
              ) : tareas.length === 0 ? (
                <div className="empty">Sin tareas</div>
              ) : (
                <ul>
                  {tareas.slice(0, 6).map(t => (
                    <li key={t.id} className="task-item">
                      <div className="task-left">
                        <strong>{t.titulo}</strong>
                        <div className="muted small">
                          {t.curso?.nombre || `Curso ${t.curso_id || "—"}`} · Vence: {t.fecha_entrega}
                        </div>
                      </div>
                      <div className={`tag ${(Array.isArray(t.entregas) && t.entregas.length > 0) ? "done" : "pending"}`}>
                        {(Array.isArray(t.entregas) && t.entregas.length > 0) ? "Entregada" : "Pendiente"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="panel upcoming">
              <h3>Actividad reciente</h3>
              {loadingChild ? (
                <div className="empty">Cargando actividad...</div>
              ) : eventos.length === 0 ? (
                <div className="empty">Sin actividad</div>
              ) : (
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