import React, { useEffect, useState } from "react";
import "./AdminTasks.css";
import {
  apiListCursos,
  apiListMaterias,
  apiListarReportesCurso,
  apiCrearReporteCurso,
  apiListarReportesEstudiante,
  apiCrearReporteEstudiante,
  apiRendimientoCurso
} from "../config/api";

// ...existing code...
export default function AdminReports() {
  const [tab, setTab] = useState("estudiante"); // estudiante | curso
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const [rendimiento, setRendimiento] = useState(null);

  // Reportes curso
  const [reportesCurso, setReportesCurso] = useState([]);
  const [formCurso, setFormCurso] = useState({ curso_id: "", nombre_curso: "", comentario: "" });

  // Boletines (reportes estudiante)
  const [boletines, setBoletines] = useState([]);
  const [formEst, setFormEst] = useState({
    numero_identificacion: "",
    estudiante_id: "",
    curso_id: "",
    materia_id: "",
    estado_rendimiento: "regular",
    comentario: "",
    nota: ""
  });

  useEffect(() => {
    async function loadCursos() {
      try {
        const cs = await apiListCursos().catch(() => []);
        setCursos(Array.isArray(cs) ? cs : []);
      } catch { setCursos([]); }
    }
    loadCursos();
  }, []);

  useEffect(() => {
    async function loadMaterias() {
      setMaterias([]);
      if (!cursoId) return;
      try {
        const ms = await apiListMaterias({ curso_id: cursoId }).catch(() => []);
        setMaterias(Array.isArray(ms) ? ms : []);
      } catch { setMaterias([]); }
    }
    loadMaterias();
  }, [cursoId]);


  async function cargarRendimiento() {
  if (!cursoId) return setRendimiento(null);
  setLoading(true); setError(null);
  try {
    const data = await apiRendimientoCurso(Number(cursoId));
    setRendimiento(data);
  } catch (e) {
    setError(e.message || 'Error cargando rendimiento');
    setRendimiento(null);
  } finally {
    setLoading(false);
  }
}


  async function buscarEstudiantePorIdent() {
    if (!formEst.numero_identificacion.trim()) return;
    setLoading(true); setError(null);
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";
      const res = await fetch(`${API}/auth/admin/usuarios?q=${encodeURIComponent(formEst.numero_identificacion)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      const est = (Array.isArray(data) ? data : []).find(u =>
        u.numero_identificacion === formEst.numero_identificacion ||
        String(u.username).includes(formEst.numero_identificacion)
      );
      if (!est || est.rol !== 'estudiante') {
        setFormEst(prev => ({ ...prev, estudiante_id: "" }));
        return setError("Estudiante no encontrado.");
      }
      setFormEst(prev => ({ ...prev, estudiante_id: String(est.id), curso_id: prev.curso_id }));
    } catch (e) {
      setError(e.message || "Error buscando estudiante");
      setFormEst(prev => ({ ...prev, estudiante_id: "" }));
    } finally {
      setLoading(false);
    }
  }

  async function crearBoletin(e) {
    e?.preventDefault();
    setError(null);
    if (!formEst.estudiante_id) return setError("Debes buscar y validar el estudiante primero.");
    if (!formEst.curso_id || !formEst.materia_id) return setError("Curso y materia requeridos.");
    try {
      await apiCrearReporteEstudiante({
        estudiante_id: Number(formEst.estudiante_id),
        curso_id: Number(formEst.curso_id),
        materia_id: Number(formEst.materia_id),
        estado_rendimiento: formEst.estado_rendimiento || "regular",
        comentario: formEst.comentario || null,
        nota: formEst.nota !== "" ? Number(formEst.nota) : null
      });
      setFormEst({
        numero_identificacion: "",
        estudiante_id: "",
        curso_id: "",
        materia_id: "",
        estado_rendimiento: "regular",
        comentario: "",
        nota: ""
      });
      await listarBoletines();
    } catch (e) {
      setError(e.message || "Error al crear boletín");
    }
  }


  async function listarBoletines() {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (formEst.estudiante_id) params.estudiante_id = formEst.estudiante_id;
      if (cursoId) params.curso_id = cursoId;
      const rs = await apiListarReportesEstudiante(params).catch(() => []);
      // agrupar por estudiante y calcular promedio
      const map = new Map();
      (Array.isArray(rs) ? rs : []).forEach(r => {
        const key = r.estudiante?.id || r.estudiante_id;
        if (!map.has(key)) map.set(key, { estudiante: r.estudiante || { id: r.estudiante_id }, curso_id: r.curso_id, items: [], promedio: null });
        map.get(key).items.push(r);
      });
      const boletinesArr = Array.from(map.values()).map(b => {
        const notas = b.items.map(i => i.nota).filter(n => typeof n === 'number');
        const promedio = notas.length ? (notas.reduce((a,c)=>a+c,0)/notas.length).toFixed(2) : null;
        return { ...b, promedio };
      });
      setBoletines(boletinesArr);
    } catch (e) {
      setError(e.message || "Error cargando boletines");
      setBoletines([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadReportesCurso(id) {
    setLoading(true); setError(null);
    try {
      const rs = await apiListarReportesCurso({ curso_id: id }).catch(() => []);
      setReportesCurso(Array.isArray(rs) ? rs : []);
    } catch (e) {
      setError(e.message || "Error cargando reportes de curso");
      setReportesCurso([]);
    } finally {
      setLoading(false);
    }
  }

  async function crearReporteCurso(e) {
    e?.preventDefault();
    setError(null);
    if (!formCurso.curso_id || !formCurso.nombre_curso) return setError("Curso y nombre_curso son obligatorios");
    try {
      await apiCrearReporteCurso({
        curso_id: Number(formCurso.curso_id),
        nombre_curso: formCurso.nombre_curso,
        comentario: formCurso.comentario || null
      });
      setFormCurso({ curso_id: "", nombre_curso: "", comentario: "" });
      await loadReportesCurso(cursoId);
    } catch (e) {
      setError(e.message || "Error al crear reporte de curso");
    }
  }

  return (
    <div className="admin-tasks">
      <div className="tasks-header">
        <h2>Reportes / Boletines</h2>
        <p className="muted">Crea boletines por estudiante y reportes por curso. Busca por Nº de identificación y selecciona la materia.</p>
      </div>

      <div className="controls">
        <button onClick={() => setTab("estudiante")}>Boletines</button>
        <button onClick={() => setTab("curso")}>Reportes por curso</button>
      </div>

      {tab === "estudiante" ? (
        <>
          <div className="create-panel">
            <form onSubmit={crearBoletin} className="create-form">
              <input
                placeholder="Nº identificación"
                value={formEst.numero_identificacion}
                onChange={e => setFormEst({ ...formEst, numero_identificacion: e.target.value, estudiante_id: "" })}
                required
              />
              <button type="button" onClick={buscarEstudiantePorIdent}>Buscar</button>

              <select value={cursoId} onChange={e => { setCursoId(e.target.value); setFormEst(prev=>({ ...prev, curso_id: e.target.value })); }} required>
                <option value="">Curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
              </select>

              <select value={formEst.materia_id} onChange={e => setFormEst({ ...formEst, materia_id: e.target.value })} required>
                <option value="">Materia</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>

              <select value={formEst.estado_rendimiento} onChange={e => setFormEst({ ...formEst, estado_rendimiento: e.target.value })}>
                <option value="regular">Regular</option>
                <option value="bueno">Bueno</option>
                <option value="malo">Malo</option>
              </select>

              <input placeholder="Nota (0-5)" type="number" step="0.01" min="0" max="5"
                    value={formEst.nota} onChange={e => setFormEst({ ...formEst, nota: e.target.value })} />
              <input placeholder="Comentario (opcional)"
                    value={formEst.comentario} onChange={e => setFormEst({ ...formEst, comentario: e.target.value })} />

              <button type="submit" className="primary" disabled={!formEst.estudiante_id}>Crear boletín</button>
              <button type="button" onClick={listarBoletines}>Listar boletines</button>

              <div style={{ fontSize:13, color:'#6b7280' }}>
                {formEst.estudiante_id
                  ? `Estudiante ID detectado: ${formEst.estudiante_id}`
                  : 'Busca el estudiante para obtener su ID'}
              </div>
            </form>
            {error && <div className="error">{error}</div>}
          </div>

          <div className="list-panel">
            <button onClick={()=>setTab('rendimiento')}>Rendimiento Curso</button>
{tab === 'rendimiento' && (
  <div className="panel">
    <h3>Rendimiento del Curso</h3>
    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
      <select value={cursoId} onChange={e=>setCursoId(e.target.value)}>
        <option value="">Selecciona curso</option>
        {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
      </select>
      <button onClick={cargarRendimiento} disabled={!cursoId || loading}>{loading?'Cargando...':'Cargar'}</button>
    </div>
    {!rendimiento ? <div className="empty">Selecciona curso y carga.</div> : (
      <div style={{ display:'grid', gap:16 }}>
        <div className="panel">
          <strong>Promedio general:</strong> {rendimiento.promedio_general ?? '—'} · Estado: <span className={`badge ${rendimiento.estado_general}`}>{rendimiento.estado_general}</span>
        </div>
        <div className="panel">
          <h4>Estudiantes</h4>
          {rendimiento.estudiantes.length === 0 ? <div className="empty">Sin datos</div> : (
            <table className="users-table">
              <thead><tr><th>Estudiante</th><th>Promedio</th><th>Estado</th></tr></thead>
              <tbody>
                {rendimiento.estudiantes.map(e => (
                  <tr key={e.estudiante_id}>
                    <td>{e.nombre}</td>
                    <td>{e.promedio ?? '—'}</td>
                    <td><span className={`badge ${e.estado}`}>{e.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="panel">
          <h4>Materias</h4>
          {rendimiento.materias.length === 0 ? <div className="empty">Sin datos</div> : (
            <table className="users-table">
              <thead><tr><th>Materia</th><th>Promedio</th><th>Estado</th></tr></thead>
              <tbody>
                {rendimiento.materias.map(m => (
                  <tr key={m.materia_id}>
                    <td>{m.nombre}</td>
                    <td>{m.promedio ?? '—'}</td>
                    <td><span className={`badge ${m.estado}`}>{m.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )}
  </div>
)}
            <h3>Boletines</h3>
            {loading ? <div className="empty">Cargando...</div> : boletines.length === 0 ? (
              <div className="empty">No hay boletines.</div>
            ) : (
              <ul className="tasks-list">
                {boletines.map(b => (
                  <li key={b.estudiante.id} className="task-row">
                    <div className="left">
                      <div className="title">{b.estudiante.nombre} {b.estudiante.apellido1 || ""}</div>
                      <div className="meta">Curso: {cursos.find(c => Number(c.id) === Number(b.curso_id))?.nombre || b.curso_id}</div>
                      <div className="meta">Promedio: {b.promedio ?? "—"}</div>
                      <div className="meta">Materias:</div>
                      <ul style={{ marginTop:6 }}>
                        {b.items.map(i => (
                          <li key={i.id}>
                            <strong>{i.materia?.nombre || `ID ${i.materia_id}`}</strong> — Nota: {i.nota ?? "—"} — {i.estado_rendimiento} — {i.comentario || ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="right">
                      <span className="prio media">Boletín</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="controls">
            <select value={cursoId} onChange={e => { setCursoId(e.target.value); if (e.target.value) loadReportesCurso(e.target.value); }}>
              <option value="">Selecciona curso</option>
              {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button onClick={() => cursoId && loadReportesCurso(cursoId)} disabled={!cursoId}>Cargar</button>
          </div>

          <div className="create-panel">
            <form onSubmit={crearReporteCurso} className="create-form">
              <select value={formCurso.curso_id} onChange={e => setFormCurso({ ...formCurso, curso_id: e.target.value })} required>
                <option value="">Curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input placeholder="Nombre del reporte" value={formCurso.nombre_curso} onChange={e => setFormCurso({ ...formCurso, nombre_curso: e.target.value })} required />
              <input placeholder="Comentario (opcional)" value={formCurso.comentario} onChange={e => setFormCurso({ ...formCurso, comentario: e.target.value })} />
              <button type="submit" className="primary">Crear reporte curso</button>
            </form>
            {error && <div className="error">{error}</div>}
          </div>

          <div className="list-panel">
            <h3>Reportes del curso</h3>
            {loading ? <div className="empty">Cargando...</div> : reportesCurso.length === 0 ? (
              <div className="empty">No hay reportes para este curso.</div>
            ) : (
              <ul className="tasks-list">
                {reportesCurso.map(r => (
                  <li key={r.id} className="task-row">
                    <div className="left">
                      <div className="title">{r.nombre_curso}</div>
                      <div className="meta">Curso: {r.curso?.nombre || r.curso_id} • Materia: {r.materia?.nombre || (r.materia_id ? `ID ${r.materia_id}` : "General")}</div>
                      <div className="meta">{r.comentario || ""}</div>
                    </div>
                    <div className="right">
                      <span className="prio baja">Curso</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}