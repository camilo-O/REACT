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
import "./AdminSubjects.css";

export default function AdminSubjects() {
  const [materias, setMaterias] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ nombre: "", codigo: "", curso_id: "", profesor_id: "" });
  const [filter, setFilter] = useState("");

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
      console.error("loadAll materias:", e);
      alert("No se pudieron cargar materias/cursos/profesores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function crearMateria(e) {
    e?.preventDefault();
    if (!form.nombre || !form.codigo) return alert("Nombre y código son obligatorios");
    setSaving(true);
    try {
      await apiCrearMateria({
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim(),
        curso_id: form.curso_id || undefined,
        profesor_id: form.profesor_id || undefined
      });
      alert("Materia creada");
      setForm({ nombre: "", codigo: "", curso_id: "", profesor_id: "" });
      await loadAll();
    } catch (err) {
      console.error("crearMateria:", err);
      alert(err.message || "Error al crear materia");
    } finally {
      setSaving(false);
    }
  }

  async function handleAsignarProfesor(materiaId, profesorId) {
    if (!profesorId) return;
    if (!confirm("Asignar este profesor a la materia?")) return;
    try {
      await apiAsignarProfesorMateria(materiaId, Number(profesorId));
      alert("Profesor asignado");
      await loadAll();
    } catch (e) {
      console.error("asignarProfesor:", e);
      alert(e.message || "Error al asignar profesor");
    }
  }

  async function handleAsignarCurso(materiaId, cursoId) {
    if (!cursoId) return;
    if (!confirm("Asignar esta materia al curso?")) return;
    try {
      await apiAsignarMateriaCurso(materiaId, Number(cursoId));
      alert("Materia asignada al curso");
      await loadAll();
    } catch (e) {
      console.error("asignarCurso:", e);
      alert(e.message || "Error al asignar curso");
    }
  }

  async function handleEditar(m) {
    const nombre = prompt("Nombre de la materia", m.nombre);
    if (nombre === null) return;
    const codigo = prompt("Código", m.codigo || "");
    if (codigo === null) return;
    try {
      await apiEditarMateria(m.id, { nombre: nombre.trim(), codigo: codigo.trim() });
      alert("Materia actualizada");
      await loadAll();
    } catch (e) {
      console.error("editarMateria:", e);
      alert(e.message || "Error al editar materia");
    }
  }

  const visible = materias
    .filter(x => !filter ? true : String(x.nombre).toLowerCase().includes(filter.toLowerCase()) || (x.codigo || "").toLowerCase().includes(filter.toLowerCase()))
    .sort((a,b) => a.nombre.localeCompare(b.nombre));

  if (loading) return <div className="admin-subjects"><div className="empty">Cargando materias...</div></div>;

  return (
    <div className="admin-subjects">
      <div className="header">
        <h2>Materias — Gestión</h2>
        <div className="header-actions">
          <input placeholder="Buscar materia o código..." value={filter} onChange={e => setFilter(e.target.value)} />
          <button onClick={loadAll}>Refrescar</button>
        </div>
      </div>

      <section className="create-section">
        <form onSubmit={crearMateria} className="create-form">
          <input placeholder="Nombre de materia" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required />
          <input placeholder="Código" value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} required />
          <select value={form.curso_id} onChange={e => setForm({...form, curso_id: e.target.value})}>
            <option value="">Asignar a curso (opcional)</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={form.profesor_id} onChange={e => setForm({...form, profesor_id: e.target.value})}>
            <option value="">Asignar profesor (opcional)</option>
            {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido1 || ''}</option>)}
          </select>
          <button type="submit" className="primary" disabled={saving}>{saving ? "Guardando..." : "Crear materia"}</button>
        </form>
      </section>

      <section className="list-section">
        <h3>Listado ({visible.length})</h3>
        {visible.length === 0 ? (
          <div className="empty">No hay materias.</div>
        ) : (
          <div className="subjects-grid">
            {visible.map(m => (
              <article key={m.id} className="subject-card">
                <div className="subject-top">
                  <strong className="subject-name">{m.nombre}</strong>
                  <small className="subject-code">{m.codigo || "—"}</small>
                </div>

                <div className="subject-body">
                  <div className="meta-row">
                    <div>Curso:</div>
                    <div className="meta-value">{m.curso?.nombre || (m.curso_id ? `ID ${m.curso_id}` : "Sin curso")}</div>
                  </div>
                  <div className="meta-row">
                    <div>Director de curso:</div>
                    <div className="meta-value">{m.profesor ? `${m.profesor.nombre} ${m.profesor.apellido1 || ''}` : "Sin profesor"}</div>
                  </div>
                </div>

                <div className="subject-actions">
                  <select defaultValue="" onChange={e => { if (e.target.value) handleAsignarCurso(m.id, e.target.value); }}>
                    <option value="">Asignar a curso...</option>
                    {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>

                  <select defaultValue="" onChange={e => { if (e.target.value) handleAsignarProfesor(m.id, e.target.value); }}>
                    <option value="">Asignar profesor...</option>
                    {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido1 || ''}</option>)}
                  </select>

                  <div className="card-actions">
                    <button onClick={() => handleEditar(m)}>Editar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}