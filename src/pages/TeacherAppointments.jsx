import { apiEnviarCitacion, apiListCursos } from "../config/api";
import React, { useEffect, useState } from "react";
import "./TeacherAppointments.css";

export default function TeacherAppointments() {
  const [recipientType, setRecipientType] = useState("curso");
  const [course, setCourse] = useState("");
  const [courses, setCourses] = useState([]);
  // renombrado para dejar claro que es número de identificación
  const [studentIdentificacion, setStudentIdentificacion] = useState("");
  const [parentId, setParentId] = useState("");
  const [message, setMessage] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiListCursos().then(c => setCourses(Array.isArray(c) ? c : [])).catch(()=>setCourses([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return alert("Escribe el mensaje de la citación");
    const payload = { recipientType: recipientType, message: message.trim(), fecha: fecha || null, hora: hora || null, location: null };

    if (recipientType === "curso") {
      if (!course) return alert("Selecciona un curso");
      payload.curso_id = Number(course);
    }

    if (recipientType === "estudiante") {
      // aceptar número de identificación o id numérico
      if (!studentIdentificacion) return alert("Proporciona número de identificación del estudiante");
      // si el usuario escribe un número que es id real, backend acepta también estudiante_id, pero preferimos enviar numero_identificacion
      payload.estudiante_numero_identificacion = String(studentIdentificacion).trim();
    }

    if (recipientType === "padre") {
      if (parentId) {
        payload.parent_id = Number(parentId);
      } else if (studentIdentificacion) {
        // buscar padres por numero_identificacion del estudiante
        payload.estudiante_numero_identificacion = String(studentIdentificacion).trim();
      } else {
        return alert("Proporciona parent_id o número de identificación del estudiante para enviar al padre");
      }
    }

    try {
      setLoading(true);
      await apiEnviarCitacion(payload);
      setSuccess(true);
      setTimeout(()=>setSuccess(false), 4000);
      setMessage("");
      setStudentIdentificacion("");
      setParentId("");
    } catch (err) {
      alert(err.message || "Error enviando citación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointments-container">
      <h2>Enviar Citaciones</h2>
      <p className="subtitle">Envía citaciones a un curso, a un estudiante (por número identificación) o a un padre.</p>

      <form className="appointment-form" onSubmit={handleSubmit}>
        <label>Tipo de destinatario:</label>
        <select value={recipientType} onChange={(e) => setRecipientType(e.target.value)}>
          <option value="curso">Curso completo</option>
          <option value="estudiante">Estudiante</option>
          <option value="padre">Padre</option>
        </select>

        {recipientType === "curso" && (
          <>
            <label>Curso:</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} required>
              <option value="">Selecciona un curso</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </>
        )}

        {(recipientType === "estudiante" || recipientType === "padre") && (
          <>
            <label>Número de identificación del estudiante:</label>
            <input type="text" value={studentIdentificacion} onChange={e => setStudentIdentificacion(e.target.value)} placeholder="Ej: 1023456789" />
            <label>Padre (ID) — opcional:</label>
            <input type="number" value={parentId} onChange={e => setParentId(e.target.value)} placeholder="ID padre (opcional)" />
          </>
        )}

        <label>Fecha (opcional)</label>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />

        <label>Hora (opcional)</label>
        <input type="time" value={hora} onChange={e=>setHora(e.target.value)} />

        <label>Mensaje de citación:</label>
        <textarea rows="4" placeholder="Escribe el motivo o mensaje..." value={message} onChange={(e) => setMessage(e.target.value)} required />

        <button type="submit" className="send-btn" disabled={loading}>✉️ Enviar Citación</button>

        {success && <div className="success-message">✅ Citación enviada correctamente.</div>}
      </form>
    </div>
  );
}