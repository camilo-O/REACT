/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./AdminTasks.css";
import { AuthContext } from "../context/AuthContext";
import {
  apiListCursos,
  apiTareasCurso,
  apiCrearTarea,
  apiListMaterias
} from "../config/api";

export default function AdminTasks() {
  const { user } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [tareas, setTareas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    fecha_entrega: "",
    descripcion: "",
    prioridad: "media",
    materia_id: ""
  });

  useEffect(() => {
    async function load() {
      try {
        const cs = await apiListCursos();
        setCursos(Array.isArray(cs) ? cs : []);
      } catch (e) {
        console.error("load cursos:", e);
        setCursos([]);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!cursoId) {
      setTareas([]);
      setMaterias([]);
      return;
    }
    loadTareasAndMaterias(cursoId);
  }, [cursoId]);

  async function loadTareasAndMaterias(cId) {
    setLoading(true);
    setError(null);
    try {
      const [ts, ms] = await Promise.all([
        apiTareasCurso(cId).catch(() => []),
        apiListMaterias({ curso_id: cId }).catch(() => [])
      ]);
      setTareas(Array.isArray(ts) ? ts : []);
      setMaterias(Array.isArray(ms) ? ms : []);
    } catch (e) {
      console.error("loadTareasAndMaterias:", e);
      setError("No se pudieron cargar tareas/materias");
      setTareas([]);
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrear(e) {
    e?.preventDefault();
    if (!form.titulo || !form.fecha_entrega || !cursoId) return alert("Título, fecha y curso son obligatorios");
    setSaving(true);
    try {
      await apiCrearTarea({
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        fecha_entrega: form.fecha_entrega,
        prioridad: form.prioridad || "media",
        curso_id: Number(cursoId),
        materia_id: form.materia_id || undefined
      });
      setForm({ titulo: "", fecha_entrega: "", descripcion: "", prioridad: "media", materia_id: "" });
      await loadTareasAndMaterias(cursoId);
    } catch (err) {
      console.error("crear tarea:", err);
      alert(err.message || "Error al crear tarea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-tasks">
      <header className="tasks-header">
        <h2>Gestionar Tareas</h2>
        <p className="muted">Crear y listar tareas por curso. Si no ves cursos, revisa que tu usuario tenga permisos.</p>
      </header>

      <div className="controls">
        <select value={cursoId} onChange={e => setCursoId(e.target.value)}>
          <option value="">Selecciona curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} — {c.grado} {c.grupo}</option>)}
        </select>
        <button onClick={() => cursoId && loadTareasAndMaterias(cursoId)} disabled={!cursoId}>Cargar</button>
      </div>

      <section className="create-panel">
        <form onSubmit={handleCrear} className="create-form">
          <input placeholder="Título" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} required />
          <input type="date" value={form.fecha_entrega} onChange={e => setForm({...form, fecha_entrega: e.target.value})} required />
          <select value={form.materia_id} onChange={e => setForm({...form, materia_id: e.target.value})}>
            <option value="">Materia (opcional)</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select value={form.prioridad} onChange={e => setForm({...form, prioridad: e.target.value})}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
          <input placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
          <div className="form-actions">
            <button type="submit" className="primary" disabled={saving || !cursoId}>{saving ? "Guardando..." : "Crear tarea"}</button>
          </div>
        </form>
        {error && <div className="error">{error}</div>}
      </section>

      <section className="list-panel">
        <h3>Tareas {cursoId ? `— ${tareas.length}` : ""}</h3>
        {loading ? (
          <div className="empty">Cargando tareas...</div>
        ) : tareas.length === 0 ? (
          <div className="empty">No hay tareas para este curso.</div>
        ) : (
          <ul className="tasks-list">
            {tareas.map(t => (
              <li key={t.id} className="task-row">
                <div className="left">
                  <div className="title">{t.titulo}</div>
                  <div className="meta">{t.materia?.nombre || (t.materia_id ? `Materia ${t.materia_id}` : "General")} · Vence: {t.fecha_entrega}</div>
                </div>
                <div className="right">
                  <div className={`prio ${t.prioridad || 'media'}`}>{t.prioridad}</div>
                  <button onClick={() => alert(JSON.stringify(t, null, 2))}>Ver</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}