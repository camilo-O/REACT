/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiTareasMias, apiEntregarTarea, apiMiEntregaDeTarea } from "../config/api";
import "./StudentTasks.css";



export default function StudentTasks() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursoFilter, setCursoFilter] = useState("");
  const [materiaFilter, setMateriaFilter] = useState("");
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4001/api').replace(/\/api\/?$/i, '');

function buildFileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiTareasMias();
      const list = Array.isArray(res) ? res : [];
      setTareas(list);
      // si solo un curso, seleccionarlo automáticamente
      const cursos = [...new Set(list.map(t => (t.curso && t.curso.id) ? t.curso.id : t.curso_id).filter(Boolean))];
      if (cursos.length === 1) setCursoFilter(String(cursos[0]));
    } catch (e) {
      console.error("cargar tareas:", e);
      setError(e.message || "Error cargando tareas");
      setTareas([]);
    } finally {
      setLoading(false);
    }
  }

  async function openDetails(tarea) {
    setShowModal(true);
    setSelectedTask(null); // loader implícito si quieres indicar carga
    try {
      // 1) intentar endpoint mis-entregas
      let entrega = await apiMiEntregaDeTarea(tarea.id);

      // 2) fallback: si la tarea ya vino con entregas incluidas (listarTareas), úsalas
      if (!entrega && Array.isArray(tarea.entregas) && tarea.entregas.length > 0) {
        entrega = tarea.entregas.find(e => Number(e.tarea_id || e.tareaId || e.tarea?.id || e.Tarea?.id) === Number(tarea.id)) || tarea.entregas[0];
      }

      // 3) normalizar rutas a URLs completas para preview/descarga
      if (entrega) {
        entrega.archivo_url = buildFileUrl(entrega.archivo_ruta);
        entrega.imagen_url = buildFileUrl(entrega.imagen_ruta);
      }

      setSelectedTask({ ...tarea, entrega: entrega || null });
    } catch (err) {
      console.error("openDetails error:", err);
      // fallback final: usar entregas de la tarea si existen
      const fallback = (Array.isArray(tarea.entregas) && tarea.entregas[0]) ? tarea.entregas[0] : null;
      if (fallback) {
        fallback.archivo_url = buildFileUrl(fallback.archivo_ruta);
        fallback.imagen_url = buildFileUrl(fallback.imagen_ruta);
      }
      setSelectedTask({ ...tarea, entrega: fallback });
    }
  }



  useEffect(() => {
    if (!authLoading) cargar();
  }, [authLoading]);

  const cursosDisponibles = [...new Map(tareas.map(t => {
    const id = (t.curso && t.curso.id) || t.curso_id || "";
    const nombre = (t.curso && t.curso.nombre) || `Curso ${t.curso_id || ""}`;
    return [id, { id, nombre }];
  })).values()].filter(c => c.id);

  const materiasDisponibles = [...new Map(
    tareas
      .filter(t => !cursoFilter || String((t.curso && t.curso.id) || t.curso_id) === String(cursoFilter))
      .map(t => {
        const m = (t.materia && t.materia.id) ? t.materia : (t.materia_id ? { id: t.materia_id, nombre: `Materia ${t.materia_id}` } : null);
        return m ? [m.id, m] : null;
      })
      .filter(Boolean)
  )].map(([_, v]) => v);

  const tareasFiltradas = tareas
    .filter(t => !cursoFilter || String((t.curso && t.curso.id) || t.curso_id) === String(cursoFilter))
    .filter(t => !materiaFilter || String((t.materia && t.materia.id) || t.materia_id) === String(materiaFilter))
    .sort((a,b) => (a.fecha_entrega || "").localeCompare(b.fecha_entrega || ""));

  function closeModal() { setShowModal(false); setSelectedTask(null); }


  async function entregar(tarea) {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,image/*,application/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve();
        try {
          // opcional: pedir comentario
          const comentario = prompt("Comentario de entrega (opcional)", "") || "";
          await apiEntregarTarea({ tarea_id: tarea.id, comentario }, file);
          alert("Entrega registrada correctamente.");
          await cargar();
        } catch (e) {
          console.error("Error al entregar tarea:", e);
          alert(e.message || "Error subiendo el archivo");
        } finally {
          resolve();
        }
      };
      input.click();
    });
  }

  if (authLoading || loading) return <div className="st-loading">Cargando tareas...</div>;

 

  return (
    <div className="student-tasks page-root">
      <div className="st-header">
        <h2>Mis Tareas</h2>
        <p className="muted">Filtra por curso y materia para ver solo las tareas relevantes.</p>
      </div>

      <div className="st-filters">
        <select value={cursoFilter} onChange={e => { setCursoFilter(e.target.value); setMateriaFilter(""); }}>
          <option value="">— Todos los cursos —</option>
          {cursosDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        <select value={materiaFilter} onChange={e => setMateriaFilter(e.target.value)}>
          <option value="">— Todas las materias —</option>
          {materiasDisponibles.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>

        <button onClick={cargar} className="btn small">Refrescar</button>
      </div>

      {error && <div className="st-error">{error}</div>}

      <div className="st-list">
        {tareasFiltradas.length === 0 ? (
          <div className="empty">No hay tareas para los filtros seleccionados.</div>
        ) : (
          tareasFiltradas.map(t => (
            <article key={t.id} className="st-card">
              <div className="st-left">
                <div className="st-title">{t.titulo}</div>
                <div className="st-meta">{t.curso?.nombre || `Curso ${t.curso_id || "—"}`} • {t.materia?.nombre || (t.materia_id ? `Materia ${t.materia_id}` : "General")}</div>
                <div className="st-desc">{t.descripcion || "Sin descripción"}</div>
                <div className="st-meta small">Vence: {t.fecha_entrega || "—"} • Prioridad: {t.prioridad || "media"}</div>
              
                   {Array.isArray(t.entregas) && t.entregas[0] && (t.entregas[0].nota !== null && t.entregas[0].nota !== undefined) && (
                    <div style={{ marginTop:8 }}>Tu nota: <strong>{t.entregas[0].nota}</strong>{t.entregas[0].comentario_profesor ? ` — ${t.entregas[0].comentario_profesor}` : ''}</div>
                    )}
              
              </div>

              <div className="st-actions">
                <div className={`badge ${t.entregada ? 'done' : 'pending'}`}>{t.entregada ? "Entregada" : "Pendiente"}</div>
                {!t.entregada && <button className="btn" onClick={() => entregar(t)}>Entregar</button>}
                <button className="btn ghost" onClick={() => openDetails(t)}>Detalles</button>
              </div>
            </article>
          ))
        )}
      </div>
           {showModal && selectedTask && (
        <div className="st-modal-overlay" onClick={closeModal}>
          <div className="st-modal" onClick={e => e.stopPropagation()}>
            <div className="st-modal-header">
              <h3>{selectedTask.titulo}</h3>
              <button className="btn ghost" onClick={closeModal}>Cerrar</button>
            </div>
            <div className="st-modal-body">
              <p className="st-desc">{selectedTask.descripcion || "Sin descripción"}</p>
              <div className="st-row"><strong>Curso:</strong> {selectedTask.curso?.nombre || `ID ${selectedTask.curso_id || '—'}`}</div>
              <div className="st-row"><strong>Materia:</strong> {selectedTask.materia?.nombre || (selectedTask.materia_id ? `ID ${selectedTask.materia_id}` : 'General')}</div>
              <div className="st-row"><strong>Vence:</strong> {selectedTask.fecha_entrega || "—"}</div>
              <div className="st-row"><strong>Prioridad:</strong> {selectedTask.prioridad || 'media'}</div>

              <hr />
              <h4>Entrega del estudiante</h4>
              {!selectedTask.entrega ? (
                <div className="empty">No has entregado esta tarea.</div>
              ) : (
                <div className="st-entrega">
                  <div className="st-row"><strong>Fecha entrega:</strong> {selectedTask.entrega.updated_at || selectedTask.entrega.created_at}</div>
                  {selectedTask.entrega.archivo_url && (
                    <div className="st-row">
                      <strong>Archivo:</strong>{" "}
                      <a href={selectedTask.entrega.archivo_url} target="_blank" rel="noreferrer">Descargar / Abrir</a>
                    </div>
                  )}
                  {selectedTask.entrega.imagen_url && (
                    <div className="st-row">
                      <strong>Imagen:</strong>{" "}
                      <a href={selectedTask.entrega.imagen_url} target="_blank" rel="noreferrer">Ver imagen</a>
                    </div>
                  )}
                  <div className="st-row"><strong>Comentario estudiante:</strong> {selectedTask.entrega.comentario || '—'}</div>
                  <div className="st-row"><strong>Nota:</strong> {selectedTask.entrega.nota ?? '—'}</div>
                  {selectedTask.entrega.comentario_profesor && (
                    <div className="st-row"><strong>Comentario profesor:</strong> {selectedTask.entrega.comentario_profesor}</div>
                  )}
                </div>
              )}
            </div>
            <div className="st-modal-footer">
              <button className="btn" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
