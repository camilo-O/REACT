/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { apiListCursos, apiCurso, apiListComunicacionesEnviadas, apiEnviarComunicacion, apiEnviarCitacion } from "../config/api";
import { AuthContext } from "../context/AuthContext";
import "./TeacherStudents.css";
import { useNavigate } from "react-router-dom";


export default function TeacherStudents() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentsMap, setStudentsMap] = useState({});
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);

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

 function verPerfil(est) {
  if (!est) return;
  setProfileStudent(est);
  setProfileOpen(true);
}

  async function enviarMensajePadres(est) {
    const msg = prompt(`Mensaje para los padres de ${est.nombre} ${est.apellido1 || ""}`, "");
    if (!msg) return;
    try {
      await apiEnviarComunicacion({
        estudiante_id: Number(est.id),
        message: msg,
        categoria: "Aviso profesor",
        enviar_a: "padre"
      });
      alert("Comunicación enviada a los padres.");
    } catch (e) {
      alert(e.message || "Error al enviar comunicación");
    }
  }

  async function enviarCitacion(curso, est) {
    const fecha = prompt("Fecha (YYYY-MM-DD)", new Date().toISOString().slice(0,10));
    const hora = prompt("Hora (HH:MM)", "16:00");
    const mensaje = prompt("Motivo/cita", "Reunión con acudiente");
    if (!mensaje) return;
    try {
      await apiEnviarCitacion({
        recipientType: "padre",
        estudiante_id: Number(est.id),
        message: mensaje,
        fecha,
        hora,
        location: "Sala de coordinación",
        curso_id: Number(curso.id)
      });
      alert("Citación enviada.");
    } catch (e) {
      alert(e.message || "Error al enviar citación");
    }
  }


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

   // Acciones


  function verTareas(est) {
    navigate(`/student/tasks`, { state: { estudianteId: est.id } });
  }

  function verAsistencia(curso, est) {
    navigate(`/teacher/attendance-detail`, { state: { estudianteId: est.id, cursoId: curso.id } });
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

{profileOpen && profileStudent && (
  <div className="ts-modal-overlay">
    <div className="ts-modal">
      <div className="ts-modal-header">
        <h3>Perfil del estudiante</h3>
        <button className="ts-close" onClick={()=>{ setProfileOpen(false); setProfileStudent(null); }}>Cerrar</button>
      </div>
      <div className="ts-modal-body">
        <div className="ts-profile-row"><strong>Nombre:</strong> {profileStudent.nombre} {profileStudent.apellido1 || ''}</div>
        <div className="ts-profile-row"><strong>Identificación:</strong> {profileStudent.numero_identificacion || '—'}</div>
        <div className="ts-profile-row"><strong>Correo:</strong> {profileStudent.email || '—'}</div>
        <div className="ts-profile-row"><strong>Teléfono:</strong> {profileStudent.telefono || '—'}</div>
        <div className="ts-profile-row"><strong>Fecha nacimiento:</strong> {profileStudent.fecha_nacimiento || '—'}</div>
        <div className="ts-profile-row"><strong>Dirección:</strong> {profileStudent.direccion || '—'}</div>
      </div>
      <div className="ts-modal-footer">
        <button className="ts-close" onClick={()=>{ setProfileOpen(false); setProfileStudent(null); }}>Cerrar</button>
      </div>
    </div>
  </div>
)}

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
                            <td style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              <button className="action-btn ghost" onClick={() => verPerfil(s)}>Perfil</button>
                              <button className="action-btn primary" onClick={() => verTareas(s)}>Tareas</button>
                              <button className="action-btn" onClick={() => verAsistencia(c, s)}>Asistencia</button>
                              <button className="action-btn warning" onClick={() => enviarMensajePadres(s)}>Comunicar padres</button>
                              <button className="action-btn danger" onClick={() => enviarCitacion(c, s)}>Citación</button>
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