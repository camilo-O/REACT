/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from "react";
import "./ParentAppointments.css";
import { AuthContext } from "../context/AuthContext";
import { apiListCitaciones } from "../config/api";

export default function ParentAppointments() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [citaciones, setCitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await apiListCitaciones();
        setCitaciones(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("load citaciones:", e);
        setError(e.message || "Error cargando citaciones");
        setCitaciones([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading]);
  
   function parseDados(d) {
    if (!d) return null;
    if (typeof d === 'string') {
      try { return JSON.parse(d); } catch { return null; }
    }
    return d;
  }

  function formatCitationDate(datosRaw) {
    const datos = parseDados(datosRaw);
    if (!datos) return '—';
    const dateField = datos.fecha || datos.fecha_citacion || datos.datetime || null;
    const timeField = datos.hora || (typeof datos.datetime === 'string' && datos.datetime.includes('T') ? datos.datetime.split('T')[1] : null);

    try {
      let dt = null;
      if (dateField && timeField) {
        const iso = `${dateField}T${timeField}`.replace(' ', 'T');
        dt = new Date(iso);
      } else if (dateField) {
        dt = new Date(`${dateField}T12:00:00`);
      } else if (timeField) {
        return timeField;
      }
      if (!dt || isNaN(dt.getTime())) return `${dateField || '-'}${timeField ? ` • ${timeField}` : ''}`;
      return dt.toLocaleString();
    } catch (e) {
      return `${dateField || '-'}${timeField ? ` • ${timeField}` : ''}`;
    }
  }

    function formatCitationDateRow(c) {
    const f = c.fecha_citacion, h = c.hora_citacion;
    if (!f && !h) return '—';
    try {
      if (f && h) return new Date(`${f}T${h}`).toLocaleString();
      if (f) return new Date(`${f}T12:00:00`).toLocaleDateString();
      return h;
    } catch { return `${f || ''}${h ? ` • ${h}` : ''}`; }
  }

  function renderMeta(datosRaw) {
    const datos = parseDados(datosRaw);
    if (!datos) return null;
    const parts = [];
    if (datos.curso_id) parts.push(`Curso: ${datos.curso_id}`);
    if (datos.estudiante_id) parts.push(`Estudiante ID: ${datos.estudiante_id}`);
    if (datos.fecha || datos.hora) parts.push(`${datos.fecha || ''}${datos.hora ? ` • ${datos.hora}` : ''}`.trim());
    return parts.join(" • ");
  }

    function getCreatedAtValue(c) {
    // aceptar varias claves posibles que pueda devolver el backend
    const raw = c?.created_at ?? c?.createdAt ?? c?.createdAtLocal ?? c?.created;
    if (!raw) return '—';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toLocaleString();
      return String(raw);
    } catch {
      return String(raw);
    }
  }

  return (
    <div className="parent-appointments page-root">
      <h1 className="page-title">Solicitudes de Citas</h1>
      <p className="page-subtitle">Aquí verás las citaciones y avisos relacionados con tus acudidos.</p>

      {loading ? (
        <div className="empty">Cargando citaciones...</div>
      ) : error ? (
        <div className="empty error">{error}</div>
      ) : citaciones.length === 0 ? (
        <div className="empty">No hay citaciones registradas para tu cuenta.</div>
      ) : (
        <div className="appointment-list">
          <table className="appointments-table">
            <thead>
              <tr>
                <th>Fecha envío</th>
                <th>Fecha citación</th>
                <th>Título</th>
                <th>Mensaje</th>
                <th>Metadatos</th>
              </tr>
            </thead>
            <tbody>
              {citaciones.map(c => (
                <tr key={c.id}>
                  <td className="mono">{getCreatedAtValue(c)}</td>
                  <td className="mono">{formatCitationDateRow(c)}</td>
                  <td>{c.titulo}</td>
                  <td style={{ maxWidth: 420 }}>{c.mensaje}</td>
                   <td className="muted small">
                     {[
                       c.curso_id ? `Curso: ${c.curso_id}` : null,
                       c.estudiante_id ? `Estudiante ID: ${c.estudiante_id}` : null,
                       c.location ? `Lugar: ${c.location}` : null
                     ].filter(Boolean).join(' • ')}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}