/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./ParentSchedule.css";
import { AuthContext } from "../context/AuthContext";
import { apiListMatriculas, apiHorarioCurso } from "../config/api";

const DIA_ORDEN = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

export default function ParentSchedule() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [children, setChildren] = useState([]); 
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadChildren() {
      setLoading(true);
      setError(null);
      try {
        const mats = await apiListMatriculas().catch(() => []);
        // agrupa por estudiante
        const map = new Map();
        (Array.isArray(mats) ? mats : []).forEach(m => {
          const est = m.estudiante || (m.estudiante_id ? { id: m.estudiante_id, nombre: m.estudiante_nombre, apellido1: m.estudiante_apellido1 } : null);
          const curso = m.curso || (m.curso_id ? { id: m.curso_id, nombre: m.curso_nombre || `Curso ${m.curso_id}` } : null);
          if (!est || !est.id) return;
          const key = Number(est.id);
          if (!map.has(key)) map.set(key, { id: key, nombre: `${est.nombre || ''} ${est.apellido1 || ''}`.trim() || `Alumno ${key}`, cursos: [] });
          const entry = map.get(key);
          if (curso && curso.id && !entry.cursos.find(c => Number(c.id) === Number(curso.id))) {
            entry.cursos.push({ id: Number(curso.id), nombre: curso.nombre || `Curso ${curso.id}` });
          }
        });
        const kids = Array.from(map.values());
        setChildren(kids);
        if (kids.length > 0) {
          setSelectedChild(kids[0].id);
          if (kids[0].cursos && kids[0].cursos.length > 0) {
            setSelectedCourse(String(kids[0].cursos[0].id));
          }
        }
      } catch (e) {
        console.error("loadChildren:", e);
        setError("No se pudieron cargar los hijos/matrículas");
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) loadChildren();
  }, [authLoading]);

  useEffect(() => {
    async function loadSchedule() {
      if (!selectedCourse) {
        setSchedule([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const rows = await apiHorarioCurso(Number(selectedCourse)).catch(() => []);
        // normalizar y mapear
        const normalized = (Array.isArray(rows) ? rows : []).map(r => ({
          id: r.id,
          dia: r.dia,
          hora_inicio: r.hora_inicio,
          hora_fin: r.hora_fin,
          materia: r.materia || r.Materia || null,
          profesor: r.profesor || r.User || r.Profesor || null,
          aula: r.aula || r.sala || null,
          curso: r.curso || r.Curso || null
        }));
        setSchedule(normalized);
      } catch (e) {
        console.error("loadSchedule:", e);
        setError("Error cargando horario del curso");
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [selectedCourse]);

  // Agrupar por día
  const grouped = schedule.reduce((acc, cls) => {
    const dia = cls.dia || "Sin día";
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

  if (authLoading || loading) return <div className="ps-loading">Cargando horario...</div>;

  return (
    <div className="parent-schedule page-root">
      <header className="ps-header">
        <div>
          <h2 className="page-title">Horario del Estudiante</h2>
          <p className="page-subtitle">Selecciona el hijo y curso para ver el horario semanal.</p>
        </div>
      </header>

      <div className="ps-controls">
        <label>Hijo:</label>
        <select value={selectedChild || ""} onChange={e => {
          const id = Number(e.target.value);
          setSelectedChild(id);
          const kid = children.find(c => Number(c.id) === Number(id));
          setSelectedCourse(kid && kid.cursos[0] ? String(kid.cursos[0].id) : "");
        }}>
          <option value="">— Selecciona hijo —</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        <label>Curso:</label>
        <select value={selectedCourse || ""} onChange={e => setSelectedCourse(e.target.value)}>
          <option value="">— Selecciona curso —</option>
          {(children.find(c => Number(c.id) === Number(selectedChild))?.cursos || []).map(cr => (
            <option key={cr.id} value={cr.id}>{cr.nombre}</option>
          ))}
        </select>

        <button className="btn" onClick={() => {
          // refrescar cursos y horario
          setSelectedCourse(s => (s ? String(s) : s));
        }}>Refrescar</button>
      </div>

      {error && <div className="ps-error">{error}</div>}

      {schedule.length === 0 ? (
        <div className="ps-empty">No hay clases registradas para el curso seleccionado.</div>
      ) : (
        diasOrdenados.map(day => (
          <div key={day} className="ps-day">
            <h3 className="ps-day-title">{day}</h3>
            <div className="ps-grid">
              {grouped[day].sort((a,b) => (a.hora_inicio||"").localeCompare(b.hora_inicio||"")).map(cls => (
                <div key={cls.id} className="ps-card">
                  <div className="ps-card-header">
                    <h4>{cls.materia?.nombre || "Asignatura"}</h4>
                    <span className="ps-time">{(cls.hora_inicio || "--")}{cls.hora_fin ? ` • ${cls.hora_fin}` : ""}</span>
                  </div>
                  <div className="ps-meta">👨‍🏫 {cls.profesor ? `${cls.profesor.nombre || ''} ${cls.profesor.apellido1 || ''}`.trim() : "—"}</div>
                  <div className="ps-meta">🏫 {cls.aula || "—"}</div>
                  <div className="ps-meta">Curso: {cls.curso?.nombre || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}