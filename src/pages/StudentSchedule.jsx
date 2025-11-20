import React, { useEffect, useState, useContext } from "react";
import "./StudentSchedule.css";
import { AuthContext } from "../context/AuthContext";
import { apiHorarioEstudiante } from "../config/api";

const DIA_ORDEN = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

export default function StudentSchedule() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!user) return setSchedule([]);
        const res = await apiHorarioEstudiante(user.id);
        // espera array: [{ id, dia, hora_inicio, hora_fin, materia:{id,nombre}, curso:{id,nombre}, profesor:{id,nombre}, aula }]
        setSchedule(Array.isArray(res) ? res : []);
      } catch (e) {
        console.error("Error cargar horario:", e);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [user, authLoading]);

  // Agrupar y ordenar por día + hora
  const grouped = schedule.reduce((acc, cls) => {
    const dia = cls.dia || "Sin día";
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(cls);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(grouped).sort((a,b) => {
    const ia = DIA_ORDEN.indexOf(a);
    const ib = DIA_ORDEN.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  if (authLoading || loading) return <p className="loading">Cargando horario...</p>;

  if (schedule.length === 0) {
    return (
      <div className="student-schedule">
        <h2 className="title">🕓 Mi Horario</h2>
        <p className="subtitle">Aquí se muestra el horario semanal del estudiante.</p>
        <div className="empty-box"><p>📭 No tienes clases registradas.</p></div>
      </div>
    );
  }

  return (
    <div className="student-schedule">
      <h2 className="title">🕓 Mi Horario</h2>
      <p className="subtitle">Aquí se muestra el horario semanal del estudiante.</p>

      {diasOrdenados.map(day => (
        <div key={day} className="day-section">
          <h3 className="day-title">{day}</h3>
          <div className="schedule-grid">
            {grouped[day]
              .sort((a,b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""))
              .map(cls => (
              <div key={cls.id} className="class-card">
                <div className="class-header">
                  <h4>{cls.materia?.nombre || cls.asignatura || "Asignatura"}</h4>
                  <span className="time-tag">{(cls.hora_inicio ? cls.hora_inicio : "--")}{cls.hora_fin ? ` • ${cls.hora_fin}` : ""}</span>
                </div>
                <p className="teacher">👨‍🏫 {cls.profesor?.nombre ? `${cls.profesor.nombre} ${cls.profesor.apellido1 || ""}`.trim() : (cls.profesor_nombre || "—")}</p>
                <p className="room">🏫 {cls.aula || cls.aula_nombre || "—"}</p>
                <p className="meta">Curso: {cls.curso?.nombre || cls.curso_nombre || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}