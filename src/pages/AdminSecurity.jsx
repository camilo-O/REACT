import React, { useEffect, useState } from "react";
import "./AdminUsers.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

export default function AdminSecurity() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
    password: "Cambio123!",
    rol: "profesor"
  });
  const [feedback, setFeedback] = useState(null);

  async function loadUsers(q = "") {
    setLoading(true);
    setFeedback(null);
    try {
      const url = `${API}/auth/admin/usuarios${q ? `?q=${encodeURIComponent(q)}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("loadUsers:", e.message);
      setUsuarios([]);
      setFeedback({ type: "error", text: "No se pudo cargar usuarios" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function crearUsuario(e) {
    e?.preventDefault();
    setFeedback(null);
    try {
      const res = await fetch(`${API}/auth/admin/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: "Usuario creado correctamente" });
      setForm({ nombre: "", apellido1: "", telefono: "", fecha_nacimiento: "", direccion: "", password: "Cambio123!", rol: "profesor" });
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ activo: !user.activo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: `Usuario ${!user.activo ? "activado" : "desactivado"}` });
      await loadUsers();
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ password: pass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: "Password reseteado" });
    } catch (e) {
      setFeedback({ type: "error", text: e.message || String(e) });
    }
  }

  async function editar(user) {
    const nombre = prompt("Nombre completo", user.nombre);
    if (nombre === null) return;
    setFeedback(null);
    try {
      const res = await fetch(`${API}/auth/admin/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ nombre })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: "Usuario actualizado" });
      await loadUsers();
    } catch (e) {
      setFeedback({ type: "error", text: e.message || String(e) });
    }
  }



  return (
    <div className="admin-users">
      <header className="header">
        <div>
          <h2>Seguridad / Usuarios</h2>
          <p className="subtitle">Controles de acceso: creación, activación, reset de contraseña y gestión de sesiones.</p>
        </div>

        <div className="actions">
          <input placeholder="Buscar por nombre, email o username" value={query} onChange={e=>setQuery(e.target.value)} />
          <button onClick={()=>loadUsers(query)}>Buscar</button>
        </div>
      </header>

      <section className="layout">
        <aside className="panel create">
          <h3>Crear usuario</h3>
          <form onSubmit={crearUsuario} className="create-form">
            <input placeholder="Nombre" required value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} />
            <input placeholder="Apellido1" required value={form.apellido1} onChange={e=>setForm({...form,apellido1:e.target.value})} />
            <input placeholder="Teléfono" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})} />
            <input type="date" placeholder="Fecha Nac." value={form.fecha_nacimiento} onChange={e=>setForm({...form,fecha_nacimiento:e.target.value})} />
            <input placeholder="Dirección" value={form.direccion} onChange={e=>setForm({...form,direccion:e.target.value})} />
            <select value={form.rol} onChange={e=>setForm({...form,rol:e.target.value})}>
              <option value="admin">Admin</option>
              <option value="profesor">Profesor</option>
              <option value="estudiante">Estudiante</option>
              <option value="padre">Padre</option>
            </select>
            <input type="text" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
            <button type="submit">Crear usuario</button>
          </form>
          {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
        </aside>

        <main className="panel list">
          <h3>Listado ({usuarios.length})</h3>
          {loading ? <div>Cargando usuarios...</div> : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Email / Username</th>
                  <th>Estado</th>
                  <th style={{ width: 260 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td>{u.nombre} {u.apellido1 || ""}</td>
                    <td>{u.rol}</td>
                    <td><div className="muted">{u.email || u.username}</div></td>
                    <td>{u.activo === false ? <span className="badge inactive">Desactivado</span> : <span className="badge active">Activo</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={()=>editar(u)}>Editar</button>
                        <button onClick={()=>toggleActivo(u)}>{u.activo ? "Desactivar" : "Activar"}</button>
                        <button onClick={()=>resetPassword(u)}>Reset Pass</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && <tr><td colSpan={5} className="empty">No hay usuarios.</td></tr>}
              </tbody>
            </table>
          )}
        </main>
      </section>
    </div>
  );
}