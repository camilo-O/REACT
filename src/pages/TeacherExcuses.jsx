import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiListExcusas, apiActualizarExcusaEstado } from "../config/api";
import "./TeacherExcuses.css";

export default function TeacherExcuses() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pendientes"); // pendientes | todos
  const [feedback, setFeedback] = useState(null);
  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4001/api').replace(/\/api\/?$/i, '');
  
  function buildFileUrl(path) { if (!path) return null; if (/^https?:\/\//i.test(path)) return path; const p = path.startsWith('/') ? path : `/${path}`; return `${API_BASE}${p}`; }


  useEffect(() => {
    async function loadCursos() {
      try {
        const all = await apiListCursos();
        const mine = (all || []).filter(
          c => (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id
        );
        setCursos(mine);
        if (mine.length === 1) setCursoId(String(mine[0].id));
      } catch (e) {
        console.error(e);
        setCursos([]);
      }
    }
    if (!authLoading) loadCursos();
  }, [user, authLoading]);

  async function loadAsistencias() {
    if (!cursoId) { setRecords([]); return; }
    setLoading(true); setFeedback(null);
    try {
      const params = { curso_id: Number(cursoId) };
      if (filter === 'pendientes') params.estado = 'pendiente';
      const excusas = await apiListExcusas(params);
      const list = (Array.isArray(excusas) ? excusas : []).map(ex => ({
        id: ex.id,
        estudiante_id: ex.estudiante_id,
        estudiante: ex.estudiante,                  // include para nombre/email
        fecha: `${ex.fecha_inicio} → ${ex.fecha_fin}`,
        estado: ex.estado,
        observaciones: ex.observaciones || '',
        justificacion: ex.motivo || '',
        archivo_justificacion: ex.archivo_justificacion || null,
        registrador: ex.solicitante || null,        // quien creó la excusa
        registrado_por: ex.creado_por               // id numérico
      }));
      setRecords(list);
    } catch (e) {
      setFeedback({ type:'error', text: e.message || 'Error cargando excusas' });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (!records.length) return setFeedback({ type: "error", text: "No hay registros para exportar" });
    const rows = [
      ["estudiante_id", "nombre", "numero_identificacion", "fecha", "estado", "hora_llegada", "observaciones", "justificacion", "archivo_justificacion"]
    ];
    records.forEach(r => {
      rows.push([
        r.estudiante_id,
        (r.estudiante && `${r.estudiante.nombre} ${r.estudiante.apellido1 || ""}`).trim(),
        r.estudiante?.numero_identificacion || "",
        r.fecha,
        r.estado,
        r.hora_llegada || "",
        r.observaciones || "",
        r.justificacion || "",
        r.archivo_justificacion || ""
      ]);
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `excusas_${cursoId || "curso"}_${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function aprobar(id) {
    const obs = prompt("Observaciones (opcional)", "Excusa aprobada");
    if (obs === null) return;
    try {
      await apiActualizarExcusaEstado(id, { estado: 'aprobada', observaciones: obs || undefined });
      await loadAsistencias();
      setFeedback({ type:'success', text:'Excusa aprobada' });
    } catch (e) {
      setFeedback({ type:'error', text: e.message || 'No se pudo aprobar' });
    }
  }

   async function rechazar(id) {
    const obs = prompt("Motivo de rechazo", "No procede justificante");
    if (obs === null) return;
    try {
      await apiActualizarExcusaEstado(id, { estado: 'rechazada', observaciones: obs || undefined });
      await loadAsistencias();
    } catch (e) {
      setFeedback({ type:'error', text: e.message || 'No se pudo rechazar' });
    }
  }

  return (
    <div className="teacher-excuses panel-root">
      <div className="te-header">
        <div>
          <h2 className="title">📄 Revisar Excusas</h2>
          <p className="subtitle">Gestiona justificaciones de inasistencias enviadas por estudiantes/padres.</p>
        </div>
        <div className="te-actions">
          <button className="btn" onClick={downloadCSV} disabled={records.length === 0}>Exportar CSV</button>
          <button className="btn ghost" onClick={loadAsistencias}>Cargar</button>
        </div>
      </div>

      <div className="te-filters">
        <select value={cursoId} onChange={e => setCursoId(e.target.value)}>
          <option value="">Selecciona curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>

        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />

        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="pendientes">Pendientes (ausentes sin justificante)</option>
          <option value="todos">Todos</option>
        </select>

        <div className="spacer" />

        <button className="btn primary" onClick={loadAsistencias} disabled={!cursoId}>Aplicar filtros</button>
      </div>

      {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}

      <div className="te-body">
        {loading ? (
          <div className="empty">Cargando...</div>
        ) : records.length === 0 ? (
          <div className="empty">No hay excusas según los filtros seleccionados.</div>
        ) : (
          <div className="table-wrap">
            <table className="excuses-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Nº identificación</th>
                  <th>Fecha</th>
                  <th>Presentada por</th>
                  <th>Estado</th>
                  <th>Hora</th>
                  <th>Observaciones</th>
                  <th>Justificación</th>
                  <th>Archivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="student-cell">
                      <div className="avatar">{(r.estudiante?.nombre?.[0]||'') + (r.estudiante?.apellido1?.[0]||'')}</div>
                      <div>
                        <div className="name">{r.estudiante ? `${r.estudiante.nombre} ${r.estudiante.apellido1 || ""}`.trim() : r.estudiante_id}</div>
                        <div className="muted small">{r.estudiante?.email || ""}</div>
                      </div>
                    </td>
                    <td className="mono">{r.estudiante?.numero_identificacion || "—"}</td>
                    <td>{r.fecha}</td>
                      <td className="mono">
                      {r.registrador ? `${r.registrador.nombre} ${r.registrador.apellido1 || ''} (${r.registrador.rol || '—'})` : (r.registrado_por ? `ID ${r.registrado_por}` : '—')}
                    </td>
                    <td><span className={`badge ${r.estado}`}>{r.estado}</span></td>
                    <td>{r.hora_llegada || "-"}</td>
                    <td>{r.observaciones || "-"}</td>
                    <td>{r.justificacion || "-"}</td>
                    <td>
                      {r.archivo_justificacion ? (
                        <a className="link" href={buildFileUrl(r.archivo_justificacion)} target="_blank" rel="noreferrer">Ver</a>
                      ) : "-"}
                    </td>
                    <td>
                      <div className="actions">
                        <button onClick={() => aprobar(r.id)} className="small">✅ Aprobar</button>
                        <button onClick={() => rechazar(r.id)} className="small danger">❌ Rechazar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}