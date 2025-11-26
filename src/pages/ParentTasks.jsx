/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./ParentTasks.css";
import { AuthContext } from "../context/AuthContext";
import { apiListMatriculas, apiTareasEstudiante } from "../config/api";

export default function ParentTasks() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadChildren() {
      try {
        const mats = await apiListMatriculas().catch(() => []);
        // normalizar hijos desde matriculas
        const map = new Map();
        (Array.isArray(mats) ? mats : []).forEach(m => {
          const est = m.estudiante || (m.estudiante_id ? { id: m.estudiante_id, nombre: m.estudiante_nombre, apellido1: m.estudiante_apellido1 } : null);
          if (est && est.id) {
            const name = `${est.nombre || ''} ${est.apellido1 || ''}`.trim() || `Alumno ${est.id}`;
            if (!map.has(est.id)) map.set(est.id, { id: est.id, nombre: name });
          }
        });
        const kids = Array.from(map.values());
        setChildren(kids);
        if (kids.length === 1) setSelectedChildId(String(kids[0].id));
      } catch (e) {
        console.error("loadChildren:", e);
        setChildren([]);
      }
    }
    if (!authLoading) loadChildren();
  }, [authLoading]);

  useEffect(() => {
    async function loadTasks() {
      if (!selectedChildId) { setTareas([]); return; }
      setLoading(true); setError(null);
      try {
        const res = await apiTareasEstudiante(Number(selectedChildId)).catch(() => []);
        // res puede ser array de tareas; normalizar
        const list = Array.isArray(res) ? res : (res?.tareas || []);
        setTareas(list);
      } catch (e) {
        console.error("loadTasks:", e);
        setError("Error cargando tareas");
        setTareas([]);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [selectedChildId]);

  return (
    <div className="parent-tasks panel-root">
      <header className="pt-header">
        <div>
          <h2>Tareas del Estudiante</h2>
          <p className="muted">Selecciona un hijo para ver sus tareas y estado de entrega.</p>
        </div>
        <div className="pt-controls">
          <select value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
            <option value="">— Selecciona hijo —</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <button className="btn" onClick={() => { if (selectedChildId) setSelectedChildId(selectedChildId); }}>Refrescar</button>
        </div>
      </header>

      {loading ? <div className="empty">Cargando tareas...</div> : null}
      {error && <div className="empty error">{error}</div>}

      {!loading && !selectedChildId ? (
        <div className="empty">Selecciona un hijo para ver sus tareas.</div>
      ) : null}

      {!loading && selectedChildId && (
        <>
          {tareas.length === 0 ? (
            <div className="empty">No hay tareas para este estudiante.</div>
          ) : (
            <div className="tasks-table-wrap">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Asignatura</th>
                    <th>Curso</th>
                    <th>Vence</th>
                    <th>Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {tareas.map(t => (
                    <tr key={t.id}>
                      <td className="title-cell">{t.titulo}</td>
                      <td>{t.materia?.nombre || (t.materia_id ? `ID ${t.materia_id}` : "General")}</td>
                      <td>{t.curso?.nombre || t.curso_id || "—"}</td>
                      <td>{t.fecha_entrega || "—"}</td>
                      <td>
                        {Array.isArray(t.entregas) && t.entregas.length > 0 ? (
                          <span className="status done">Entregada</span>
                        ) : (
                          <span className="status pending">Pendiente</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}