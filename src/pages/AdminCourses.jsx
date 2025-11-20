import "./AdminCourses.css"; 
import React, { useEffect, useState } from "react";
import { apiListCursos, apiCrearCurso, apiEliminarCurso, apiListProfesores } from "../config/api";

export default function AdminCourses() {
  const [cursos, setCursos] = useState([]);
  const [form, setForm] = useState({ grado: "primero", grupo: "101", capacidad: 30 });
  const [loading, setLoading] = useState(true);
const [profesores, setProfesores] = useState([]);


  async function load() {
    setLoading(true);
    try {
      const data = await apiListCursos();
      const profs = await apiListProfesores().catch(()=>[]);
      setProfesores(Array.isArray(profs) ? profs : []);
      setCursos(data);
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

  return (
     <div className="admin-courses">
      <h2>Cursos</h2>
      <form onSubmit={crear} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12 }}>
        <select value={form.grado} onChange={e=>setForm({...form, grado:e.target.value})}>
          {['prejardin','jardin','preescolar','primero','segundo','tercero','cuarto','quinto'].map(g=> <option key={g} value={g}>{g}</option>)}
        </select>
        <input value={form.grupo} onChange={e=>setForm({...form, grupo:e.target.value})} placeholder="Grupo" />
        <input type="number" value={form.capacidad} onChange={e=>setForm({...form, capacidad:Number(e.target.value)})} style={{ width:90 }} />
        <select value={form.profesor_id} onChange={e=>setForm({...form, profesor_id:e.target.value})} >
          <option value="">Asignar profesor (opcional)</option>
          {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellido1} ({p.email || p.username})</option>)}
        </select>
        <button type="submit">Crear</button>
      </form>

      {loading ? <div>Cargando...</div> : (
        <ul>
          {cursos.map(c => (
            <li key={c.id}>
              {c.nombre} ({c.grado}-{c.grupo}) — Profesor: {c.profesor?.nombre || "—"}
              <button onClick={()=>eliminar(c.id)} style={{ marginLeft:8 }}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}