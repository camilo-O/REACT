/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { apiMiHorario } from "../config/api";
import "./TeacherSchedule.css";

export default function TeacherSchedule() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiMiHorario();
        setSchedule(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("Error cargando horario:", e);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading]);

  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const grouped = dias.map(d => ({ dia: d, items: schedule.filter(s => (s.dia || '').toLowerCase() === d.toLowerCase()) }));

  if (authLoading || loading) return <div>Cargando horario...</div>;

  return (
    <div className="teacher-schedule">
      <h2 className="title">Mi Horario</h2>
      <p className="subtitle">Consulta tus clases asignadas por día, hora y curso correspondiente.</p>

      {grouped.map(g => (
        <div key={g.dia} className="day-section">
          <h3>{g.dia}</h3>
          {g.items.length === 0 ? <div className="empty">Sin clases</div> : (
            <div className="schedule-grid">
              {g.items.map(item => (
                <div key={item.id} className="class-card">
                  <div className="class-header">
                    <h4>{item.materia?.nombre || item.asignatura || "Asignatura"}</h4>
                    <span className="time-tag">{item.hora_inicio} • {item.hora_fin}</span>
                  </div>
                  <p className="teacher">Curso: {item.curso?.nombre || (item.curso_id ? `ID ${item.curso_id}` : "—")}</p>
                  <p className="room">Aula: {item.aula || item.sala || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}