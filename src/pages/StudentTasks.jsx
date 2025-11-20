import React, { useEffect, useState } from "react";
import { apiTareasMias, apiEntregarTarea } from "../config/api";

export default function StudentTasks() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    apiTareasMias()
      .then(setTareas)
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  async function entregar(t) {
    try {
      await apiEntregarTarea({
        tarea_id: t.id,
        // Ajusta según tu payload real (imagen_ruta o archivo_ruta obligatorio)
        archivo_ruta: "entrega.txt"
      });
      cargar();
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <div>Cargando tareas...</div>;

  return (
    <div>
      <h2>Mis Tareas</h2>
      <ul>
        {tareas.map(t => (
          <li key={t.id}>
            <strong>{t.titulo}</strong> (vence: {t.fecha_entrega}) — {t.entregada ? "Entregada" : "Pendiente"}
            {!t.entregada && (
              <button onClick={() => entregar(t)} style={{ marginLeft: 8 }}>
                Entregar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}