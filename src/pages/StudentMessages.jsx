/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import "./StudentMessages.css";
import { MessageSquare } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { apiListComunicaciones } from "../config/api";

const MessageCard = ({ title, message, sender, time }) => (
  <div className="message-card">
    <h2>{title}</h2>
    <p className="msg">{message}</p>
    <div className="meta">
      <span className="sender">{sender}</span>
      <span className="time">{time}</span>
    </div>
  </div>
);

export default function StudentMessages() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await apiListComunicaciones();
        const list = Array.isArray(data) ? data : [];
        // normalizar remitente y fecha
        const normalized = list.map(m => {
          const sender = m.remitente
            ? `${m.remitente.nombre} ${m.remitente.apellido1 || ''}`.trim()
            : 'Profesor';
          const time = m.created_at ? new Date(m.created_at).toLocaleString() : '';
          return {
            id: m.id,
            title: m.titulo || 'Comunicado',
            message: m.mensaje || '',
            sender,
            time
          };
        });
        setMessages(normalized);
      } catch (e) {
        console.error("StudentMessages apiListComunicaciones:", e);
        setError(e.message || "Error cargando mensajes");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading]);

  return (
    <div className="student-messages-page">
      <header className="messages-header">
        <MessageSquare className="icon" />
        <h1>Mensajes</h1>
      </header>

      <p className="subtitle">
        Comunicado de profesores y coordinación dirigido a tu cuenta.
      </p>

      {loading ? (
        <div className="empty">Cargando mensajes...</div>
      ) : error ? (
        <div className="empty error">{error}</div>
      ) : messages.length === 0 ? (
        <div className="empty">No hay mensajes.</div>
      ) : (
        <div className="messages-grid">
          {messages.map(msg => (
            <MessageCard
              key={msg.id}
              title={msg.title}
              message={msg.message}
              sender={msg.sender}
              time={msg.time}
            />
          ))}
        </div>
      )}
    </div>
  );
}