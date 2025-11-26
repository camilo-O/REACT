import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiSolicitarJustificacion, apiAsistenciaPorFecha } from "../config/api";
import "./StudentExcuses.css";

export default function StudentExcuses() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [justificacion, setJustificacion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [sending, setSending] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [record, setRecord] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    apiListCursos().then(setCursos).catch(()=>setCursos([]));
  }, []);

  useEffect(() => {
    async function loadRecord() {
      setRecord(null);
      setFeedback(null);
      if (!cursoId || !fecha) return;
      setLoadingRecord(true);
      try {
        const data = await apiAsistenciaPorFecha(cursoId, fecha);
        const arr = Array.isArray(data) ? data : data || [];
        const mine = arr.find(r => Number(r.estudiante_id) === Number(user?.id) || (r.estudiante && Number(r.estudiante.id) === Number(user?.id)));
        if (mine) {
          setRecord(mine);
        } else {
          setRecord(null);
          setFeedback({ type: "info", text: "No se encontró registro de asistencia para esa fecha/curso. No puedes solicitar justificante." });
        }
      } catch (e) {
        console.error("loadRecord:", e);
        setRecord(null);
        setFeedback({ type: "error", text: e.message || "Error cargando registro de asistencia" });
      } finally {
        setLoadingRecord(false);
      }
    }
    if (!authLoading) loadRecord();
  }, [cursoId, fecha, user, authLoading]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!cursoId || !fecha || !justificacion) return alert("Curso, fecha y descripción son obligatorios");
    if (!record) return alert("No hay registro de asistencia para esa fecha/curso.");
    setSending(true);
    setFeedback(null);
        try {
      await apiSolicitarJustificacion({ curso_id: Number(cursoId), fecha, justificacion }, archivo);
      setFeedback({ type: "success", text: "Solicitud enviada. El profesor la revisará." });
      setJustificacion("");
      setArchivo(null);
      // refrescar registro
      const data = await apiAsistenciaPorFecha(cursoId, fecha).catch(()=>[]);
      const arr = Array.isArray(data) ? data : data || [];
      const mine = arr.find(r => Number(r.estudiante_id) === Number(user?.id) || (r.estudiante && Number(r.estudiante.id) === Number(user?.id)));
      setRecord(mine || null);
    } catch (err) {
      console.error("solicitarJustificacion:", err);
      setFeedback({ type: "error", text: err.message || "Error al enviar solicitud" });
    } finally {
      setSending(false);
    }
  }

  if (authLoading) return <div className="loading">Cargando...</div>;

  return (
    <div className="student-excuses panel-root">
      <div className="se-header">
        <div>
          <h2>Enviar Justificante / Excusa</h2>
          <p className="muted">Envía tu justificación para una ausencia. El profesor la verá y podrá aprobarla o rechazarla.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="se-form">
        <div className="form-row">
          <label>Curso</label>
          <select value={cursoId} onChange={e=>setCursoId(e.target.value)} required>
            <option value="">Selecciona curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
          </select>

          <label>Fecha de la falta</label>
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} required />
        </div>

        <label>Motivo / Justificación</label>
        <textarea value={justificacion} onChange={e=>setJustificacion(e.target.value)} rows={4} placeholder="Describe por qué faltaste..." required />

        <label>Archivo justificante (opcional)</label>
        <input type="file" accept="image/*,application/pdf" onChange={e => setArchivo(e.target.files?.[0] || null)} />
        {archivo && <div style={{ fontSize: 13, color:'#374151' }}>Archivo seleccionado: {archivo.name}</div>}

        <div className="se-footer">
          <button type="submit" disabled={sending || loadingRecord || !record}>
            {sending ? "Enviando..." : "Enviar solicitud"}
          </button>
          <button type="button" className="btn-ghost" onClick={() => { setJustificacion(""); setArchivo(""); setFeedback(null); }}>
            Limpiar
          </button>
        </div>

        {loadingRecord ? (
          <div className="info">Comprobando registro de asistencia...</div>
        ) : record ? (
          <div className="record-box">
            <div><strong>Estado actual:</strong> <span className={`badge ${record.estado || ''}`}>{record.estado}</span></div>
            <div><strong>Observaciones:</strong> {record.observaciones || '-'}</div>
            <div><strong>Justificación enviada:</strong> {record.justificacion || '—'}</div>
            <div><strong>Archivo justificante:</strong> {record.archivo_justificacion ? <a href={record.archivo_justificacion} target="_blank" rel="noreferrer">Ver</a> : '—'}</div>
          </div>
        ) : null}

        {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
      </form>
    </div>
  );
}