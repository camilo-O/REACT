/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./TeacherEvents.css";
import { AuthContext } from "../context/AuthContext";
import { apiCancelarEvento, apiListCursos, apiListEventos, apiCrearEvento, apiEditarEvento, apiEliminarEvento } from "../config/api";

export default function TeacherEvents() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    hora_inicio: "",
    hora_fin: "",
    tipo: "actividad",
    es_general: false
  });
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function loadCursos() {
      try {
        const all = await apiListCursos();
        const mine = (all || []).filter(c => (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id);
        setCursos(mine);
      } catch { setCursos([]); }
    }
    if (!authLoading) loadCursos();
  }, [authLoading, user]);

  useEffect(() => {
    loadEventos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]);

   async function cancelar(ev) {
   if (!confirm(`Cancelar evento "${ev.titulo}"?`)) return;
   try {
     await apiCancelarEvento(ev.id);
     await loadEventos();
     setFeedback({ type:'success', text:'Evento cancelado' });
   } catch (e) {
     setFeedback({ type:'error', text: e.message || 'No se pudo cancelar' });
   }
 }

  async function loadEventos() {
    setLoading(true); setFeedback(null);
    try {
      const list = await apiListEventos(cursoId ? { curso_id: cursoId } : {});
      setEventos(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("loadEventos:", e);
      setEventos([]);
      setFeedback({ type: "error", text: e.message || "Error cargando eventos" });
    } finally {
      setLoading(false);
    }
  }

  async function crear(e) {
    e?.preventDefault();
    if (!form.titulo || !form.fecha) return setFeedback({ type: "error", text: "Título y fecha son obligatorios" });
    setFeedback(null);
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        fecha: form.fecha,
        hora_inicio: form.hora_inicio || null,
        hora_fin: form.hora_fin || null,
        tipo: form.tipo || "actividad",
        es_general: !!form.es_general,
        curso_id: form.es_general ? null : (cursoId ? Number(cursoId) : null)
      };
      // Nota: profesores no pueden crear es_general=true (backend devolverá 403); para ellos exige curso
      await apiCrearEvento(payload);
      setForm({ titulo: "", descripcion: "", fecha: "", hora_inicio: "", hora_fin: "", tipo: "actividad", es_general: false });
      await loadEventos();
      setFeedback({ type: "success", text: "Evento creado" });
    } catch (e) {
      setFeedback({ type: "error", text: e.message || "Error al crear evento" });
    }
  }

  async function eliminar(ev) {
    if (!confirm(`Eliminar evento "${ev.titulo}"?`)) return;
    try {
      await apiEliminarEvento(ev.id);
      await loadEventos();
    } catch (e) {
      setFeedback({ type: "error", text: e.message || "No se pudo eliminar" });
    }
  }

  return (
    <div className="teacher-events page-root">
      <h2 className="title">📅 Eventos del Profesor</h2>
      <p className="subtitle">Crea eventos para tus cursos o consulta los existentes.</p>

      <div className="te-controls">
        <label>Curso</label>
        <select value={cursoId} onChange={e => setCursoId(e.target.value)}>
          <option value="">— Ver generales y mis cursos —</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>
        <button className="btn" onClick={loadEventos}>Refrescar</button>
      </div>

      <form className="te-form" onSubmit={crear}>
        <input placeholder="Título" value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} required />
        <input type="date" value={form.fecha} onChange={e=>setForm({...form, fecha:e.target.value})} required />
        <div className="row">
          <input type="time" value={form.hora_inicio} onChange={e=>setForm({...form, hora_inicio:e.target.value})} />
          <input type="time" value={form.hora_fin} onChange={e=>setForm({...form, hora_fin:e.target.value})} />
          <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})}>
            <option value="actividad">Actividad</option>
            <option value="examen">Examen</option>
            <option value="reunion">Reunión</option>
            <option value="festivo">Festivo</option>
          </select>
        </div>
        <textarea rows={3} placeholder="Descripción (opcional)" value={form.descripcion} onChange={e=>setForm({...form, descripcion:e.target.value})} />
        <div className="row">
          <label className="check">
            <input type="checkbox" checked={form.es_general} onChange={e=>setForm({...form, es_general:e.target.checked})} />
            Evento general (solo admin)
          </label>
        </div>
        <div className="row">
          <button className="btn primary" type="submit">Crear evento</button>
          {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
        </div>
      </form>

      <section className="list-panel">
        <h3>Eventos {loading ? '...' : `(${eventos.length})`}</h3>
        {loading ? (
          <div className="empty">Cargando...</div>
        ) : eventos.length === 0 ? (
          <div className="empty">No hay eventos.</div>
        ) : (
          <table className="events-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Curso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {eventos.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.fecha}</td>
                  <td>{[ev.hora_inicio, ev.hora_fin].filter(Boolean).join(' • ') || '—'}</td>
                  <td>{ev.titulo}</td>
                  <td>{ev.tipo}</td>
                  <td>{ev.curso?.nombre || (ev.curso_id ? `Curso ${ev.curso_id}` : 'General')}</td>
                  <td><button className="btn ghost" onClick={() => eliminar(ev)}>Eliminar</button></td>
                   <button className="btn ghost" onClick={() => cancelar(ev)} disabled={!ev.curso_id || ev.estado === 'cancelado'}>
                     Cancelar
                   </button>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}