import "./AdminCourses.css"; 
import React, { useEffect, useState } from "react";
import { apiListCursos, apiCrearCurso, apiEliminarCurso, apiListProfesores } from "../config/api";
import { Link } from "react-router-dom";


export default function AdminCourses() {
  const [cursos, setCursos] = useState([]);
  const [form, setForm] = useState({ grado: "primero", grupo: "101", capacidad: 30, profesor_id: "" });
  const [loading, setLoading] = useState(true);
  const [profesores, setProfesores] = useState([]);
  const [query, setQuery] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [data, profs] = await Promise.all([
        apiListCursos().catch(() => []),
        apiListProfesores().catch(() => [])
      ]);
      setProfesores(Array.isArray(profs) ? profs : []);
      setCursos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); }, []);

  async function crear(e) {
    e.preventDefault();
    try {
      await apiCrearCurso({
        grado: form.grado,
        grupo: form.grupo,
        capacidad: form.capacidad,
        profesor_id: form.profesor_id || undefined
      });
      setForm({ grado: "primero", grupo: "101", capacidad: 30, profesor_id: "" });
      load();
    } catch (e) {
      alert(e.message);
    }
  }  

  async function eliminar(id) {
    if (!confirm("Eliminar curso?")) return;
    try {
      await apiEliminarCurso(id);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  const filtered = cursos.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return String(c.nombre).toLowerCase().includes(q) ||
           String(c.grado).toLowerCase().includes(q) ||
           String(c.grupo).toLowerCase().includes(q) ||
           (c.profesor && `${c.profesor.nombre} ${c.profesor.apellido1}`.toLowerCase().includes(q));
  });

  return (
    <div className="admin-courses card-root">
      <div className="header-row">
        <h2>Cursos</h2>
        <div className="header-actions">
          <input className="search" placeholder="Buscar curso, grado o profesor..." value={query} onChange={e=>setQuery(e.target.value)} />
          <button className="refresh" onClick={load} title="Refrescar">⟳</button>
        </div>
      </div>

      <form onSubmit={crear} className="course-form">
        <select value={form.grado} onChange={e=>setForm({...form, grado:e.target.value})}>
          {['prejardin','jardin','preescolar','primero','segundo','tercero','cuarto','quinto'].map(g=> <option key={g} value={g}>{g}</option>)}
        </select>
        <input value={form.grupo} onChange={e=>setForm({...form, grupo:e.target.value})} placeholder="Grupo" />
        <input type="number" value={form.capacidad} onChange={e=>setForm({...form, capacidad:Number(e.target.value)})} className="small" />
        <select value={form.profesor_id} onChange={e=>setForm({...form, profesor_id:e.target.value})} >
          <option value="">Asignar profesor (opcional)</option>
          {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido1} ({p.email || p.username})</option>)}
        </select>
        <button className="primary" type="submit">Crear curso</button>
      </form>

      {loading ? <div className="loading">Cargando cursos...</div> : (
        filtered.length === 0 ? (
          <div className="empty">No se encontraron cursos.</div>
        ) : (
          <div className="course-grid">
            {filtered.map(c => (
              <article key={c.id} className="course-card">
                <div className="card-top">
                  <div className="course-title">{c.nombre}</div>
                  <div className="course-meta">{c.grado} · Grupo {c.grupo}</div>
                </div>

                <div className="card-body">
                  <div className="professor">
                    <div className="avatar">{c.profesor ? (c.profesor.nombre?.[0]||'P') + (c.profesor.apellido1?.[0]||'') : '—'}</div>
                    <div>
                      <div className="prof-name">{c.profesor ? `${c.profesor.nombre} ${c.profesor.apellido1 || ''}` : "Sin profesor"}</div>
                      <div className="prof-email">{c.profesor?.email || c.profesor?.username || ""}</div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <Link className="ghost" to={`/admin/courses/${c.id}`}>Ver</Link>
                    <button className="ghost" onClick={() => navigator.clipboard?.writeText(c.join_code || '') || alert(`Código: ${c.join_code || 'no generado'}`)}>Código</button>
                    <button className="danger" onClick={() => eliminar(c.id)}>Eliminar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </div>
  );
}