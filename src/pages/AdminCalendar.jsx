import React, { useEffect, useState } from "react";
import { apiListEventos, apiCrearEvento, apiEditarEvento, apiEliminarEvento, apiListCursos } from "../config/api";
import "./AdminCourses.css"; // estilos existentes

export default function AdminCalendar() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [editId, setEditId] = useState(null);

  const [cursos, setCursos] = useState([]);
  const [cursoFiltro, setCursoFiltro] = useState(""); // ver generales y/o curso específico
  const [tipoFiltro, setTipoFiltro] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha: new Date().toISOString().slice(0, 10),
    hora_inicio: "",
    hora_fin: "",
    tipo: "actividad",
    es_general: true,
    curso_id: ""
  });

  async function load() {
    setLoading(true);
    setFeedback(null);
    try {
      const params = {};
      if (cursoFiltro !== "") params.curso_id = cursoFiltro; // vacío => backend devuelve generales+todos según rol admin
      if (tipoFiltro) params.tipo = tipoFiltro;
      const ev = await apiListEventos(params);
      setEventos(Array.isArray(ev) ? ev : []);
      const cs = await apiListCursos().catch(() => []);
      setCursos(Array.isArray(cs) ? cs : []);
    } catch (e) {
      setFeedback({ type: "error", text: e.message || "Error cargando eventos" });
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-line */ }, []);
  useEffect(() => { load(); /* eslint-disable-line */ }, [cursoFiltro, tipoFiltro]);

  function resetForm() {
    setEditId(null);
    setForm({
      titulo: "",
      descripcion: "",
      fecha: new Date().toISOString().slice(0, 10),
      hora_inicio: "",
      hora_fin: "",
      tipo: "actividad",
      es_general: true,
      curso_id: ""
    });
    setFeedback(null);
  }

   async function handleCancel(ev) {
   if (!confirm(`Cancelar evento "${ev.titulo}"?`)) return;
   try {
     await apiCancelarEvento(ev.id);
     await load();
     setFeedback({ type:'success', text:'Evento cancelado' });
  } catch (e) {
     setFeedback({ type:'error', text: e.message || 'No se pudo cancelar' });
   }
 }

  async function handleSubmit(e) {
    e?.preventDefault();
    setFeedback(null);
    if (!form.titulo || !form.fecha) return setFeedback({ type: "error", text: "Título y fecha son obligatorios" });

    // Si es_general = true, enviar curso_id = null
    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      tipo: form.tipo || "actividad",
      es_general: !!form.es_general,
      curso_id: form.es_general ? null : (form.curso_id ? Number(form.curso_id) : null)
    };

    try {
      if (editId) {
        await apiEditarEvento(editId, payload);
        setFeedback({ type: "success", text: "Evento actualizado" });
      } else {
        await apiCrearEvento(payload);
        setFeedback({ type: "success", text: "Evento creado" });
      }
      resetForm();
      await load();
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Error guardando evento" });
    }
  }

  function startEdit(ev) {
    setEditId(ev.id);
    setForm({
      titulo: ev.titulo || "",
      descripcion: ev.descripcion || "",
      fecha: ev.fecha ? String(ev.fecha).slice(0, 10) : new Date().toISOString().slice(0, 10),
      hora_inicio: ev.hora_inicio || "",
      hora_fin: ev.hora_fin || "",
      tipo: ev.tipo || "actividad",
      es_general: !!ev.es_general || ev.curso_id === null,
      curso_id: ev.curso_id || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!confirm("Eliminar evento?")) return;
    setFeedback(null);
    try {
      await apiEliminarEvento(id);
      setFeedback({ type: "success", text: "Evento eliminado" });
      load();
    } catch (e) {
      setFeedback({ type: "error", text: e.message || "No se pudo eliminar" });
    }
  }

  return (
    <div className="admin-courses">
      <div className="header">
        <h2>Calendario / Eventos (Admin)</h2>
      </div>

      <section className="course-form">
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
          <input required placeholder="Título" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} />
          <input type="date" required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
          <input type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} />
          <input type="time" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })} />
          <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
            <option value="actividad">Actividad</option>
            <option value="examen">Examen</option>
            <option value="reunion">Reunión</option>
            <option value="festivo">Festivo</option>
          </select>

          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.es_general}
              onChange={e => {
                const val = e.target.checked;
                setForm({ ...form, es_general: val, curso_id: val ? "" : form.curso_id });
              }}
            />
            Evento general (visible a todos)
          </label>

          {!form.es_general && (
            <select value={form.curso_id} onChange={e => setForm({ ...form, curso_id: e.target.value })} required>
              <option value="">Selecciona curso</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
            </select>
          )}

          <input placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ minWidth: 220 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">{editId ? "Actualizar" : "Crear"}</button>
            <button type="button" onClick={resetForm}>Limpiar</button>
          </div>
        </form>
        {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
      </section>

      {/* Filtros de listado */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <select value={cursoFiltro} onChange={e => setCursoFiltro(e.target.value)}>
          <option value="">Ver generales y todos</option>
          <option value="null">Solo generales</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="actividad">Actividad</option>
          <option value="examen">Examen</option>
          <option value="reunion">Reunión</option>
          <option value="festivo">Festivo</option>
        </select>
        <button onClick={load}>Refrescar</button>
      </div>

      <section className="course-list" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Eventos</h3>
        {loading ? <div>Cargando eventos...</div> : (
          eventos.length === 0 ? <div className="empty">No hay eventos</div> :
            eventos.map(ev => (
              <div key={ev.id} className="course-card">
                <div className="title">
                  <strong>{ev.titulo}</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                   {ev.estado === 'cancelado' && <span className="tag danger">Cancelado</span>}
                    <button onClick={() => startEdit(ev)} disabled={ev.estado === 'cancelado'}>Editar</button>
                   <button onClick={() => handleCancel(ev)} className="danger" disabled={ev.estado === 'cancelado'}>Cancelar</button>
                    <button className="danger" onClick={() => handleDelete(ev.id)}>Eliminar</button>
                  </div>
                </div>
                <div className="meta">
                  <div>{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}{ev.hora_fin ? ` - ${ev.hora_fin}` : ""}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>
                    {ev.tipo} • {ev.es_general ? "General" : (ev.curso?.nombre || `Curso ${ev.curso_id || "—"}`)}
                  </div>
                  {ev.descripcion ? <div style={{ marginTop: 6 }}>{ev.descripcion}</div> : null}
                </div>
              </div>
            ))
        )}
      </section>
    </div>
  );
}