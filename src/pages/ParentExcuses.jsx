/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./ParentExcuses.css";
import { AuthContext } from "../context/AuthContext";
import { apiListMatriculas, apiHistorialAsistencia, apiSolicitarJustificacion, apiCrearExcusa, apiListExcusas } from "../config/api";

export default function ParentExcuses() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [children, setChildren] = useState([]); 
  const [selectedChild, setSelectedChild] = useState("");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [motivo, setMotivo] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [excuses, setExcuses] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0,10));

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4001/api').replace(/\/api\/?$/i, '');
  function buildFileUrl(path) { if (!path) return null; if (/^https?:\/\//i.test(path)) return path; const p = path.startsWith('/') ? path : `/${path}`; return `${API_BASE}${p}`; }

  useEffect(() => {
    async function loadChildren() {
      try {
        const mats = await apiListMatriculas().catch(() => []);
        const map = new Map();
        (Array.isArray(mats) ? mats : []).forEach(m => {
          const est = m.estudiante || (m.estudiante_id ? { id: m.estudiante_id, nombre: m.estudiante_nombre, apellido1: m.estudiante_apellido1 } : null);
          const curso = m.curso || (m.curso_id ? { id: m.curso_id, nombre: m.curso_nombre || `Curso ${m.curso_id}` } : null);
          if (!est || !est.id) return;
          const id = Number(est.id);
          if (!map.has(id)) map.set(id, { id, nombre: `${est.nombre || ''} ${est.apellido1 || ''}`.trim() || `Alumno ${id}`, cursos: [] });
          const entry = map.get(id);
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
        setChildren([]);
      }
    }
    if (!authLoading) loadChildren();
  }, [authLoading]);

  useEffect(() => {
    const kid = children.find(k => Number(k.id) === Number(selectedChild));
    const cursos = kid?.cursos || [];
    setCourses(cursos);
    if (cursos.length > 0 && !selectedCourse) setSelectedCourse(String(cursos[0].id));
    loadExcuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild, children]);

  useEffect(() => { loadExcuses(); /* eslint-disable-next-line */ }, [selectedCourse]);

  async function loadExcuses() {
    if (!selectedChild) return setExcuses([]);
    setLoadingList(true);
    setFeedback(null);
    try {
      const params = { estudiante_id: Number(selectedChild) };
      if (selectedCourse) params.curso_id = Number(selectedCourse);
      const data = await apiListExcusas(params);
      const arr = Array.isArray(data) ? data : [];
      const filtered = arr.sort((a,b) => String(b.created_at||'').localeCompare(String(a.created_at||'')));
       
      // ordenar por fecha desc
      filtered.sort((a,b) => (b.fecha || "").localeCompare(a.fecha || "") || (b.updated_at||"").localeCompare(a.updated_at||""));
      // normalizar URL y estructura
      const normalized = filtered.map(r => ({
        ...r,
        archivo_url: buildFileUrl(r.archivo_justificacion || r.archivo || ''),
        estado_normal: r.estado || null
      }));
      setExcuses(normalized);
    } catch (e) {
      console.error("loadExcuses:", e);
      setExcuses([]);
      setFeedback({ type: "error", text: e.message || "Error cargando excusas" });
    } finally {
      setLoadingList(false);
    }
  }

async function handleSubmit(e) {
  e?.preventDefault();
  if (!selectedChild || !selectedCourse) return;
  if (!fecha || !motivo) return;
  setLoading(true);
  setFeedback(null);
  try {
    const payload = {
      estudiante_id: Number(selectedChild),
      curso_id: Number(selectedCourse),
      fecha_inicio: fecha,
      fecha_fin: fechaFin || fecha,
      motivo
    };
    await apiCrearExcusa(payload, file);
    setFeedback({ type: "success", text: "Excusa registrada. Pendiente de revisión." });
    setMotivo("");
    setFile(null);
    await loadExcuses();
  } catch (err) {
    setFeedback({ type: "error", text: err.message || "Error al crear excusa" });
  } finally {
    setLoading(false);
  }
}

  function getStatusLabel(r) {
    if (r.estado_normal === 'justificado') return { text: 'Aprobada', cls: 'status-approved' };
    if (r.justificacion || r.archivo_justificacion || r.registrado_por) return { text: 'Pendiente revisión', cls: 'status-pending' };
    if (r.estado_normal === 'ausente') return { text: 'Ausente', cls: 'status-absent' };
    return { text: r.estado_normal || '—', cls: '' };
  }

  if (authLoading) return <div className="loading">Cargando...</div>;

  return (
    <div className="parent-excuses page-root">
      <h2>Excusas / Justificantes</h2>
      <p className="muted">Envía y consulta las excusas médicas del/los hijos asociados.</p>

      <div className="pe-controls">
        <label>Hijo</label>
        <select value={selectedChild || ""} onChange={e => setSelectedChild(Number(e.target.value))}>
          <option value="">— Selecciona hijo —</option>
          {children.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        <label>Curso</label>
        <select value={selectedCourse || ""} onChange={e => setSelectedCourse(e.target.value)}>
          <option value="">— Selecciona curso —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        <button className="btn" onClick={loadExcuses}>Refrescar</button>
      </div>

      <form className="pe-form" onSubmit={handleSubmit}>
        <div className="row">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          <label>Hasta</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                </div>

        <div className="row">
          <label>Motivo</label>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Describe la razón..." />
        </div>

        <div className="row">
          <label>Archivo justificante (opcional)</label>
          <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
          {file && <div className="file-note">Seleccionado: {file.name}</div>}
        </div>

        <div className="actions">
          <button type="submit" disabled={loading}>{loading ? "Enviando..." : "Enviar excusa"}</button>
          <button type="button" className="ghost" onClick={() => { setMotivo(""); setFile(null); setFeedback(null); }}>Limpiar</button>
        </div>

        {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
      </form>

      <hr />

      <h3>Historial de excusas</h3>
      {loadingList ? <div className="empty">Cargando...</div> : excuses.length === 0 ? (
        <div className="empty">No hay excusas enviadas para el periodo/curso seleccionado.</div>
      ) : (
        <table className="pe-table">
          <thead>
            <tr>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Estado</th>
              <th>Motivo</th>
              <th>Archivo</th>
              <th>Profesor/Obs</th>
            </tr>
          </thead>
          <tbody>
            {excuses.map(ex => (
              <tr key={ex.id}>
                <td>{ex.fecha_inicio}</td>
                <td>{ex.fecha_fin}</td>
                <td><span className={`badge ${ex.estado === 'aprobada' ? 'justificado' : ex.estado === 'rechazada' ? 'ausente' : 'tardanza'}`}>{ex.estado}</span></td>
                <td style={{ maxWidth: 320 }}>{ex.motivo}</td>
                <td>{ex.archivo_justificacion ? <a href={buildFileUrl(ex.archivo_justificacion)} target="_blank" rel="noreferrer">Ver</a> : '-'}</td>
                <td className="muted">{ex.observaciones || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}