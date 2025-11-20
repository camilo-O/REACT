/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiSolicitarJustificacion } from "../config/api";
import "./StudentSchedule.css";

export default function StudentExcuses() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [justificacion, setJustificacion] = useState("");
  const [archivo, setArchivo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiListCursos().then(setCursos).catch(()=>setCursos([]));
  }, []);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!cursoId || !fecha || !justificacion) return alert("Curso, fecha y descripción son obligatorios");
    setSending(true);
    try {
      await apiSolicitarJustificacion({
        curso_id: Number(cursoId),
        fecha,
        justificacion,
        archivo_justificacion: archivo || null
      });
      alert("Solicitud enviada. El profesor la revisará.");
      setJustificacion("");
      setArchivo("");
    } catch (err) {
      alert(err.message || "Error al enviar solicitud");
    } finally {
      setSending(false);
    }
  }

  if (authLoading) return <div>Cargando...</div>;

  return (
    <div className="student-excuses">
      <h2>Enviar Justificante / Excusa</h2>
      <p>Envía tu justificación para una ausencia. El profesor la verá y podrá aprobarla o rechazarla.</p>

      <form onSubmit={handleSubmit} style={{ display:'flex', gap:8, flexDirection:'column', maxWidth:720 }}>
        <label>Curso</label>
        <select value={cursoId} onChange={e=>setCursoId(e.target.value)} required>
          <option value="">Selecciona curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>

        <label>Fecha de la falta</label>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} required />

        <label>Motivo / Justificación</label>
        <textarea value={justificacion} onChange={e=>setJustificacion(e.target.value)} rows={4} required />

        <label>URL archivo justificante (opcional)</label>
        <input placeholder="https://..." value={archivo} onChange={e=>setArchivo(e.target.value)} />

        <div style={{ display:'flex', gap:8 }}>
          <button type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar solicitud"}</button>
        </div>
      </form>
    </div>
  );
}