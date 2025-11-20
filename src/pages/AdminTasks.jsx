import "./AdminCourses.css";
import React, { useEffect, useState } from "react";
import { apiListCursos, apiTareasCurso, apiCrearTarea } from "../config/api";

export default function AdminTasks() {
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [tareas, setTareas] = useState([]);
  const [form, setForm] = useState({ titulo:"", fecha_entrega: "", descripcion:"", prioridad:"media" });
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    apiListCursos().then(setCursos).catch(()=>setCursos([]));
  }, []);

  async function loadTareas() {
    if (!cursoId) return setTareas([]);
    setLoading(true);
    try {
      const data = await apiTareasCurso(cursoId);
      setTareas(data);
    } catch (e) {
      alert(e.message);
    } finally { setLoading(false); }
  }

  async function crear(e) {
    e.preventDefault();
    try {
      await apiCrearTarea({ ...form, curso_id: Number(cursoId) });
      setForm({ titulo:"", fecha_entrega:"", descripcion:"", prioridad:"media" });
      loadTareas();
    } catch (e) { alert(e.message); }
  }

  return (
    <div>
      <h2>Gestionar Tareas</h2>

      <div style={{ marginBottom:12 }}>
        <select value={cursoId} onChange={e=>setCursoId(e.target.value)}>
          <option value="">Selecciona curso</option>
          {cursos.map(c=> <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>
        <button onClick={loadTareas} disabled={!cursoId}>Cargar tareas</button>
      </div>

      <form onSubmit={crear} style={{ marginBottom:12 }}>
        <input required placeholder="Título" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} />
        <input type="date" required value={form.fecha_entrega} onChange={e=>setForm({...form,fecha_entrega:e.target.value})} />
        <select value={form.prioridad} onChange={e=>setForm({...form,prioridad:e.target.value})}>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
        <button type="submit">Crear tarea</button>
      </form>

      {loading ? <div>Cargando...</div> : (
        <ul>
          {tareas.map(t => <li key={t.id}>{t.titulo} — vence {t.fecha_entrega}</li>)}
        </ul>
      )}
    </div>
  );
}