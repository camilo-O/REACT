import React, { useEffect, useState, useContext } from "react";
import "./TeacherComms.css";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiCurso, apiEnviarComunicacion, apiListComunicacionesEnviadas } from "../config/api";

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

  const [chats, setChats] = useState([]); 
  const [loadingChats, setLoadingChats] = useState(false);
  const [includeStudent, setIncludeStudent] = useState(false);


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

    useEffect(() => {
    loadEnviadas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId, studentId]);

  async function loadEnviadas() {
    setLoadingChats(true);
    try {
      const params = {};
      if (cursoId) params.curso_id = Number(cursoId);
      if (studentId) params.estudiante_id = Number(studentId);
      const sent = await apiListComunicacionesEnviadas(params);
      const arr = Array.isArray(sent) ? sent : [];
      // agrupar por destinatario.usuario_id
      const map = new Map();
      arr.forEach(n => {
        const key = n.usuario_id;
        if (!map.has(key)) map.set(key, { destinatario: n.destinatario || { id: key }, estudiante_id: n.estudiante_id || null, mensajes: [] });
        map.get(key).mensajes.push({
          id: n.id,
          titulo: n.titulo,
          texto: n.mensaje,
          fecha: n.created_at
        });
      });
      // ordenar mensajes por fecha desc dentro de cada chat
      const grouped = Array.from(map.values()).map(chat => ({
        ...chat,
        mensajes: chat.mensajes.sort((a,b) => String(b.fecha||'').localeCompare(a.fecha||''))
      }));
      // ordenar chats por última actividad
      grouped.sort((a,b) => {
        const fa = a.mensajes[0]?.fecha || '';
        const fb = b.mensajes[0]?.fecha || '';
        return String(fb).localeCompare(fa);
      });
      setChats(grouped);
    } catch (e) {
      console.error('loadEnviadas:', e);
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }


  async function handleSend(e) {
    e?.preventDefault();
    if (!newMessage.trim()) return setFeedback({ type: "error", text: "Escribe un mensaje." });
    if (!studentId) return setFeedback({ type: "error", text: "Selecciona el estudiante cuyo padre recibirá el mensaje." });

    setSending(true);
    setFeedback(null);
    try {
      const payload = { estudiante_id: Number(studentId), message: newMessage, categoria, incluir_estudiante: includeStudent };
      const res = await apiEnviarComunicacion(payload);
      // respuesta esperada { message, count }
      setMessages(prev => [{ id: Date.now(), autor: `${user?.nombre || "Profesor"}`, tiempo: "Justo ahora", mensaje: newMessage, categoria }, ...prev]);
      setNewMessage("");
      setCategoria("Aviso General");
      setFeedback({ type: "success", text: res?.message || "Mensaje enviado" });
          setIncludeStudent(false);
      await loadEnviadas();
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
        
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={includeStudent} onChange={e => setIncludeStudent(e.target.checked)} />
          Incluir estudiante (además de los padres)
        </label>

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
            <section className="messages-list">
        <h3>Mis conversaciones enviadas {loadingChats ? '...' : `(${chats.length})`}</h3>
        {loadingChats ? <div className="empty">Cargando conversaciones...</div> :
          chats.length === 0 ? <div className="empty">Sin mensajes enviados.</div> :
          chats.map(chat => (
            <div key={chat.destinatario.id} className="message-card">
              <div className="msg-header">
                <div className="msg-meta">
                  <strong>{chat.destinatario?.nombre ? `${chat.destinatario.nombre} ${chat.destinatario.apellido1 || ''}` : `ID ${chat.destinatario.id}`}</strong>
                  <span className="time" style={{ marginLeft:8 }}>
                    {chat.mensajes[0]?.fecha ? new Date(chat.mensajes[0].fecha).toLocaleString() : ''}
                  </span>
                </div>
                <div className="msg-category">{chat.estudiante_id ? `Padre de Est. ${chat.estudiante_id}` : 'Padre'}</div>
              </div>
              <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
               {chat.mensajes.map(m => (
                  <div key={m.id} style={{ border:'1px solid #eef6ff', borderRadius:8, padding:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', color:'#6b7280', fontSize:'0.9rem' }}>
                      <span>{m.titulo || 'Comunicado'}</span>
                      <span>{new Date(m.fecha).toLocaleString()}</span>
                    </div>
                    <div style={{ marginTop:6, color:'#374151' }}>{m.texto}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
      </section>
    </div>
  );
}