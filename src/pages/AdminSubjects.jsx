/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  apiListMaterias,
  apiCrearMateria,
  apiEditarMateria,
  apiAsignarProfesorMateria,
  apiAsignarMateriaCurso,
  apiListCursos,
  apiListProfesores
} from "../config/api";

export default function AdminSubjects() {
  const [materias, setMaterias] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nombre: "", codigo: "", curso_id: "", profesor_id: "" });

  async function loadAll() {
    setLoading(true);
    try {
      const [m, c, p] = await Promise.all([
        apiListMaterias().catch(() => []),
        apiListCursos().catch(() => []),
        apiListProfesores().catch(() => [])
      ]);
      setMaterias(Array.isArray(m) ? m : []);
      setCursos(Array.isArray(c) ? c : []);
      setProfesores(Array.isArray(p) ? p : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function crearMateria(e) {
    e?.preventDefault();
    if (!form.nombre || !form.codigo) return alert("Nombre y código son obligatorios");
    try {
      await apiCrearMateria({
        nombre: form.nombre,
        codigo: form.codigo,
        curso_id: form.curso_id || undefined,
        profesor_id: form.profesor_id || undefined
      });      
      alert("Materia creada");
      setForm({ nombre: "", codigo: "", curso_id: "", profesor_id: "" });
      loadAll();
    } catch (err) {
      alert(err.message);
    }
  }

  async function asignarProfesor(materiaId, profesorId) {
    try {
      await apiAsignarProfesorMateria(materiaId, profesorId);
      alert("Profesor asignado a materia");
      loadAll();
    } catch (e) {
      alert(e.message);
    }
  }

  async function asignarCurso(materiaId, cursoId) {
    try {
      await apiAsignarMateriaCurso(materiaId, cursoId);
      alert("Materia asignada al curso");
      loadAll();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <div>Cargando materias...</div>;

  return (
    <div className="admin-courses">
      <div className="header">
        <h2>Materias / Gestión</h2>
      </div>

      <section className="course-form" style={{ marginBottom: 12 }}>
        <form onSubmit={crearMateria} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input placeholder="Nombre de materia" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
          <input placeholder="Código" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} required />
          <button type="submit">Crear materia</button>
        </form>
      </section>

      <section>
        <h3>Listado de materias ({materias.length})</h3>
        {materias.length === 0 ? <div className="empty">No hay materias</div> : (
          <div className="course-list">
            {materias.map(m => (
              <div key={m.id} className="course-card">
                <div className="title">
                  <strong>{m.nombre}</strong>
                </div>
                <div className="meta">
                  <div>Código: {m.codigo || "—"}</div>
                  <div>Curso asignado: {m.curso?.nombre || m.curso_id || "—"}</div>
                  <div>Profesor: {m.profesor ? `${m.profesor.nombre} ${m.profesor.apellido1}` : "—"}</div>
                </div>

                <div className="controls" style={{ marginTop: 8 }}>
                  <select defaultValue="" onChange={e => {
                    const cursoId = e.target.value;
                    if (!cursoId) return;
                    if (!confirm("Asignar esta materia al curso seleccionado?")) return;
                    asignarCurso(m.id, Number(cursoId));
                  }}>
                    <option value="">Asignar a curso...</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>

                  <select defaultValue="" onChange={e => {
                    const profesorId = e.target.value;
                    if (!profesorId) return;
                    if (!confirm("Asignar profesor a esta materia?")) return;
                    asignarProfesor(m.id, Number(profesorId));
                  }}>
                    <option value="">Asignar profesor...</option>
                    {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido1} ({p.username || p.email})</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}