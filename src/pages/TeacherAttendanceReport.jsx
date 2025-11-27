/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiListMaterias, apiReporteCurso } from "../config/api";

export default function TeacherAttendanceReport() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [desde, setDesde] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().slice(0,10));
  const [hasta, setHasta] = useState(new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    apiListCursos().then(all => {
      const mine = (all || []).filter(c => (c.profesor?.id === user?.id) || c.profesor_id === user?.id);
      setCursos(mine);
      if (mine.length === 1) setCursoId(String(mine[0].id));
    }).catch(()=>setCursos([]));
  }, [authLoading, user]);

  useEffect(() => {
    setMaterias([]);
    setMateriaId("");
    if (!cursoId) return;
    apiListMaterias({ curso_id: cursoId }).then(ms => setMaterias(Array.isArray(ms)?ms:[])).catch(()=>setMaterias([]));
  }, [cursoId]);

  async function cargar() {
    if (!cursoId) return;
    setLoading(true); setError(null);
    try {
      const params = { desde, hasta };
      if (materiaId) params.materia_id = materiaId;
      const data = await apiReporteCurso(Number(cursoId), params);
      setReporte(data || null);
    } catch (e) {
      setError(e.message || "Error cargando reporte");
      setReporte(null);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!reporte?.resumenDias?.length) return;
    const rows = [["fecha","presentes","ausentes","tardanzas","justificados","total"]];
    reporte.resumenDias.forEach(d => rows.push([d.fecha,d.presentes,d.ausentes,d.tardanzas,d.justificados,d.total]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_asistencia_curso_${cursoId}_${desde}_${hasta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="teacher-excuses panel-root">
      <div className="te-header">
        <div>
          <h2 className="title">📊 Reportes de Asistencia</h2>
          <p className="subtitle">Resumen por día con filtros por rango y materia.</p>
        </div>
        <div className="te-actions">
          <button className="btn primary" onClick={cargar} disabled={!cursoId || loading}>{loading?'Cargando...':'Generar'}</button>
          <button className="btn" onClick={exportCSV} disabled={!reporte?.resumenDias?.length}>Exportar CSV</button>
        </div>
      </div>

      <div className="te-filters">
        <select value={cursoId} onChange={e=>setCursoId(e.target.value)}>
          <option value="">Selecciona curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>
        <select value={materiaId} onChange={e=>setMateriaId(e.target.value)}>
          <option value="">Todas las materias</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
        <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} />
        <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} />
      </div>

      {error && <div className="feedback error">{error}</div>}

      {!reporte ? <div className="empty">Genera un reporte para ver resultados.</div> : (
        <div className="table-wrap">
          <table className="excuses-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Presentes</th>
                <th>Ausentes</th>
                <th>Tardanzas</th>
                <th>Justificados</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(reporte.resumenDias||[]).map(r => (
                <tr key={r.fecha}>
                  <td>{r.fecha}</td>
                  <td>{r.presentes}</td>
                  <td>{r.ausentes}</td>
                  <td>{r.tardanzas}</td>
                  <td>{r.justificados}</td>
                  <td>{r.total}</td>
                </tr>
              ))}
              {(reporte.resumenDias||[]).length===0 && <tr><td colSpan={6} className="empty">Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}