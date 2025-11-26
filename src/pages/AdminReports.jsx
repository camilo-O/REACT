import React, { useEffect, useState } from "react";
import {
  apiListCursos,
  apiListarReportesCurso,
  apiCrearReporteCurso,
  apiListarReportesEstudiante,
  apiCrearReporteEstudiante
} from "../config/api";
import "./AdminReports.css";

export default function AdminReports() {
  const [tab, setTab] = useState("curso"); // 'curso' | 'estudiante'
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [reportesCurso, setReportesCurso] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // formulario reporte curso
  const [formCurso, setFormCurso] = useState({ curso_id: "", nombre_curso: "", comentario: "" });

  // reportes estudiante
  const [reportesEst, setReportesEst] = useState([]);
  const [filtrosEst, setFiltrosEst] = useState({ curso_id: "", materia_id: "", estudiante_id: "" });
  const [formEst, setFormEst] = useState({
    estudiante_id: "",
    curso_id: "",
    materia_id: "",
    estado_rendimiento: "regular",
    comentario: "",
    nota: ""
  });

  useEffect(() => {
    apiListCursos().then(setCursos).catch(() => setCursos([]));
  }, []);

  async function loadReportesCurso(id) {
    if (!id) return setReportesCurso([]);
    setLoading(true);
    setError(null);
    try {
      const data = await apiListarReportesCurso({ curso_id: id });
      setReportesCurso(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Error listando reportes de curso");
      setReportesCurso([]);
    } finally {
      setLoading(false);
    }
  }

  async function crearReporteCurso(e) {
    e?.preventDefault();
    if (!formCurso.curso_id || !formCurso.nombre_curso) return alert("Curso y nombre del reporte son obligatorios");
    setLoading(true);
    try {
      await apiCrearReporteCurso({
        curso_id: Number(formCurso.curso_id),
        nombre_curso: formCurso.nombre_curso.trim(),
        comentario: formCurso.comentario || null
      });
      setFormCurso({ curso_id: "", nombre_curso: "", comentario: "" });
      if (cursoId) loadReportesCurso(cursoId);
      alert("Reporte de curso creado");
    } catch (err) {
      alert(err.message || "Error al crear reporte de curso");
    } finally {
      setLoading(false);
    }
  }

  async function buscarReportesEst(e) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filtrosEst.curso_id) params.curso_id = filtrosEst.curso_id;
      if (filtrosEst.materia_id) params.materia_id = filtrosEst.materia_id;
      if (filtrosEst.estudiante_id) params.estudiante_id = filtrosEst.estudiante_id;
      const data = await apiListarReportesEstudiante(params);
      setReportesEst(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Error buscando reportes de estudiante");
      setReportesEst([]);
    } finally {
      setLoading(false);
    }
  }

  async function crearReporteEst(e) {
    e?.preventDefault();
    if (!formEst.estudiante_id || !formEst.curso_id || !formEst.materia_id) return alert("estudiante, curso y materia son obligatorios");
    setLoading(true);
    try {
      await apiCrearReporteEstudiante({
        estudiante_id: Number(formEst.estudiante_id),
        curso_id: Number(formEst.curso_id),
        materia_id: Number(formEst.materia_id),
        estado_rendimiento: formEst.estado_rendimiento,
        comentario: formEst.comentario || null,
        nota: formEst.nota ? Number(formEst.nota) : null
      });
      setFormEst({ estudiante_id: "", curso_id: "", materia_id: "", estado_rendimiento: "regular", comentario: "", nota: "" });
      alert("Reporte de estudiante creado");
      await buscarReportesEst();
    } catch (err) {
      alert(err.message || "Error al crear reporte de estudiante");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-reports">
      <div className="top">
        <h2>Reportes</h2>
        <div className="tabs">
          <button className={tab === "curso" ? "active" : ""} onClick={() => setTab("curso")}>Reportes por Curso</button>
          <button className={tab === "estudiante" ? "active" : ""} onClick={() => setTab("estudiante")}>Reportes de Estudiante</button>
        </div>
      </div>

      {tab === "curso" && (
        <section>
          <div className="panel">
            <h3>Crear reporte de curso</h3>
            <form className="form-row" onSubmit={crearReporteCurso}>
              <select value={formCurso.curso_id} onChange={e => setFormCurso({ ...formCurso, curso_id: e.target.value })}>
                <option value="">Selecciona curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
              </select>
              <input placeholder="Nombre del reporte" value={formCurso.nombre_curso} onChange={e => setFormCurso({ ...formCurso, nombre_curso: e.target.value })} />
              <input placeholder="Comentario (opcional)" value={formCurso.comentario} onChange={e => setFormCurso({ ...formCurso, comentario: e.target.value })} />
              <button type="submit" disabled={loading}>Crear</button>
            </form>
          </div>

          <div className="panel" style={{ marginTop: 12 }}>
            <h3>Listar reportes por curso</h3>
            <div className="form-row">
              <select value={cursoId} onChange={e => { setCursoId(e.target.value); loadReportesCurso(e.target.value); }}>
                <option value="">Selecciona curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
              </select>
              <button onClick={() => loadReportesCurso(cursoId)} disabled={!cursoId}>Cargar</button>
            </div>

            {loading ? <div className="empty">Cargando...</div> : (
              reportesCurso.length === 0 ? <div className="empty">No hay reportes para este curso</div> :
                <ul className="report-list">
                  {reportesCurso.map(r => (
                    <li key={r.id} className="report-item">
                      <div className="left">
                        <div className="name">{r.nombre_curso}</div>
                        <div className="meta">{r.comentario || "sin comentario"}</div>
                      </div>
                      <div className="right">
                        <small>{new Date(r.updated_at || r.created_at).toLocaleString()}</small>
                      </div>
                    </li>
                  ))}
                </ul>
            )}
            {error && <div className="error">{error}</div>}
          </div>
        </section>
      )}

      {tab === "estudiante" && (
        <section>
          <div className="panel">
            <h3>Buscar reportes de estudiante</h3>
            <form className="form-row" onSubmit={buscarReportesEst}>
              <select value={filtrosEst.curso_id} onChange={e => setFiltrosEst({ ...filtrosEst, curso_id: e.target.value })}>
                <option value="">Filtrar por curso (opcional)</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input placeholder="materia_id" value={filtrosEst.materia_id} onChange={e => setFiltrosEst({ ...filtrosEst, materia_id: e.target.value })} />
              <input placeholder="estudiante_id" value={filtrosEst.estudiante_id} onChange={e => setFiltrosEst({ ...filtrosEst, estudiante_id: e.target.value })} />
              <button type="submit" disabled={loading}>Buscar</button>
            </form>
          </div>

          <div className="panel" style={{ marginTop: 12 }}>
            <h3>Crear reporte de estudiante</h3>
            <form className="form-row" onSubmit={crearReporteEst}>
              <input placeholder="estudiante_id" value={formEst.estudiante_id} onChange={e => setFormEst({ ...formEst, estudiante_id: e.target.value })} />
              <select value={formEst.curso_id} onChange={e => setFormEst({ ...formEst, curso_id: e.target.value })}>
                <option value="">Selecciona curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input placeholder="materia_id" value={formEst.materia_id} onChange={e => setFormEst({ ...formEst, materia_id: e.target.value })} />
              <select value={formEst.estado_rendimiento} onChange={e => setFormEst({ ...formEst, estado_rendimiento: e.target.value })}>
                <option value="regular">regular</option>
                <option value="bueno">bueno</option>
                <option value="malo">malo</option>
              </select>
              <input placeholder="nota (opcional)" value={formEst.nota} onChange={e => setFormEst({ ...formEst, nota: e.target.value })} style={{ width: 100 }} />
              <input placeholder="Comentario" value={formEst.comentario} onChange={e => setFormEst({ ...formEst, comentario: e.target.value })} />
              <button type="submit" disabled={loading}>Crear</button>
            </form>
          </div>

          <div className="panel" style={{ marginTop: 12 }}>
            <h3>Resultados</h3>
            {loading ? <div className="empty">Cargando...</div> : (
              reportesEst.length === 0 ? <div className="empty">No hay reportes</div> :
                <ul className="report-list">
                  {reportesEst.map(r => (
                    <li key={r.id || `${r.estudiante_id}-${r.curso_id}-${r.materia_id}`} className="report-item">
                      <div className="left">
                        <div><strong>{r.estudiante ? `${r.estudiante.nombre} ${r.estudiante.apellido1 || ""}` : r.estudiante_id}</strong></div>
                        <div className="meta small">{r.curso?.nombre || r.curso_id} — {r.materia?.nombre || r.materia_id}</div>
                        <div className="meta">{r.comentario || ""}</div>
                      </div>
                      <div className="right">
                        <div className="tag">{r.estado_rendimiento}{r.nota ? ` • ${r.nota}` : ""}</div>
                        <small>{new Date(r.updated_at || r.created_at || Date.now()).toLocaleString()}</small>
                      </div>
                    </li>
                  ))}
                </ul>
            )}
            {error && <div className="error">{error}</div>}
          </div>
        </section>
      )}
    </div>
  );
}
