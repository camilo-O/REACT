/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiMisMaterias, apiAsistenciaPorMateriaFecha } from "../config/api";

export default function TeacherAttendanceDetail() {
  const { loading: authLoading } = useContext(AuthContext);
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [cursoInfo, setCursoInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    apiMisMaterias().then(ms => setMaterias(Array.isArray(ms)?ms:[])).catch(()=>setMaterias([]));
  }, [authLoading]);

  async function cargar() {
    if (!materiaId || !fecha) return;
    setLoading(true); setFeedback(null);
    try {
      const data = await apiAsistenciaPorMateriaFecha(Number(materiaId), fecha);
      setCursoInfo({ curso_id: data?.curso?.id, curso_nombre: data?.curso?.nombre, materia_nombre: data?.materia?.nombre });
      const list = (data?.roster || []).map(r => ({
        id: r.estudiante.id,
        nombre: `${r.estudiante.nombre} ${r.estudiante.apellido1 || ''}`.trim(),
        numero_identificacion: r.estudiante.numero_identificacion || '—',
        estado: r.asistencia?.estado || '—',
        hora_llegada: r.asistencia?.hora_llegada || '',
        observaciones: r.asistencia?.observaciones || ''
      }));
      setRows(list);
    } catch (e) {
      setFeedback({ type:'error', text: e.message || 'Error cargando reporte' });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!rows.length) return;
    const head = ["estudiante_id","nombre","numero_identificacion","fecha","curso","materia","estado","hora_llegada","observaciones"];
    const body = rows.map(r => [
      r.id, r.nombre, r.numero_identificacion, fecha, (cursoInfo?.curso_nombre||''), (cursoInfo?.materia_nombre||''), r.estado, r.hora_llegada||'', (r.observaciones||'').replace(/\n/g,' ')
    ]);
    const csv = [head, ...body].map(line => line.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asistencia_detalle_materia_${materiaId}_${fecha}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="teacher-excuses panel-root">
      <div className="te-header">
        <div>
          <h2 className="title">📋 Reporte detallado de asistencia</h2>
          <p className="subtitle">Lista de estudiantes por materia y fecha con su estado.</p>
        </div>
        <div className="te-actions">
          <button className="btn primary" onClick={cargar} disabled={!materiaId || loading}>{loading?'Cargando...':'Generar'}</button>
          <button className="btn" onClick={exportCSV} disabled={!rows.length}>Exportar CSV</button>
        </div>
      </div>

      <div className="te-filters">
        <select value={materiaId} onChange={e=>setMateriaId(e.target.value)}>
          <option value="">Selecciona materia</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} {m.curso ? `— ${m.curso.nombre}` : ''}</option>)}
        </select>
        <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
        {cursoInfo && <div className="spacer" />}
        {cursoInfo && <div>Curso: <strong>{cursoInfo.curso_nombre}</strong> · Materia: <strong>{cursoInfo.materia_nombre}</strong></div>}
      </div>

      {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}

      {!materiaId ? <div className="empty">Selecciona materia y fecha.</div> : (
        rows.length === 0 ? <div className="empty">Sin registros para esa fecha.</div> : (
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
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.nombre}</td>
                    <td className="mono">{r.numero_identificacion}</td>
                    <td><span className={`badge ${r.estado}`}>{r.estado}</span></td>
                    <td>{r.hora_llegada || '—'}</td>
                    <td>{r.observaciones || '—'}</td>
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