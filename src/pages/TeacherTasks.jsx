import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  apiListCursos,
  apiTareasCurso,
  apiCrearTarea,
  apiEntregasDeTarea,
  apiListMaterias,  apiCalificarEntrega 
} from "../config/api";
import "./TeacherTasks.css";

export default function TeacherTasks() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [tareas, setTareas] = useState([]);
  const [materias, setMaterias] = useState([]);
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
  const [error, setError] = useState(null);

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4001/api").replace(/\/api\/?$/i, "");

  function buildFileUrl(path) {
    if (!path) return null;
    // si ya es URL absoluta
    if (/^https?:\/\//i.test(path)) return path;
    // si path comienza con /uploads o uploads
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE}${p}`;
  }

  async function verEntregas(tarea) {
    setSelectedTarea(tarea);
    setEntregasLoading(true);
    setEntregas([]);
    try {
      const data = await apiEntregasDeTarea(tarea.id);
      // normalizar rutas: convertir a URL absolutas para previsualizar/descarga
      const normalized = (Array.isArray(data) ? data : []).map(en => ({
        ...en,
        archivo_url: buildFileUrl(en.archivo_ruta),
        imagen_url: buildFileUrl(en.imagen_ruta)
      }));
      setEntregas(normalized);
    } catch (e) {
      console.error("verEntregas:", e);
      setEntregas([]);
    } finally {
      setEntregasLoading(false);
    }
  }

  function openPreview(entrega) {
    // preferir imagen, luego pdf, sino abrir en nueva pestaña
    const img = entrega.imagen_url || entrega.archivo_url;
    if (!img) return window.open(entrega.archivo_ruta || entrega.imagen_ruta || "#", "_blank");
    const ext = (img.split(".").pop() || "").toLowerCase();
    if (["png","jpg","jpeg","gif","webp","bmp"].includes(ext)) {
      setPreviewType("image");
      setPreviewUrl(img);
    } else if (ext === "pdf") {
      setPreviewType("pdf");
      setPreviewUrl(img);
    } else {
      // no previewable -> abrir en nueva pestaña
      window.open(img, "_blank");
    }
  }

  function closePreview() {
    setPreviewUrl(null);
    setPreviewType(null);
  }



  useEffect(() => {
    async function load() {
      try {
        const all = await apiListCursos();
        const my = (all || []).filter(
          c => (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id
        );
        setCursos(my);
        if (my.length === 1) setCursoId(String(my[0].id));
      } catch (e) {
        console.error("Error cargando cursos:", e);
        setCursos([]);
      }
    }
    if (!authLoading) load();
  }, [user, authLoading]);

  useEffect(() => {
    async function loadMaterias() {
      if (!cursoId) {
        setMaterias([]);
        return;
      }
      try {
        const ms = await apiListMaterias({ curso_id: cursoId });
        setMaterias(Array.isArray(ms) ? ms : []);
      } catch (e) {
        console.error("Error cargando materias:", e);
        setMaterias([]);
      }
    }
    loadMaterias();
  }, [cursoId]);

  async function loadTareas(cId) {
    if (!cId) return setTareas([]);
    setLoading(true);
    setError(null);
    try {
      const data = await apiTareasCurso(cId);
      setTareas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadTareas:", e);
      setError(e.message || "Error al cargar tareas");
      setTareas([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCrear(e) {
    e.preventDefault();
    if (!form.titulo || !form.fecha_entrega || !cursoId) return alert("Título, fecha y curso obligatorios");
    setError(null);
    try {
      await apiCrearTarea({
        titulo: form.titulo.trim(),
        descripcion: form.descripcion || null,
        fecha_entrega: form.fecha_entrega,
        prioridad: form.prioridad || "media",
        curso_id: Number(cursoId),
        materia_id: form.materia_id || undefined
      });
      setForm({ titulo: "", descripcion: "", fecha_entrega: "", prioridad: "media", materia_id: "" });
      setShowForm(false);
      await loadTareas(cursoId);
    } catch (err) {
      console.error("crear tarea:", err);
      alert(err.message || "Error al crear tarea");
    }
  }


  async function calificar(entrega) {
    const notaRaw = prompt("Ingresa nota (ej. 4.5). Dejar vacío para cancelar", entrega.nota ?? "");
    if (notaRaw === null) return;
    const nota = notaRaw === "" ? null : Number(notaRaw);
    if (nota !== null && (isNaN(nota) || nota < 0)) return alert("Nota inválida");
    const comentario = prompt("Comentario del profesor (opcional)", entrega.comentario_profesor || "") || null;
    try {
      await apiCalificarEntrega(entrega.id, { nota, comentario_profesor: comentario });
      // refrescar la lista de entregas
      if (selectedTarea) await verEntregas(selectedTarea);
      alert("Entrega calificada");
    } catch (e) {
      console.error("calificar:", e);
      alert(e.message || "Error al calificar");
    }
  }

  return (
    <div className="teacher-tasks page-card">
      <div className="tt-header">
        <div>
          <h2>Gestionar Tareas</h2>
          <p className="muted">Crea tareas por curso y revisa entregas de tus estudiantes.</p>
        </div>

        <div className="tt-actions">
          <select value={cursoId} onChange={e => { setCursoId(e.target.value); loadTareas(e.target.value); }}>
            <option value="">Selecciona curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
          </select>
          <button className="btn" onClick={() => cursoId && loadTareas(cursoId)} disabled={!cursoId}>Cargar tareas</button>
          <button className="btn ghost" onClick={() => setShowForm(s => !s)}>{showForm ? "Cancelar" : "Nueva tarea"}</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCrear} className="tt-form">
          <input required placeholder="Título" value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})}/>
          <input type="date" required value={form.fecha_entrega} onChange={e=>setForm({...form,fecha_entrega:e.target.value})}/>
          <select value={form.materia_id} onChange={e=>setForm({...form,materia_id:e.target.value})}>
            <option value="">Materia (opcional)</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <select value={form.prioridad} onChange={e=>setForm({...form,prioridad:e.target.value})}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
          <input placeholder="Descripción (opcional)" value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} />
          <button type="submit" className="btn primary">Crear</button>
        </form>
      )}

      <div className="tt-content">
        <section className="tt-list panel">
          <h3>Tareas {cursoId ? `— ${tareas.length}` : ""}</h3>
          {loading ? <div className="empty">Cargando tareas...</div> : tareas.length === 0 ? <div className="empty">No hay tareas para este curso.</div> : (
            <ul className="tarea-list">
              {tareas.map(t => (
                <li key={t.id} className="tarea-item">
                  <div>
                    <div className="tarea-title">{t.titulo}</div>
                    <div className="tarea-meta">{t.materia?.nombre || (t.materia_id ? `Materia ${t.materia_id}` : "General")} · Vence: {t.fecha_entrega}</div>
                  </div>
                  <div className="tarea-actions">
                    <button onClick={() => verEntregas(t)}>Ver entregas</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && <div className="error">{error}</div>}
        </section>

      <aside className="panel entregas-panel">
        <h4>Entregas {selectedTarea ? `— ${selectedTarea.titulo}` : ""}</h4>
        {entregasLoading ? <div className="empty">Cargando entregas...</div> : (
          entregas.length === 0 ? <div className="empty">No hay entregas para la tarea seleccionada.</div> : (
            <ul className="entregas-list">
              {entregas.map(en => (
                <li key={en.id} className="entrega-item">
                  <div>
                    <strong>{en.estudiante?.nombre ? `${en.estudiante.nombre} ${en.estudiante.apellido1 || ''}` : (en.estudiante_id || 'Estudiante')}</strong>
                    <div className="meta small">{new Date(en.updated_at || en.created_at).toLocaleString()}</div>
                  </div>
                  <div className="entrega-links">
                    {en.archivo_url && <a href={en.archivo_url} target="_blank" rel="noreferrer">Descargar</a>}
                    {en.imagen_url && <a href={en.imagen_url} target="_blank" rel="noreferrer">Imagen</a>}
                    <button className="btn ghost" onClick={() => openPreview(en)}>Previsualizar</button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </aside>

      {entregas.map(en => (
  <li key={en.id} className="entrega-item">
    <div>
      <strong>{en.estudiante?.nombre ? `${en.estudiante.nombre} ${en.estudiante.apellido1 || ''}` : (en.estudiante_id || 'Estudiante')}</strong>
      <div className="meta small">{new Date(en.updated_at || en.created_at).toLocaleString()}</div>
      {en.nota !== null && en.nota !== undefined && (
        <div style={{ marginTop:6 }}>Nota: <strong>{en.nota}</strong>{en.comentario_profesor ? ` — ${en.comentario_profesor}` : ''}</div>
      )}
    </div>
    <div className="entrega-links">
      {en.archivo_url && <a href={en.archivo_url} target="_blank" rel="noreferrer">Descargar</a>}
      {en.imagen_url && <a href={en.imagen_url} target="_blank" rel="noreferrer">Imagen</a>}
      <button className="btn ghost" onClick={() => openPreview(en)}>Previsualizar</button>
      <button className="btn" onClick={() => calificar(en)}>{en.nota ? "Editar nota" : "Calificar"}</button>
    </div>
  </li>
))}

            {previewUrl && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={e => e.stopPropagation()}>
            <button className="preview-close" onClick={closePreview}>Cerrar</button>
            {previewType === "image" && <img src={previewUrl} alt="Preview" style={{ maxWidth:'100%', maxHeight:'80vh' }} />}
            {previewType === "pdf" && <iframe src={previewUrl} title="Preview PDF" style={{ width:'100%', height:'80vh', border:0 }} />}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}