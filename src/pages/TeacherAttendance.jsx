/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiMisMaterias, apiAsistenciaPorMateriaFecha, apiTomarAsistenciaMateria } from "../config/api";

export default function TeacherAttendance() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [roster, setRoster] = useState([]);
  const [cursoInfo, setCursoInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    apiMisMaterias().then(ms => setMaterias(Array.isArray(ms) ? ms : [])).catch(()=>setMaterias([]));
  }, [authLoading]);

  useEffect(() => {
    async function load() {
      setRoster([]);
      setCursoInfo(null);
      setFeedback(null);
      if (!materiaId || !fecha) return;
      try {
        const data = await apiAsistenciaPorMateriaFecha(Number(materiaId), fecha);
        setCursoInfo({ curso_id: data?.curso?.id, curso_nombre: data?.curso?.nombre });
        const list = (data?.roster || []).map(r => ({
          id: r.estudiante.id,
          nombre: `${r.estudiante.nombre} ${r.estudiante.apellido1 || ''}`.trim(),
          numero_identificacion: r.estudiante.numero_identificacion || '—',
          estado: r.asistencia?.estado || 'presente',
          hora_llegada: r.asistencia?.hora_llegada || '',
          observaciones: r.asistencia?.observaciones || ''
        }));
        setRoster(list);
      } catch (e) {
        setFeedback({ type:'error', text: e.message || 'Error cargando roster' });
      }
    }
    load();
  }, [materiaId, fecha]);

  async function guardar() {
    if (!materiaId || !fecha || !cursoInfo?.curso_id) return;
    setSaving(true); setFeedback(null);
    try {
      await apiTomarAsistenciaMateria({
        curso_id: Number(cursoInfo.curso_id),
        materia_id: Number(materiaId),
        fecha,
        asistencias: roster.map(r => ({
          estudiante_id: r.id,
          estado: r.estado,
          hora_llegada: r.hora_llegada || null,
          observaciones: r.observaciones || null
        }))
      });
      setFeedback({ type:'success', text:'Asistencia guardada' });
    } catch (e) {
      setFeedback({ type:'error', text: e.message || 'No se pudo guardar' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="teacher-excuses panel-root">
      <div className="te-header">
        <div>
          <h2 className="title">📝 Tomar asistencia por materia</h2>
          <p className="subtitle">Registro diario por materia asignada.</p>
        </div>
        <div className="te-actions">
          <button className="btn primary" onClick={guardar} disabled={!materiaId || saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button className="btn ghost" onClick={() => { if (materiaId) setMateriaId(String(materiaId)); }}>Refrescar</button>
          <button className="btn" onClick={() => window.location.href='/teacher/attendance-report'}>Ver reportes</button>
          <button className="btn" onClick={() => window.location.href='/teacher/attendance-detail'}>Reporte detallado</button>
        </div>
      </div>

      <div className="te-filters">
        <select value={materiaId} onChange={e => setMateriaId(e.target.value)}>
          <option value="">Selecciona materia</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} {m.curso ? `— ${m.curso.nombre}` : ''}</option>)}
        </select>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
        {cursoInfo && <div className="spacer" />}
        {cursoInfo && <div>Curso: <strong>{cursoInfo.curso_nombre}</strong></div>}
      </div>

      {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}

      {!materiaId ? <div className="empty">Selecciona una materia.</div> : (
        roster.length === 0 ? <div className="empty">Sin estudiantes.</div> : (
          <div className="table-wrap">
            <table className="excuses-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Nº identificación</th>
                  <th>Estado</th>
                  <th>Hora</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r, i) => (
                  <tr key={r.id}>
                    <td>{r.nombre}</td>
                    <td className="mono">{r.numero_identificacion}</td>
                    <td>
                      <select value={r.estado} onChange={e => {
                        const v = e.target.value;
                        setRoster(prev => prev.map((x,idx) => idx===i ? { ...x, estado: v } : x));
                      }}>
                        <option value="presente">Presente</option>
                        <option value="ausente">Ausente</option>
                        <option value="tardanza">Tardanza</option>
                        <option value="justificado">Justificado</option>
                      </select>
                    </td>
                    <td><input type="time" value={r.hora_llegada || ''} onChange={e => setRoster(prev => prev.map((x,idx)=> idx===i ? { ...x, hora_llegada:e.target.value } : x))} /></td>
                    <td><input value={r.observaciones || ''} onChange={e => setRoster(prev => prev.map((x,idx)=> idx===i ? { ...x, observaciones:e.target.value } : x))} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}