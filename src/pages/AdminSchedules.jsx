/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { apiListProfesores, apiListCursos, apiListMaterias, apiListHorarioProfesor, apiCrearHorario, apiEditarHorario, apiEliminarHorario } from "../config/api";
import "./AdminSchedules.css";

export default function AdminSchedules() {
  const [profesores, setProfesores] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesorId, setProfesorId] = useState("");
  const [horario, setHorario] = useState([]);
  const [form, setForm] = useState({ profesor_id: "", curso_id: "", materia_id: "", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:30", aula: "" });

  useEffect(() => {
    async function load() {
      setProfesores(await apiListProfesores().catch(()=>[]));
      setCursos(await apiListCursos().catch(()=>[]));
      setMaterias(await apiListMaterias().catch(()=>[]));
    }
    load();
  }, []);

  async function loadHorario(pid) {
    if (!pid) { setHorario([]); return; }
    const rows = await apiListHorarioProfesor(pid).catch(()=>[]);
    setHorario(Array.isArray(rows)? rows : []);
  }

  useEffect(()=>{ if (profesorId) loadHorario(profesorId); }, [profesorId]);

  async function handleCreate(e) {
    e?.preventDefault();
    await apiCrearHorario(form);
    setForm({ profesor_id: profesorId, curso_id: "", materia_id: "", dia: "Lunes", hora_inicio: "07:00", hora_fin: "08:30", aula: "" });
    await loadHorario(profesorId);
  }

  async function handleDelete(id) {
    if (!confirm("Eliminar bloque?")) return;
    await apiEliminarHorario(id);
    await loadHorario(profesorId);
  }

  return (
    <div className="admin-schedules card-root">
      <h2>Horario Profesores</h2>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <select value={profesorId} onChange={e=>{ setProfesorId(e.target.value); setForm({...form, profesor_id: e.target.value}); }}>
          <option value="">Selecciona profesor</option>
          {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido1}</option>)}
        </select>
      </div>

      <form onSubmit={handleCreate} style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
        <select value={form.dia} onChange={e=>setForm({...form, dia:e.target.value})}>
          {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <input type="time" value={form.hora_inicio} onChange={e=>setForm({...form, hora_inicio:e.target.value})} />
        <input type="time" value={form.hora_fin} onChange={e=>setForm({...form, hora_fin:e.target.value})} />
        <select value={form.curso_id} onChange={e=>setForm({...form, curso_id:e.target.value})}>
          <option value="">Curso (opcional)</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select value={form.materia_id} onChange={e=>setForm({...form, materia_id:e.target.value})}>
          <option value="">Materia (opcional)</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input placeholder="Aula" value={form.aula} onChange={e=>setForm({...form, aula:e.target.value})} />
        <button type="submit" disabled={!profesorId}>Crear bloque</button>
      </form>

      <h3>Bloques ({horario.length})</h3>
      {horario.length === 0 ? <div className="empty">No hay bloques</div> : (
        <div style={{ display:'grid', gap:8 }}>
          {horario.map(h => (
            <div key={h.id} className="course-card" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:700 }}>{h.dia} — {h.hora_inicio} - {h.hora_fin}</div>
                <div style={{ color:'#6b7280' }}>{h.curso?.nombre || ''} {h.materia?.nombre ? `• ${h.materia.nombre}` : ''} • Aula: {h.aula || '-'}</div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>handleDelete(h.id)} className="danger">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}