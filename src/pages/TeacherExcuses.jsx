import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  apiListCursos,
  apiAsistenciaPorFecha,
  apiJustificarFalta,
  apiActualizarAsistencia
} from "../config/api";
import "./TeacherExcuses.css";

export default function TeacherExcuses() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pendientes"); // pendientes | todos

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
    if (!cursoId || !fecha) return setRecords([]);
    setLoading(true);
    try {
      const data = await apiAsistenciaPorFecha(cursoId, fecha);
      let arr = Array.isArray(data) ? data : data || [];
      if (filter === "pendientes") {
        arr = arr.filter(r => r.estado === "ausente" && !r.justificacion && !r.archivo_justificacion);
      }
      setRecords(arr);
    } catch (e) {
      alert(e.message || "Error al cargar asistencias");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (!records.length) return alert("No hay registros para exportar");
    const rows = [
      ["estudiante_id", "nombre", "fecha", "estado", "hora_llegada", "observaciones", "justificacion", "archivo_justificacion"]
    ];
    records.forEach(r => {
      rows.push([
        r.estudiante_id,
        (r.estudiante && `${r.estudiante.nombre} ${r.estudiante.apellido1 || ""}`).trim(),
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
    a.download = `excusas_${cursoId}_${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function aprobar(id) {
    const just = prompt("Texto de justificación (opcional)", "Justificado por revisión del profesor");
    const archivo = prompt("URL del archivo justificante (opcional) — si subes archivo externo pega la URL", "");
    try {
      await apiJustificarFalta(id, { justificacion: just || null, archivo_justificacion: archivo || null });
      alert("Falta justificada");
      loadAsistencias();
    } catch (e) {
      alert(e.message);
    }
  }

  async function rechazar(id) {
    const obs = prompt("Motivo de rechazo (se guardará en observaciones)", "No procede justificante");
    if (obs === null) return;
    try {
      await apiActualizarAsistencia(id, { estado: "ausente", observaciones: obs || null });
      alert("Se registró rechazo");
      loadAsistencias();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="teacher-excuses">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h2 className="title">📄 Revisar Excusas</h2>
          <p className="subtitle">Gestiona justificaciones de inasistencias enviadas por estudiantes/padres.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadCSV}>Exportar CSV</button>
          <button onClick={loadAsistencias}>Cargar</button>
        </div>
      </div>

      <div className="filters" style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 12, alignItems: "center" }}>
        <select value={cursoId} onChange={e => setCursoId(e.target.value)}>
          <option value="">Selecciona curso</option>
          {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.grado}-{c.grupo})</option>)}
        </select>

        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />

        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="pendientes">Pendientes (ausentes sin justificante)</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : records.length === 0 ? (
        <div className="empty">No hay excusas según los filtros seleccionados.</div>
      ) : (
        <table className="excuses-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Fecha</th>
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
                <td>{r.estudiante ? `${r.estudiante.nombre} ${r.estudiante.apellido1 || ""}`.trim() : r.estudiante_id}</td>
                <td>{r.fecha}</td>
                <td>{r.estado}</td>
                <td>{r.hora_llegada || "-"}</td>
                <td>{r.observaciones || "-"}</td>
                <td>{r.justificacion || "-"}</td>
                <td>
                  {r.archivo_justificacion ? (
                    <a href={r.archivo_justificacion} target="_blank" rel="noreferrer">Ver/Descargar</a>
                  ) : "-"}
                </td>
                <td>
                  {(!r.justificacion && !r.archivo_justificacion) ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => aprobar(r.id)}>✅ Aprobar</button>
                      <button onClick={() => rechazar(r.id)}>❌ Rechazar</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => aprobar(r.id)}>Actualizar</button>
                      <button onClick={() => rechazar(r.id)}>Rechazar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}