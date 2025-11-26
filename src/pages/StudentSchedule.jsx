/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from "react";
import "./StudentSchedule.css";
import { AuthContext } from "../context/AuthContext";
import { apiListMatriculas, apiHorarioCurso } from "../config/api";

const DIA_ORDEN = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

export default function StudentSchedule() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]); 
  const [selectedCourse, setSelectedCourse] = useState(""); 


  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
      if (!user) return setSchedule([]);
      // pedir matriculas sin filtro (la API puede negar ?estudiante_id a estudiantes)
      const matriculas = await apiListMatriculas().catch((err) => {
        console.error("apiListMatriculas error:", err);
        return [];
      });
      // filtrar solo las matrículas del usuario autenticado
      const myMats = Array.isArray(matriculas) ? matriculas.filter(m =>
        Number(m.estudiante_id) === Number(user.id) || (m.estudiante && Number(m.estudiante.id) === Number(user.id))
      ) : [];
      console.log("matriculas filtradas (estudiante):", myMats);

      const cursosMap = new Map();
      (myMats || []).forEach(m => {
        const c = m.curso || (m.curso_id ? { id: m.curso_id, nombre: m.curso_nombre || `Curso ${m.curso_id}` } : null);
        if (c && c.id) cursosMap.set(Number(c.id), { id: Number(c.id), nombre: c.nombre || `Curso ${c.id}` });
      });
      const cursoIds = Array.from(cursosMap.keys());
      const cursosInfo = Array.from(cursosMap.values());setCourses(cursosInfo);

      if (cursoIds.length === 0) {
        console.warn("No se encontraron cursos del estudiante (matriculas vacías).");
        setSchedule([]);
        return;
      }

      const promises = cursoIds.map(id => apiHorarioCurso(id).catch(err => {
        console.error(`apiHorarioCurso error curso ${id}:`, err);
        return [];
      }));
      const results = await Promise.all(promises);
      const combinedMap = new Map();
      results.flat().forEach(block => {
        if (!block) return;
        const cursoId = block?.curso?.id || block?.curso_id || (block?.Curso && block.Curso.id) || null;
        const materiaId = block?.materia?.id || block?.Materia?.id || block?.materia_id || '';
        const key = block?.id ? String(block.id) : `${cursoId}-${block?.dia || ''}-${block?.hora_inicio || ''}-${materiaId}`;
        if (combinedMap.has(key)) return; 
        combinedMap.set(key, {
          id: block?.id ?? key,
          dia: block?.dia,
          hora_inicio: block?.hora_inicio,
          hora_fin: block?.hora_fin,
         materia: block?.materia || block?.Materia || null,
          profesor: block?.profesor || block?.User || null,
          aula: block?.aula || block?.sala || null,
          curso: block?.curso || block?.Curso || cursosInfo.find(c => c.id === cursoId) || { id: cursoId }
        });
      });
      const combined = Array.from(combinedMap.values());
      setSchedule(combined);
      if (cursoIds.length === 1) setSelectedCourse(String(cursoIds[0]));
       } catch (e) {
         console.error("Error cargar horario:", e);
        setSchedule([]);
        setCourses([]);
       } finally {
         setLoading(false);
       }
     }
     if (!authLoading) load();
   }, [user, authLoading]);

  // Agrupar y ordenar por día + hora
  const filtered = schedule.filter(s => !selectedCourse || String(s.curso?.id || s.curso_id || s.Curso?.id) === String(selectedCourse));
  const grouped = filtered.reduce((acc, cls) => {    const dia = cls.dia || "Sin día";
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(cls);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(grouped).sort((a,b) => {
    const ia = DIA_ORDEN.indexOf(a);
    const ib = DIA_ORDEN.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  if (authLoading || loading) return <p className="loading">Cargando horario...</p>;

  if (schedule.length === 0) {
    return (
      <div className="student-schedule">
        <h2 className="title">🕓 Mi Horario</h2>
        <p className="subtitle">Aquí se muestra el horario semanal del estudiante.</p>
        <div className="empty-box"><p>📭 No tienes clases registradas.</p></div>
      </div>
    );
  }

  return (
    <div className="student-schedule">
      <h2 className="title">🕓 Mi Horario</h2>
      <p className="subtitle">Aquí se muestra el horario semanal del estudiante.</p>

      <div style={{ display:'flex', gap:8, margin:'12px 0', alignItems:'center' }}>
        <label style={{ fontWeight:600 }}>Curso:</label>
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
          <option value="">— Todos mis cursos —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.nombre || `Curso ${c.id}`}</option>)}
        </select>
      </div>



      {diasOrdenados.map(day => (
        <div key={day} className="day-section">
          <h3 className="day-title">{day}</h3>
          <div className="schedule-grid">
            {grouped[day]
              .sort((a,b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))
              .map(cls => (
              <div key={cls.id} className="class-card">
                <div className="class-header">
                  <h4>{cls.materia?.nombre || cls.Materia?.nombre || cls.asignatura || "Asignatura"}</h4>
                  <span className="time-tag">{(cls.hora_inicio ? cls.hora_inicio : "--")}{cls.hora_fin ? ` • ${cls.hora_fin}` : ""}</span>
                 </div>
                <p className="teacher">👨‍🏫 {cls.profesor?.nombre ? `${cls.profesor.nombre} ${cls.profesor.apellido1 || ""}`.trim() : (cls.User?.nombre || cls.profesor_nombre || "—")}</p>
                <p className="room">🏫 {cls.aula || cls.aula_nombre || "—"}</p>
                <p className="meta">Curso: {cls.curso?.nombre || cls.Curso?.nombre || cls.curso_nombre || "—"}</p>
               </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}