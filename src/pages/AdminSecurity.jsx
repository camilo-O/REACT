import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export default function AdminSecurity() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
    password: "Cambio123!",
    rol: "profesor",
  });
  const [feedback, setFeedback] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/admin/usuarios`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `GET /auth/admin/usuarios → ${res.status}`);
      }
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || String(e));
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function crearUsuario(e) {
    e.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API}/auth/admin/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: "Usuario creado correctamente" });
      setForm({
        nombre: "",
        apellido1: "",
        telefono: "",
        fecha_nacimiento: "",
        direccion: "",
        password: "Cambio123!",
        rol: "profesor",
      });
      await loadUsers();
    } catch (e) {
      setFeedback({ type: "error", text: e.message || String(e) });
    }
  }

  async function toggleActivo(user) {
    setFeedback(null);
    try {
      const res = await fetch(`${API}/auth/admin/usuarios/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ activo: !user.activo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: `Usuario ${!user.activo ? "activado" : "desactivado"}` });
      loadUsers();
    } catch (e) {
      setFeedback({ type: "error", text: e.message || String(e) });
    }
  }

  async function resetPassword(user) {
    const pass = prompt(`Nuevo password para ${user.username || user.email} (vacío = cancelar)`, "Cambio123!");
    if (!pass) return;
    setFeedback(null);
    try {
      const res = await fetch(`${API}/auth/admin/usuarios/${user.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ password: pass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: "Password reseteado" });
    } catch (e) {
      setFeedback({ type: "error", text: e.message || String(e) });
    }
  }

  return (
    <div className="admin-security" style={{ maxWidth: 980 }}>
      <h2>Seguridad / Gestión de cuentas</h2>

      <section style={{ marginBottom: 12 }}>
        <h3>Crear usuario (admin)</h3>
        <form onSubmit={crearUsuario} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input required placeholder="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          <input required placeholder="Apellido1" value={form.apellido1} onChange={e => setForm({ ...form, apellido1: e.target.value })} />
          <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          <input type="date" placeholder="Fecha nacimiento" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
          <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
          <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="profesor">Profesor</option>
            <option value="estudiante">Estudiante</option>
            <option value="padre">Padre</option>
          </select>
          <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button type="submit">Crear</button>
        </form>
      </section>

      <section style={{ marginBottom: 12 }}>
        <h3>Listado de usuarios</h3>
        {loading && <div>Cargando usuarios...</div>}
        {error && <div style={{ color: "crimson" }}>No se pudo listar usuarios: {error}</div>}
        {!loading && usuarios.length === 0 && !error && <div>No hay usuarios (o la ruta GET /auth/admin/usuarios no existe)</div>}
        <ul>
          {usuarios.map(u => (
            <li key={u.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
              <div style={{ flex: 1 }}>
                <strong>{u.nombre} {u.apellido1}</strong> — <small>{u.rol}</small>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{u.email || u.username} {u.activo === false ? "(desactivado)" : ""}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => toggleActivo(u)}>{u.activo ? "Desactivar" : "Activar"}</button>
                <button onClick={() => resetPassword(u)}>Reset Password</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {feedback && <div style={{ color: feedback.type === "error" ? "crimson" : "green", marginTop: 8 }}>{feedback.text}</div>}

      
    </div>
  );
}