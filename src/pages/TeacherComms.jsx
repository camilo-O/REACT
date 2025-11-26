import React, { useEffect, useState, useContext } from "react";
import "./TeacherComms.css";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiCurso, apiEnviarComunicacion } from "../config/api";

export default function TeacherComms() {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [messages, setMessages] = useState([]); // historial local (puedes obtener del backend si lo guardas)
  const [newMessage, setNewMessage] = useState("");
  const [categoria, setCategoria] = useState("Aviso General");

  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function loadCursos() {
      try {
        const all = await apiListCursos();
        // filtrar cursos del profesor
        const mine = (all || []).filter(
          c => (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id
        );
        setCursos(Array.isArray(mine) ? mine : []);
      } catch (e) {
        console.error("loadCursos:", e);
        setCursos([]);
      }
    }
    if (!authLoading) loadCursos();
  }, [user, authLoading]);

  useEffect(() => {
    async function loadStudents() {
      if (!cursoId) return setStudents([]);
      try {
        const curso = await apiCurso(cursoId);
        // backend: curso.estudiantes o curso.estudiantes puede contener los alumnos
        const estudiantes = curso?.estudiantes || curso?.estudiantes || curso?.alumnos || [];
        setStudents(Array.isArray(estudiantes) ? estudiantes : []);
      } catch (e) {
        console.error("loadStudents:", e);
        setStudents([]);
      }
    }
    loadStudents();
  }, [cursoId]);

  async function handleSend(e) {
    e?.preventDefault();
    if (!newMessage.trim()) return setFeedback({ type: "error", text: "Escribe un mensaje." });
    if (!studentId) return setFeedback({ type: "error", text: "Selecciona el estudiante cuyo padre recibirá el mensaje." });

    setSending(true);
    setFeedback(null);
    try {
      const payload = { estudiante_id: Number(studentId), message: newMessage, categoria };
      const res = await apiEnviarComunicacion(payload);
      // respuesta esperada { message, count }
      setMessages(prev => [{ id: Date.now(), autor: `${user?.nombre || "Profesor"}`, tiempo: "Justo ahora", mensaje: newMessage, categoria }, ...prev]);
      setNewMessage("");
      setCategoria("Aviso General");
      setFeedback({ type: "success", text: res?.message || "Mensaje enviado" });
    } catch (err) {
      console.error("enviar comunicacion:", err);
      setFeedback({ type: "error", text: err.message || "Error enviando mensaje" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="teacher-comms page-root">
      <h2 className="title">💬 Comunicación — Enviar a padres</h2>
      <p className="subtitle">Selecciona curso y estudiante; el sistema enviará la comunicación a los padres vinculados.</p>

      <div className="comms-controls">
        <select value={cursoId} onChange={e => { setCursoId(e.target.value); setStudentId(""); }}>
          <option value="">— Selecciona curso —</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.grado ? `· ${c.grado}` : ""} {c.grupo ? `(${c.grupo})` : ""}</option>)}
        </select>

        <select value={studentId} onChange={e => setStudentId(e.target.value)}>
          <option value="">— Selecciona estudiante —</option>
          {students.map(s => <option key={s.id} value={s.id}>{`${s.nombre} ${s.apellido1 || ""}`}</option>)}
        </select>
      </div>

      <form className="comms-form" onSubmit={handleSend}>
        <label>Categoría</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option>Aviso General</option>
          <option>Felicitación</option>
          <option>Recordatorio</option>
        </select>

        <label>Mensaje</label>
        <textarea rows={4} placeholder="Escribe el mensaje..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />

        <div className="form-actions">
          <button type="submit" className="send-btn" disabled={sending}>{sending ? "Enviando..." : "📢 Enviar a padres"}</button>
          <button type="button" className="btn-ghost" onClick={() => { setNewMessage(""); setFeedback(null); }}>Limpiar</button>
          {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
        </div>
      </form>

      <section className="messages-list">
        <h3>Mensajes recientes (local)</h3>
        {messages.length === 0 ? <div className="empty">No hay mensajes publicados.</div> : messages.map(msg => (
          <div key={msg.id} className="message-card">
            <div className="msg-header">
              <div className="msg-meta">
                <strong>{msg.autor}</strong> · <span className="time">{msg.tiempo}</span>
              </div>
              <div className="msg-category">{msg.categoria}</div>
            </div>
            <p className="msg-body">{msg.mensaje}</p>
          </div>
        ))}
      </section>
    </div>
  );
}