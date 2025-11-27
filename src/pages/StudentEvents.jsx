/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./StudentEvents.css";
import { AuthContext } from "../context/AuthContext";
import { apiListEventos } from "../config/api";

export default function StudentEvents() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const evs = await apiListEventos(); // backend filtra por rol
        setEvents(Array.isArray(evs) ? evs : []);
      } catch (e) {
        console.error("StudentEvents apiListEventos:", e);
        setError(e.message || "Error cargando eventos");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading]);

  const filtered = events.filter(ev => !filterType || ev.tipo === filterType);

  function typeLabel(t) {
    return t === "examen" ? "Examen" : t === "reunion" ? "Reunión" : t === "festivo" ? "Festivo" : "Actividad";
  }
  function typeClass(t) {
    if (t === "examen") return "type-exam";
    if (t === "reunion") return "type-meeting";
    if (t === "festivo") return "type-holiday";
    return "type-activity";
  }

  return (
    <div className="student-events page-root">
      <div className="se-header">
        <div>
          <h2 className="title">🎉 Eventos Escolares</h2>
          <p className="subtitle">Consulta eventos generales y de tus cursos.</p>
        </div>
        <div className="se-actions">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="actividad">Actividad</option>
            <option value="examen">Examen</option>
            <option value="reunion">Reunión</option>
            <option value="festivo">Festivo</option>
          </select>
          <button className="btn" onClick={() => setFilterType(filterType)}>Refrescar</button>
        </div>
      </div>

      {loading ? (
        <div className="empty">Cargando eventos...</div>
      ) : error ? (
        <div className="empty error">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">No hay eventos.</div>
      ) : (
        <div className="events-grid">
          {filtered.map(ev => (
            <div key={ev.id} className="event-card">
              <div className={`event-type ${typeClass(ev.tipo)}`}>{typeLabel(ev.tipo)}</div>
              <h3 className="event-title">{ev.titulo}</h3>
              <p className="event-date">📅 {ev.fecha} {ev.hora_inicio ? `· 🕓 ${ev.hora_inicio}` : ""}</p>
              <p className="event-place">📍 {ev.curso?.nombre ? `Curso: ${ev.curso.nombre}` : (ev.curso_id ? `Curso ${ev.curso_id}` : "General")}</p>
              {ev.descripcion && <p className="event-desc">{ev.descripcion}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}