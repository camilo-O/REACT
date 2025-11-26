/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  apiCurso,
  apiListMaterias,
  apiTareasCurso,
  apiMatricularEstudiante,
  apiListProfesores,
  apiListCursos,
  apiDesmatricularEstudiante
} from "../config/api";
import "./AdminCourses.css";

export default function CourseDetail() {
  const { id } = useParams();
  const cursoId = Number(id);
  const { user } = useContext(AuthContext);

  const [curso, setCurso] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [estudianteId, setEstudianteId] = useState("");
  const [loading, setLoading] = useState(true);

 const [students, setStudents] = useState([]);
 const [studentFilter, setStudentFilter] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, m] = await Promise.all([
          apiCurso(cursoId).catch(() => null),
          apiListMaterias({ curso_id: cursoId }).catch(() => [])
        ]);
        setCurso(c || null);
       setStudents((c && Array.isArray(c.estudiantes)) ? c.estudiantes : []);
        setMaterias(Array.isArray(m) ? m : []);
        if (m && m.length > 0) setSelectedMateria(m[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [cursoId]);

  useEffect(() => {
    async function loadTareas() {
      if (!selectedMateria) return setTareas([]);
      try {
        const ts = await apiTareasCurso(cursoId, selectedMateria).catch(() => []);
        setTareas(Array.isArray(ts) ? ts : []);
      } catch (e) {
        console.error(e);
        setTareas([]);
      }
    }
    loadTareas();
  }, [cursoId, selectedMateria]);

  async function handleMatricular(e) {
    e?.preventDefault();
    if (!estudianteId) return alert("Ingresa estudiante_id para matricular");
    try {
      await apiMatricularEstudiante(cursoId, estudianteId);
      alert("Estudiante matriculado correctamente");
      // refrescar curso y lista de estudiantes
      const refreshed = await apiCurso(cursoId).catch(()=>null);
      setCurso(refreshed || curso);
     setStudents((refreshed && Array.isArray(refreshed.estudiantes)) ? refreshed.estudiantes : students);
    } catch (err) {
      alert(err.message || "Error al matricular");
    }
  }

    async function handleDesmatricular(estudiante) {
    if (!confirm(`Desmatricular a ${estudiante.nombre} ${estudiante.apellido1 || ''}?`)) return;
    try {
      // usa id (preferible) o numero_identificacion
      await apiDesmatricularEstudiante(cursoId, estudiante.id || estudiante.numero_identificacion);
      alert("Estudiante desmatriculado");
      const refreshed = await apiCurso(cursoId).catch(()=>null);
      setCurso(refreshed || curso);
      setStudents((refreshed && Array.isArray(refreshed.estudiantes)) ? refreshed.estudiantes : students.filter(s => s.id !== estudiante.id));
    } catch (err) {
      alert(err.message || "Error al desmatricular");
    }
  }


  if (loading) return <div>Cargando...</div>;

 const visibleStudents = (students || []).filter(s => {
   if (!studentFilter) return true;
   const q = String(studentFilter).toLowerCase();
   return (String(s.nombre || '') + ' ' + String(s.apellido1 || '') + ' ' + String(s.numero_identificacion || '')).toLowerCase().includes(q)
 });

  return (
    <div className="admin-courses card-root">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>Curso: {curso?.nombre || `ID ${cursoId}`}</h2>
        <Link to="/admin/courses">← Volver a cursos</Link>
      </div>

      <div className="course-form" style={{ marginTop:12 }}>
        <div style={{ marginBottom:8 }}>
          <strong>Profesor asignado:</strong> {curso?.profesor ? `${curso.profesor.nombre} ${curso.profesor.apellido1}` : "Sin profesor"}
        </div>

        <form onSubmit={handleMatricular} style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input placeholder="Número identificación del estudiante (o id)" value={estudianteId} onChange={e=>setEstudianteId(e.target.value)} />
          <button type="submit">Matricular estudiante</button>
        </form>
      </div>

     <section style={{ marginTop:16 }}>
       <h3>Estudiantes matriculados ({visibleStudents.length})</h3>
       <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
         <input placeholder="Buscar por nombre o identificación..." value={studentFilter} onChange={e=>setStudentFilter(e.target.value)} style={{ padding:8, borderRadius:8, border:'1px solid #e5e7eb' }} />
       </div>
       {visibleStudents.length === 0 ? (
         <div className="empty">No hay estudiantes matriculados.</div>
       ) : (
         <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
           {visibleStudents.map(s => (
             <div key={s.id} style={{ padding:12, borderRadius:10, background:'#fff', border:'1px solid #eef6ff' }}>
               <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                 <div className="avatar" style={{ width:44, height:44, borderRadius:10, background:'#0d335b', color:'#fff', display:'grid', placeItems:'center', fontWeight:700 }}>
                   { (s.nombre?.[0]||'') + (s.apellido1?.[0]||'') }
                 </div>
                 <div style={{ flex:1 }}>
                   <div style={{ fontWeight:700 }}>{s.nombre} {s.apellido1 || ''}</div>
                   <div style={{ color:'#6b7280', fontSize:13 }}>{s.email || s.username || '—'}</div>
                   <div style={{ color:'#6b7280', fontSize:13 }}>TI/CC: {s.numero_identificacion || s.id}</div>
                 </div>
                    <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => handleDesmatricular(s)} style={{ background:'#fff', border:'1px solid #f3f4f6', padding:'6px 8px', borderRadius:8, cursor:'pointer' }}>Desmatricular</button>
                </div>
               </div>
             </div>
           ))}
         </div>
       )}
     </section>

      <section style={{ marginTop:16 }}>
        <h3>Materias ({materias.length})</h3>
        {materias.length === 0 ? <div className="empty">No hay materias asignadas a este curso.</div> : (
          <div className="subjects-grid">
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <label>Filtrar por materia:</label>
              <select value={selectedMateria || ""} onChange={e=>setSelectedMateria(e.target.value)}>
                <option value="">— Todas —</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} {m.codigo ? `(${m.codigo})` : ""}</option>)}
              </select>
            </div>

            <div style={{ marginTop:12 }}>
              <h4>Tareas de la materia seleccionada</h4>
              {(!selectedMateria || tareas.length === 0) ? (
                <div className="empty">No hay tareas para la materia seleccionada.</div>
              ) : (
                <ul>
                  {tareas.map(t => (
                    <li key={t.id}>
                      <strong>{t.titulo}</strong> — vence: {t.fecha_entrega} — prioridad: {t.prioridad}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}