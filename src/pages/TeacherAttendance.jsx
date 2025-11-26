/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiListCursos, apiLlamadoLista, apiAsistenciaPorFecha, apiTomarAsistencia } from "../config/api";
import "./TeacherAttendance.css";

export default function TeacherAttendance() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCursos() {
      try {
        const all = await apiListCursos();
        const my = (all || []).filter(c => (c.profesor && c.profesor.id === user?.id) || c.profesor_id === user?.id);
        setCursos(my);
        if (my.length === 1 && !cursoId) setCursoId(String(my[0].id));
      } catch (e) {
        console.error("loadCursos:", e);
        setCursos([]);
      }
    }
    if (!authLoading) loadCursos();
  }, [user, authLoading]);

  // carga el roster / registros de asistencia usando el endpoint por fecha
  async function loadRoster() {
    if (!cursoId || !fecha) {
      setRoster([]);
      return;
    }
    setLoading(true);
    try {
      // usa el endpoint por fecha (más fiable que el "llamado" si quieres registros ya guardados)
      const res = await apiAsistenciaPorFecha(Number(cursoId), fecha);
      // res debe ser array de Asistencia con include estudiante
      const list = Array.isArray(res) ? res : (res?.asistencias || []);
      const normalized = (list || []).map(item => {
        const estudiante = item.estudiante || {
          id: item.estudiante_id,
          nombre: item.nombre || "",
          apellido1: item.apellido1 || "",
          numero_identificacion: item.numero_identificacion || ""
        };
        return {
          id: item.id || `${estudiante.id}-${fecha}`,
          estudiante: {
            id: estudiante.id,
            nombre: estudiante.nombre || "",
            apellido1: estudiante.apellido1 || "",
            numero_identificacion: estudiante.numero_identificacion || ""
          },
          estado: item.estado || "presente",
          hora_llegada: item.hora_llegada || "",
          observaciones: item.observaciones || ""
        };
      });
      setRoster(normalized);
    } catch (e) {
      console.error("loadRoster:", e);
      setRoster([]);
      alert(e.message || "Error al cargar lista de asistencia");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(index, changes) {
    const copy = [...roster];
    copy[index] = { ...copy[index], ...changes };
    setRoster(copy);
  }

  function toggleEstado(idx, estado) {
    updateRow(idx, { estado });
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!cursoId || !fecha) return alert("Seleccione curso y fecha");
    const asistencias = roster.map(r => ({
      estudiante_id: r.estudiante.id,
      estado: r.estado || "presente",
      hora_llegada: r.hora_llegada || null,
      observaciones: r.observaciones || null
    }));
    try {
      setSaving(true);
      await apiTomarAsistencia({ curso_id: Number(cursoId), fecha, asistencias });
      alert("Asistencia registrada");
      await loadRoster();
    } catch (e) {
      console.error("handleSubmit:", e);
      alert(e.message || "Error al registrar asistencia");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) return <div className="ta-loading">Cargando...</div>;

  return (
    <div className="teacher-attendance panel-root">
      <header className="ta-header">
        <h2>Tomar Asistencia</h2>
        <p className="muted">Selecciona curso, fecha, edita estados y envía.</p>
      </header>

      <form onSubmit={handleSubmit} className="ta-form" onReset={() => { setRoster([]); }}>
        <div className="ta-filters">
          <select value={cursoId} onChange={e => setCursoId(e.target.value)}>
            <option value="">Selecciona curso</option>
            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
          </select>

          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />

          <button type="button" className="btn" onClick={loadRoster} disabled={!cursoId || loading}>Cargar lista</button>
          <button type="submit" className="btn primary" disabled={saving || roster.length === 0}>Enviar asistencia</button>
        </div>

        <div className="ta-body">
          {loading ? <div className="empty">Cargando lista...</div> : (
            <div className="ta-table-wrap">
              <table className="ta-table">
                <thead>
                  <tr>
                    <th>Alumno</th>
                    <th>Nº identificación</th>
                    <th>Estado</th>
                    <th>Hora llegada</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 && <tr><td colSpan={5} className="empty">Lista vacía. Presiona "Cargar lista".</td></tr>}
                  {roster.map((r, i) => (
                    <tr key={r.id}>
                      <td className="student-cell">
                        <div className="avatar">{(r.estudiante.nombre?.[0]||'') + (r.estudiante.apellido1?.[0]||'')}</div>
                        <div>
                          <div className="name">{r.estudiante.nombre} {r.estudiante.apellido1 || ""}</div>
                        </div>
                      </td>
                      <td className="mono">{r.estudiante.numero_identificacion || "—"}</td>
                      <td>
                        <select value={r.estado} onChange={e => toggleEstado(i, e.target.value)}>
                          <option value="presente">Presente</option>
                          <option value="ausente">Ausente</option>
                          <option value="tardanza">Tardanza</option>
                          <option value="justificado">Justificado</option>
                        </select>
                      </td>
                      <td>
                        <input type="time" value={r.hora_llegada || ""} onChange={e => updateRow(i, { hora_llegada: e.target.value })} />
                      </td>
                      <td>
                        <input value={r.observaciones || ""} onChange={e => updateRow(i, { observaciones: e.target.value })} placeholder="Observaciones..." />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}