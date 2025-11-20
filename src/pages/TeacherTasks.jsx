import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  apiListCursos,
  apiTareasCurso,
  apiCrearTarea,
  apiEntregasDeTarea
} from "../config/api";
import "./TeacherTasks.css";

export default function TeacherTasks() {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha_entrega: "",
    prioridad: "media",
    materia_id: ""
  });

  const [selectedTarea, setSelectedTarea] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [entregasLoading, setEntregasLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const all = await apiListCursos();
        const my = (all || []).filter(c =>
          (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id
        );
        setCursos(my);
      } catch (e) {
        console.error(e);
        setCursos([]);
      }
    }
    if (!authLoading) load();
  }, [user, authLoading]);

  async function loadTareas(cId) {
    if (!cId) return setTareas([]);
    setLoading(true);
    try {
      const data = await apiTareasCurso(cId);
      setTareas(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrear(e) {
    e.preventDefault();
    if (!form.titulo || !form.fecha_entrega || !cursoId) return alert("Título, fecha y curso obligatorios");
    try {
      await apiCrearTarea({ ...form, curso_id: Number(cursoId) });
      setForm({ titulo: "", descripcion: "", fecha_entrega: "", prioridad: "media", materia_id: "" });
      setShowForm(false);
      loadTareas(cursoId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function verEntregas(tarea) {
    setSelectedTarea(tarea);
    setEntregasLoading(true);
    try {
      const res = await apiEntregasDeTarea(tarea.id);
      // backend devuelve { tarea_id, entregas }
      setEntregas(res.entregas || res);
    } catch (e) {
      alert(e.message);
      setEntregas([]);
    } finally {
      setEntregasLoading(false);
    }
  }

  return (
    <div className="teacher-tasks">
      <h2>Gestionar Tareas</h2>

      <div style={{ marginBottom: 12 }}>
        <select value={cursoId} onChange={e => { setCursoId(e.target.value); loadTareas(e.target.value); }}>
          <option value="">Selecciona curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>
        <button onClick={() => loadTareas(cursoId)} disabled={!cursoId}>Cargar tareas</button>
        <button onClick={() => setShowForm(s => !s)} style={{ marginLeft: 8 }}>{showForm ? "Cancelar" : "Nueva tarea"}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCrear} style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input required placeholder="Título" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}/>
          <input type="date" required value={form.fecha_entrega} onChange={e=>setForm({...form,fecha_entrega:e.target.value})}/>
          <select value={form.prioridad} onChange={e=>setForm({...form,prioridad:e.target.value})}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
          <input placeholder="Materia (id opcional)" value={form.materia_id} onChange={e=>setForm({...form,materia_id:e.target.value})}/>
          <input placeholder="Descripción (opcional)" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} style={{ minWidth: 220 }}/>
          <button type="submit">Crear</button>
        </form>
      )}

      {loading ? <div>Cargando...</div> : (
        <ul>
          {tareas.length === 0 ? <li>No hay tareas</li> :
            tareas.map(t => (
              <li key={t.id} style={{ marginBottom: 8 }}>
                <strong>{t.titulo}</strong> — vence: {t.fecha_entrega} — prioridad: {t.prioridad}
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => verEntregas(t)}>Ver entregas</button>
                  {/* opcional: editar/eliminar si implementas endpoints */}
                </div>
              </li>
            ))
          }
        </ul>
      )}

      {selectedTarea && (
        <section style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 12 }}>
          <h3>Entregas — {selectedTarea.titulo}</h3>
          {entregasLoading ? <div>Cargando entregas...</div> : (
            entregas.length === 0 ? <div>No hay entregas</div> :
            <ul>
              {entregas.map(en => (
                <li key={en.id} style={{ marginBottom: 8 }}>
                  <div><strong>{en.estudiante?.nombre || en.estudiante_id}</strong> — {new Date(en.updated_at || en.created_at).toLocaleString()}</div>
                  <div>
                    {en.archivo_ruta && <a href={en.archivo_ruta} target="_blank" rel="noreferrer">Descargar archivo</a>}
                    {en.imagen_ruta && <span style={{ marginLeft: 8 }}><a href={en.imagen_ruta} target="_blank" rel="noreferrer">Ver imagen</a></span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}