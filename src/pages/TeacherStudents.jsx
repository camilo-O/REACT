import React, { useEffect, useState, useContext } from "react";
import { apiListCursos, apiCurso } from "../config/api";
import { AuthContext } from "../context/AuthContext";
import "./TeacherStudents.css";

export default function TeacherStudents() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // mapa cursoId -> estudiantes[]
  const [studentsMap, setStudentsMap] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const all = await apiListCursos();
        // filtrar cursos donde el profesor sea el usuario actual
        const mine = (all || []).filter(c =>
          (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id
        );
        setCursos(mine);
      } catch (e) {
        console.error("Error cargando cursos:", e);
        setError(e.message || "Error al cargar cursos");
        setCursos([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [user, authLoading]);

  async function toggleCurso(cursoId) {
    if (expanded === cursoId) {
      setExpanded(null);
      return;
    }
    setExpanded(cursoId);
    if (studentsMap[cursoId]) return; // ya cargado

    try {
      const curso = await apiCurso(cursoId);
      // backend devuelve curso con campo 'estudiantes'
      const estudiantes = curso.estudiantes || curso.estudiantes || [];
      setStudentsMap(prev => ({ ...prev, [cursoId]: estudiantes }));
    } catch (e) {
      console.error("Error cargando estudiantes del curso:", e);
      setStudentsMap(prev => ({ ...prev, [cursoId]: [] }));
    }
  }

  function getInitials(name, apellido) {
    if (!name) return "CC";
    const parts = [name, apellido].filter(Boolean);
    return parts.map(p => p[0]?.toUpperCase()).join("").slice(0, 2);
  }

  if (authLoading || loading) return <div>Cargando mis cursos...</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;

  return (
    <div className="teacher-students">
      <h2 className="title">Mis Estudiantes</h2>
      <p className="subtitle">Selecciona un curso para ver los estudiantes inscritos.</p>

      {cursos.length === 0 ? (
        <div className="empty">No tienes cursos asignados.</div>
      ) : (
        <div className="courses-list">
          {cursos.map(c => (
            <div key={c.id} className="course-card">
              <div className="course-head">
                <div>
                  <strong className="course-name">{c.nombre}</strong>
                  <div className="meta">{c.grado} • Grupo {c.grupo}</div>
                </div>
                <div className="controls">
                  <button onClick={() => toggleCurso(c.id)}>
                    {expanded === c.id ? "Ocultar" : "Ver estudiantes"}
                  </button>
                </div>
              </div>

              {expanded === c.id && (
                <div className="students-section">
                  {(!studentsMap[c.id] || studentsMap[c.id].length === 0) ? (
                    <div className="empty">No hay estudiantes matriculados en este curso.</div>
                  ) : (
                    <table className="students-table">
                      <thead>
                        <tr>
                          <th>Alumno</th>
                          <th>Email</th>
                          <th>Teléfono</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsMap[c.id].map(s => (
                          <tr key={s.id}>
                            <td>
                              <div className="student-cell">
                                <div className="avatar">{getInitials(s.nombre, s.apellido1)}</div>
                                <div>
                                  <div className="student-name">{`${s.nombre} ${s.apellido1 || ""}`.trim()}</div>
                                  <div className="student-meta">{s.fecha_nacimiento ? `Nac: ${s.fecha_nacimiento}` : ""}</div>
                                </div>
                              </div>
                            </td>
                            <td>{s.email || s.username || "—"}</td>
                            <td>{s.telefono || "—"}</td>
                            <td>
                              <button onClick={() => alert(`Ver perfil ${s.id}`)}>Ver perfil</button>
                              <button onClick={() => alert(`Enviar mensaje a ${s.id}`)}>Mensaje</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}