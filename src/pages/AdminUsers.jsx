/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { apiLogout } from "../config/api";

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({
    nombre: "", apellido1: "", telefono: "", fecha_nacimiento: "", direccion: "", password: "Cambio123!",
    rol: "profesor"
  });
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      // backend no tiene GET /api/auth/admin/usuarios por defecto -> usamos /api/auth/me solo como placeholder
      // si necesitas listar todos los usuarios añade ruta GET /api/auth/admin/usuarios en backend.
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4001/api"}/auth/admin/usuarios`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('No soportado: crea GET /api/auth/admin/usuarios en backend');
      const data = await res.json();
      setUsuarios(data);
    } catch (e) {
      console.warn('Listado usuarios no disponible:', e.message);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ loadUsers(); }, []);

  async function crear(e) {
    e.preventDefault();
    try {
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:4001/api"}/auth/admin/usuarios`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error crear usuario');
      alert('Usuario creado');
      loadUsers();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <h2>Usuarios (Admin)</h2>

      <form onSubmit={crear} style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
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
        <button type="submit">Crear</button>
      </form>

      {loading ? <div>Cargando...</div> : (
        <ul>
          {usuarios.length===0 ? <li>No hay listado disponible (agrega GET /api/auth/admin/usuarios en backend)</li> :
            usuarios.map(u => <li key={u.id}>{u.nombre} {u.apellido1} — {u.rol}</li>)
          }
        </ul>
      )}
    </div>
  );
}