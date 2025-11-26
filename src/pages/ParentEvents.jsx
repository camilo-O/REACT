import React, { useEffect, useState, useContext } from "react";
import "./ParentEvents.css";
import { AuthContext } from "../context/AuthContext";
import { apiListEventos } from "../config/api";

export default function ParentEvents() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        // backend ya filtra por rol: para padre devuelve generales (curso_id null) y, si decides, podrías filtrar por curso de sus hijos en el backend
        const evs = await apiListEventos();
        setEvents(Array.isArray(evs) ? evs : []);
      } catch (e) {
        console.error("apiListEventos:", e);
        setError(e.message || "Error cargando eventos");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading]);

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
    <div className="parent-events">
      <h1 className="page-title">Eventos del Colegio</h1>
      <p className="page-subtitle">Consulta los próximos eventos programados por el colegio y los profesores.</p>

      {loading ? (
        <div className="empty">Cargando eventos...</div>
      ) : error ? (
        <div className="empty error">{error}</div>
      ) : events.length === 0 ? (
        <div className="empty">No hay eventos próximos.</div>
      ) : (
        <div className="events-grid">
          {events.map(ev => (
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