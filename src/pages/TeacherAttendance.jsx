import React, { useEffect, useState } from "react";
import { apiTomarAsistencia, apiLlamadoLista } from "../config/api";

export default function TeacherAttendance() {
  const [cursoId, setCursoId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadRoster() {
    if (!cursoId || !fecha) return;
    setLoading(true);
    try {
      const res = await apiLlamadoLista({ curso_id: cursoId, fecha });
      setRoster(res.roster || []);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  }, []);

  function toggleEstado(idx, estado) {
    const copy = [...roster];
    copy[idx].estado = estado;
    setRoster(copy);
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
      await apiTomarAsistencia({ curso_id: Number(cursoId), fecha, asistencias });
      alert("Asistencia registrada");
      await loadRoster();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <h2>Tomar Asistencia</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="Curso ID" value={cursoId} onChange={e=>setCursoId(e.target.value)} />
          <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} />
          <button type="button" onClick={loadRoster} disabled={!cursoId}>Cargar lista</button>
          <button type="submit" disabled={loading}>Enviar asistencia</button>
        </div>
      </form>

      {loading ? <div>Cargando...</div> :
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado</th>
              <th>Hora</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r, i) => (
              <tr key={r.estudiante.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{r.estudiante.nombre}</td>
                <td>
                  <select value={r.estado} onChange={e=>toggleEstado(i, e.target.value)}>
                    <option value="presente">Presente</option>
                    <option value="ausente">Ausente</option>
                    <option value="tardanza">Tardanza</option>
                    <option value="justificado">Justificado</option>
                  </select>
                </td>
                <td>
                  <input value={r.hora_llegada || ""} onChange={e=>{
                    const c=[...roster]; c[i].hora_llegada = e.target.value; setRoster(c);
                  }} placeholder="HH:MM" />
                </td>
                <td>
                  <input value={r.observaciones || ""} onChange={e=>{
                    const c=[...roster]; c[i].observaciones = e.target.value; setRoster(c);
                  }} />
                </td>
              </tr>
            ))}
            {roster.length===0 && <tr><td colSpan={4}>Lista vacía. Carga la lista.</td></tr>}
          </tbody>
        </table>
      }
    </div>
  );
}