import React from "react";
import "./ParentHome.css";

export default function ParentHome() {
  const metrics = [
    { title: "Tareas Asignadas", value: 8, subtitle: "+2 esta semana", color: "#2563eb" },
    { title: "Completadas", value: 5, subtitle: "62.5% de progreso", color: "#10b981" },
    { title: "Pendientes", value: 3, subtitle: "1 vence pronto", color: "#f59e0b" },
    { title: "Asistencia", value: "92%", subtitle: "Excelente", color: "#22c55e" },
  ];

  const activities = [
    {
      title: "Nueva tarea de Matemáticas",
      desc: "Tapa 5 Álgebra: pág. 45 (vence mañana)",
      teacher: "Profesor Carlos - 7°A",
    },
    {
      title: "Calificación actualizada",
      desc: "Ensayo de Literatura: 4.5 / 5.0",
      teacher: "Lengua Castellana",
    },
    {
      title: "Excusa médica aprobada",
      desc: "Reposo 3 días por fiebre alta.",
      teacher: "Coordinación Académica",
    },
  ];

  return (
    <div className="parent-dashboard">
      <h1 className="page-title">Director del panel</h1>
      <p className="page-subtitle">
        Seguimiento académico de <strong>andres oliuba</strong>.
      </p>

      {/* Métricas */}
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div key={i} className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: m.color }}>
              <span>{m.value}</span>
            </div>
            <div className="metric-info">
              <h3>{m.title}</h3>
              <p>{m.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actividades recientes */}
      <div className="recent-activities">
        <div className="activities-header">
          <h2>Actividades recientes</h2>
          <button>Ver todas</button>
        </div>

        <div className="activity-list">
          {activities.map((a, i) => (
            <div key={i} className="activity-card">
              <div className="activity-icon">📘</div>
              <div className="activity-details">
                <h4>{a.title}</h4>
                <p>{a.desc}</p>
                <span className="activity-teacher">{a.teacher}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


