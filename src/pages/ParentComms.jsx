/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./ParentComms.css";
import { AuthContext } from "../context/AuthContext";
import { apiListComunicaciones } from "../config/api";

export default function ParentComms() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await apiListComunicaciones();
        setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("apiListComunicaciones:", e);
        setError(e.message || "Error cargando comunicaciones");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading]);

  return (
    <div className="parent-comms page-root">
      <h1 className="page-title">Comunicaciones</h1>
      <p className="page-subtitle">Mensajes dirigidos a tus acudidos (padres) y avisos del colegio.</p>

      {loading ? (
        <div className="empty">Cargando comunicaciones...</div>
      ) : error ? (
        <div className="empty error">{error}</div>
      ) : messages.length === 0 ? (
        <div className="empty">No hay comunicaciones.</div>
      ) : (
        <div className="messages-list">
          {messages.map(m => {
            const estudianteId = m.estudiante_id || null;
            const remitente = m.remitente
              ? `${m.remitente.nombre} ${m.remitente.apellido1 || ''} (${m.remitente.rol || ''})`
              : 'Profesor';
            return (
              <article key={m.id} className="message-card">
                <div className="message-header">
                  <div>
                    <h3 className="subject">{m.titulo || 'Comunicado'}</h3>
                    <p className="meta"><span className="sender">{remitente}</span> · <span className="date">{new Date(m.created_at).toLocaleString()}</span></p>
                  </div>
                  <div className="meta small">{estudianteId ? `Acudiente de ID: ${estudianteId}` : ''}</div>
                </div>
                <p className="message-content">{m.mensaje}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}