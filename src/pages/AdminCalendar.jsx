import React, { useEffect, useState } from "react";
import { apiListEventos, apiCrearEvento, apiEditarEvento, apiEliminarEvento, apiListCursos } from "../config/api";
import "./AdminCourses.css"; // usa estilos de cursos/reports para consistencia

export default function AdminCalendar() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
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
  const [cursos, setCursos] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const ev = await apiListEventos();
      setEventos(ev || []);
      const cs = await apiListCursos().catch(()=>[]);
      setCursos(Array.isArray(cs) ? cs : []);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        fecha: form.fecha,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        tipo: form.tipo,
        es_general: !!form.es_general,
        curso_id: form.es_general ? null : (form.curso_id || null)
      };
      if (editId) {
        await apiEditarEvento(editId, payload);
        alert("Evento actualizado");
      } else {
        await apiCrearEvento(payload);
        alert("Evento creado");
      }
      resetForm();
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  function startEdit(ev) {
    setEditId(ev.id);
    setForm({
      titulo: ev.titulo || "",
      descripcion: ev.descripcion || "",
      fecha: ev.fecha ? ev.fecha.split("T")[0] : new Date().toISOString().slice(0, 10),
      hora_inicio: ev.hora_inicio || "",
      hora_fin: ev.hora_fin || "",
      tipo: ev.tipo || "actividad",
      es_general: !!ev.es_general,
      curso_id: ev.curso_id || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!confirm("Eliminar evento?")) return;
    try {
      await apiEliminarEvento(id);
      alert("Evento eliminado");
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="admin-courses">
      <div className="header">
        <h2>Calendario / Eventos</h2>
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
            <input type="checkbox" checked={form.es_general} onChange={e => setForm({ ...form, es_general: e.target.checked })} />
            Es general
          </label>
          {!form.es_general && (
            <select value={form.curso_id} onChange={e => setForm({ ...form, curso_id: e.target.value })}>
              <option value="">Selecciona curso</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
          <input placeholder="Descripción (opcional)" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ minWidth: 220 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">{editId ? "Actualizar" : "Crear"}</button>
            <button type="button" onClick={resetForm}>Limpiar</button>
          </div>
        </form>
      </section>

      <section className="course-list" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Eventos</h3>
        {loading ? <div>Cargando eventos...</div> : (
          eventos.length === 0 ? <div className="empty">No hay eventos</div> :
            eventos.map(ev => (
              <div key={ev.id} className="course-card">
                <div className="title">
                  <strong>{ev.titulo}</strong>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(ev)}>Editar</button>
                    <button className="danger" onClick={() => handleDelete(ev.id)}>Eliminar</button>
                  </div>
                </div>
                <div className="meta">
                  <div>{ev.fecha} {ev.hora_inicio ? `• ${ev.hora_inicio}` : ""}{ev.hora_fin ? ` - ${ev.hora_fin}` : ""}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{ev.tipo} • {ev.es_general ? "General" : (ev.curso?.nombre || `Curso ${ev.curso_id}`)}</div>
                  {ev.descripcion ? <div style={{ marginTop: 6 }}>{ev.descripcion}</div> : null}
                </div>
              </div>
            ))
        )}
      </section>
    </div>
  );
}