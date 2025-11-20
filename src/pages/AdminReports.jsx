import React, { useEffect, useState } from "react";
import "./AdminReports.css";
import {
  apiListCursos,
  apiListarReportesCurso,
  apiCrearReporteCurso,
  apiListarReportesEstudiante,
  apiCrearReporteEstudiante
} from "../config/api";

export default function AdminReports() {
  const [tab, setTab] = useState("curso"); // 'curso' | 'estudiante'
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [reportesCurso, setReportesCurso] = useState([]);
  const [loading, setLoading] = useState(false);

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
    try {
      const data = await apiListarReportesCurso({ curso_id: id });
      setReportesCurso(data);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function crearReporteCurso(e) {
    e?.preventDefault();
    if (!formCurso.curso_id || !formCurso.nombre_curso) return alert("Curso y nombre son obligatorios");
    try {
      await apiCrearReporteCurso(formCurso);
      alert("Reporte de curso creado");
      setFormCurso({ curso_id: "", nombre_curso: "", comentario: "" });
      loadReportesCurso(formCurso.curso_id);
    } catch (e) {
      alert(e.message);
    }
  }

  async function buscarReportesEst(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const data = await apiListarReportesEstudiante({
        curso_id: filtrosEst.curso_id || undefined,
        materia_id: filtrosEst.materia_id || undefined,
        estudiante_id: filtrosEst.estudiante_id || undefined
      });
      setReportesEst(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function crearReporteEst(e) {
    e?.preventDefault();
    if (!formEst.estudiante_id || !formEst.curso_id || !formEst.materia_id) {
      return alert("estudiante_id, curso_id y materia_id son obligatorios");
    }
    try {
      await apiCrearReporteEstudiante({
        estudiante_id: Number(formEst.estudiante_id),
        curso_id: Number(formEst.curso_id),
        materia_id: Number(formEst.materia_id),
        estado_rendimiento: formEst.estado_rendimiento,
        comentario: formEst.comentario || null,
        nota: formEst.nota ? Number(formEst.nota) : null
      });
      alert("Reporte de estudiante creado");
      setFormEst({ estudiante_id: "", curso_id: "", materia_id: "", estado_rendimiento: "regular", comentario: "", nota: "" });
      buscarReportesEst();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <h2>Reportes</h2>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setTab("curso")} style={{ marginRight: 8, fontWeight: tab === "curso" ? "700" : "500" }}>
          Reportes por Curso
        </button>
        <button onClick={() => setTab("estudiante")} style={{ fontWeight: tab === "estudiante" ? "700" : "500" }}>
          Reportes de Estudiante
        </button>
      </div>

      {tab === "curso" && (
        <>
          <section style={{ marginBottom: 16 }}>
            <h3>Crear reporte de curso</h3>
            <form onSubmit={crearReporteCurso} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={formCurso.curso_id} onChange={e => setFormCurso({ ...formCurso, curso_id: e.target.value })}>
                <option value="">Selecciona curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
              </select>
              <input placeholder="Nombre del reporte" value={formCurso.nombre_curso} onChange={e => setFormCurso({ ...formCurso, nombre_curso: e.target.value })} />
              <input placeholder="Comentario (opcional)" value={formCurso.comentario} onChange={e => setFormCurso({ ...formCurso, comentario: e.target.value })} />
              <button type="submit">Crear</button>
            </form>
          </section>

          <section>
            <h3>Listar reportes por curso</h3>
            <div style={{ marginBottom: 8 }}>
              <select value={cursoId} onChange={e => { setCursoId(e.target.value); loadReportesCurso(e.target.value); }}>
                <option value="">Selecciona curso</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
              </select>
            </div>

            {loading ? <div>Cargando...</div> : (
              <ul>
                {reportesCurso.length === 0 ? <li>No hay reportes para este curso</li> :
                  reportesCurso.map(r => (
                    <li key={r.id}>
                      <strong>{r.nombre_curso}</strong> — {r.comentario || "sin comentario"} — <small>{new Date(r.updated_at || r.created_at).toLocaleString()}</small>
                    </li>
                  ))
                }
              </ul>
            )}
          </section>
        </>
      )}

      {tab === "estudiante" && (
        <>
          <section style={{ marginBottom: 16 }}>
            <h3>Buscar reportes de estudiante</h3>
            <form onSubmit={buscarReportesEst} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={filtrosEst.curso_id} onChange={e => setFiltrosEst({ ...filtrosEst, curso_id: e.target.value })}>
                <option value="">Filtrar por curso (opcional)</option>
                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input placeholder="materia_id (opcional)" value={filtrosEst.materia_id} onChange={e => setFiltrosEst({ ...filtrosEst, materia_id: e.target.value })} />
              <input placeholder="estudiante_id (opcional)" value={filtrosEst.estudiante_id} onChange={e => setFiltrosEst({ ...filtrosEst, estudiante_id: e.target.value })} />
              <button type="submit">Buscar</button>
            </form>
          </section>

          <section style={{ marginBottom: 16 }}>
            <h3>Crear reporte de estudiante</h3>
            <form onSubmit={crearReporteEst} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
              <button type="submit">Crear</button>
            </form>
          </section>

          <section>
            <h3>Resultados</h3>
            {loading ? <div>Cargando...</div> : (
              <ul>
                {reportesEst.length === 0 ? <li>No hay reportes</li> :
                  reportesEst.map(r => (
                    <li key={r.id || `${r.estudiante_id}-${r.curso_id}-${r.materia_id}`}>
                      <strong>Estudiante:</strong> {r.estudiante?.nombre ? `${r.estudiante.nombre} ${r.estudiante.apellido1}` : r.estudiante_id}
                      {" — "}
                      <strong>Curso:</strong> {r.curso?.nombre || r.curso_id}
                      {" — "}
                      <strong>Materia:</strong> {r.materia?.nombre || r.materia_id}
                      {" — "}
                      <strong>Estado:</strong> {r.estado_rendimiento} {r.nota ? `— Nota: ${r.nota}` : ""}
                      <div>{r.comentario}</div>
                    </li>
                  ))
                }
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}