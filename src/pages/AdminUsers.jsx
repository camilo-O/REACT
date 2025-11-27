/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "./AdminUsers.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

import { apiListMatriculas, apiUpdateMatricula, apiAsignarPadre, apiAdminUpdateUser, apiPadreDeEstudiante, apiAdminDeleteUser } from "../config/api";

export default function AdminUsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const [roleFilter, setRoleFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    telefono: "",
    fecha_nacimiento: "",
    direccion: "",
    numero_identificacion: "",
    password: "Cambio123!",
    rol: "profesor"
  });
  const [feedback, setFeedback] = useState(null);

  // Matriculas panel
  const [showMatriculasFor, setShowMatriculasFor] = useState(null);
  const [matriculas, setMatriculas] = useState([]);
  const [matLoading, setMatLoading] = useState(false);

    // Asignar estudiante a padre (modal)
  const [assignModalFor, setAssignModalFor] = useState(null);
  const [assignIdent, setAssignIdent] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState(null);
    const [assignReplace, setAssignReplace] = useState(false);

      const [viewParentFor, setViewParentFor] = useState(null);
  const [parentInfo, setParentInfo] = useState(null);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentError, setParentError] = useState(null);


  async function openAssignModal(user) {
    setAssignModalFor(user);
    setAssignIdent("");
    setAssignFeedback(null);
  }

    async function submitUnassign(e) {
    e?.preventDefault();
    if (!assignModalFor?.id || !assignIdent.trim()) return;
    setAssignLoading(true);
    setAssignFeedback(null);
    try {
      const res = await fetch(`${API}/padres/desasignar`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ padre_id: assignModalFor.id, estudiante_numero_identificacion: assignIdent.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo desasignar");
      setAssignFeedback({ type: "success", text: data.message || "Desasignado" });
    } catch (e) {
      setAssignFeedback({ type: "error", text: e.message });
    } finally {
      setAssignLoading(false);
    }
  }


    async function openParentModal(user) {
    setViewParentFor(user);
    setParentInfo(null);
    setParentError(null);
    if (user.rol !== 'estudiante') { setParentError('Solo estudiantes'); return; }
    setParentLoading(true);
    try {
      const data = await apiPadreDeEstudiante(user.id);
      setParentInfo(data?.padre || null);
    } catch (e) {
      setParentError(e.message || 'Error cargando padre');
    } finally {
      setParentLoading(false);
    }
  }


  async function submitAssign(e) {
    e?.preventDefault();
    setAssignFeedback(null);
    setAssignLoading(true);
    try {
      const res = await fetch(`${API}/padres/asignar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          padre_id: assignModalFor.id,
          estudiante_numero_identificacion: assignIdent.trim(),
          reemplazar: assignReplace
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al asignar");
      setAssignFeedback({ type: "success", text: data.message || "Asignado" });
    } catch (e) {
      setAssignFeedback({ type: "error", text: e.message });
    } finally {
      setAssignLoading(false);
    }
  }

  async function toggleActivo(user) {
  setFeedback(null);
  try {
    await apiAdminUpdateUser(user.id, { activo: !user.activo });
    setFeedback({ type: 'success', text: `Usuario ${!user.activo ? 'activado' : 'desactivado'}` });
    await loadUsers();
  } catch (e) {
    console.error("toggleActivo error:", e);
    setFeedback({ type: 'error', text: e.message || "Error cambiando estado" });
  }
}

  async function loadUsers() {
    setLoading(true);
    setFeedback(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (roleFilter) params.set("role", roleFilter);
      if (estadoFilter) params.set("activo", estadoFilter);
      const url = `${API}/auth/admin/usuarios${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("Listado usuarios no disponible:", e.message);
      setUsuarios([]);
      setFeedback({ type: "error", text: "No se pudo cargar usuarios" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []); // eslint-disable-line

  async function crear(e) {
    e.preventDefault();
    setFeedback(null);
    try {
      const url = `${API}/auth/admin/usuarios`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setFeedback({ type: "success", text: "Usuario creado" });
      setForm({ nombre: "", apellido1: "", telefono: "", fecha_nacimiento: "", direccion: "", numero_identificacion: "", password: "Cambio123!", rol: "profesor" });
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
    } catch (e) { setFeedback({ type: "error", text: e.message || String(e) }); }
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
    } catch (e) { setFeedback({ type: "error", text: e.message || String(e) }); }
  }

  // Matriculas panel handlers
  async function openMatriculas(user) {
    setShowMatriculasFor(user);
    setMatLoading(true);
    try {
      const list = await apiListMatriculas({ estudiante_id: user.id });
      setMatriculas(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("error matriculas:", e);
      setMatriculas([]);
    } finally {
      setMatLoading(false);
    }
  }

  async function toggleMatricula(m) {
    const nuevo = m.estado === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`Cambiar estado a ${nuevo} ?`)) return;
    try {
      await apiUpdateMatricula(m.id, { estado: nuevo });
      // refrescar lista
      await openMatriculas(showMatriculasFor);
      await loadUsers();
    } catch (e) {
      alert(e.message || "Error al actualizar matrícula");
    }
  }

  return (
    <div className="admin-users">
      <header className="header">
        <div>
          <h2>Usuarios — Administración</h2>
          <p className="subtitle">Gestión de cuentas: crear, activar/desactivar y revisar matrículas.</p>
        </div>

        <div className="actions">
          <input placeholder="Buscar por nombre, email, username o identificación" value={query} onChange={e => setQuery(e.target.value)} />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Todos roles</option>
            <option value="admin">Admin</option>
            <option value="profesor">Profesor</option>
            <option value="estudiante">Estudiante</option>
            <option value="padre">Padre</option>
          </select>
          <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
            <option value="">Todos estados</option>
            <option value="true">Activo</option>
            <option value="false">Desactivado</option>
          </select>
          <button onClick={loadUsers}>Buscar</button>
        </div>
      </header>

      <section className="layout">
        <aside className="panel create">
          <h3>Crear usuario</h3>
          <form onSubmit={crear} className="create-form">
            <input placeholder="Nombre" required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <input placeholder="Apellido1" required value={form.apellido1} onChange={e => setForm({ ...form, apellido1: e.target.value })} />
            <input placeholder="Nº identificación" value={form.numero_identificacion} onChange={e=>setForm({...form, numero_identificacion:e.target.value})} />            
            <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
            <input type="date" placeholder="Fecha Nac." value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} />
            <input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="profesor">Profesor</option>
              <option value="estudiante">Estudiante</option>
              <option value="padre">Padre</option>
            </select>
            <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
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
                  <th>Nº identificación</th>
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
                   <td className="mono">{u.numero_identificacion || "—"}</td>
                    <td>{u.activo === false ? <span className="badge inactive">Desactivado</span> : <span className="badge active">Activo</span>}</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => editar(u)}>Editar</button>
                        <button onClick={() => toggleActivo(u)}>{u.activo ? "Desactivar" : "Activar"}</button>
                        <button onClick={() => resetPassword(u)}>Reset Pass</button>

                        <button
                          onClick={async () => {
                            if (!confirm(`Eliminar usuario ${u.nombre} (${u.username})?`)) return;
                            try { await apiAdminDeleteUser(u.id); await loadUsers(); }
                            catch(e){ alert(e.message || "Error al eliminar"); }
                          }}
                          style={{ color:'#b91c1c', borderColor:'#fee2e2' }}
                        >
                          Eliminar
                        </button>

                        {u.rol === 'estudiante' && (
                          <button onClick={() => openParentModal(u)}>Ver padre</button>
                        )}

                        {u.rol === 'estudiante' && (
                          <button onClick={() => openMatriculas(u)}>Matriculas</button>
                        )}                          
                        {u.rol === 'padre' && (
                          <button onClick={() => openAssignModal(u)} disabled={u.rol !== "padre"}>
                            Asignar estudiante
                          </button>                        
                        )}      

                        </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && <tr><td colSpan={6} className="empty">No hay usuarios coincidentes.</td></tr>}
              </tbody>
            </table>
          )}
        </main>
      </section>

{assignModalFor && (
  <div className="assign-overlay" onClick={() => setAssignModalFor(null)}>
    <div className="assign-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <div className="assign-header">
        <h3 className="assign-title">
          Asignar estudiante a: {assignModalFor.nombre} {assignModalFor.apellido1 || ""} (ID {assignModalFor.id})
        </h3>
        <button className="assign-close" onClick={() => setAssignModalFor(null)}>Cerrar</button>
      </div>

      <div className="assign-body">
        <div className="assign-row">
          <label>Nº identificación del estudiante</label>
          <input
            className="assign-input"
            placeholder="Ej: 1020xxxxxx"
            value={assignIdent}
            onChange={e => setAssignIdent(e.target.value)}
          />
        </div>

        <div className="assign-row assign-check">
          <input
            id="assignReplace"
            type="checkbox"
            checked={assignReplace}
            onChange={e => setAssignReplace(e.target.checked)}
          />
          <label htmlFor="assignReplace">Reemplazar padre si el estudiante ya tiene uno asignado</label>
        </div>

        {assignFeedback && (
          <div className={`assign-feedback ${assignFeedback.type}`}>{assignFeedback.text}</div>
        )}
      </div>

      <div className="assign-actions">
        <button className="am-btn am-ghost" onClick={() => setAssignModalFor(null)}>Cancelar</button>
        <button className="am-btn am-danger" onClick={submitUnassign} disabled={assignLoading || !assignIdent}>
          {assignLoading ? "Procesando..." : "Desasignar"}
        </button>
        <button className="am-btn am-primary" onClick={submitAssign} disabled={assignLoading || !assignIdent}>
          {assignLoading ? "Asignando..." : "Asignar"}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Panel lateral de matrículas */}
      {showMatriculasFor && (
        <aside className="panel" style={{ position: "fixed", right: 18, top: 90, width: 420, zIndex: 60 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>Matrículas — {showMatriculasFor.nombre} {showMatriculasFor.apellido1 || ""}</h4>
            <button onClick={() => { setShowMatriculasFor(null); setMatriculas([]); }}>Cerrar</button>
          </div>

          {matLoading ? <div>Cargando...</div> : (
            matriculas.length === 0 ? <div className="empty">Sin matrículas</div> :
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {matriculas.map(m => (
                  <li key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: 10, borderBottom: "1px solid #f3f6fb" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.curso?.nombre || `Curso ${m.curso_id}`}</div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>{m.fecha_matricula} • {m.estado}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => toggleMatricula(m)}>{m.estado === "activo" ? "Desactivar" : "Activar"}</button>
                    </div>
                  </li>
                ))}
              </ul>
          )}
        </aside>
      )}

        {viewParentFor && (
    <div className="assign-overlay" onClick={() => setViewParentFor(null)}>
      <div className="assign-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="assign-header">
          <h3 className="assign-title">Padre asignado — Est. {viewParentFor.nombre} {viewParentFor.apellido1 || ''} (ID {viewParentFor.id})</h3>
          <button className="assign-close" onClick={() => setViewParentFor(null)}>Cerrar</button>
        </div>
        <div className="assign-body">
          {parentLoading ? <div className="assign-feedback info">Cargando...</div> :
           parentError ? <div className="assign-feedback error">{parentError}</div> :
           !parentInfo ? <div className="assign-feedback error">Sin padre asignado</div> : (
            <>
              <div className="assign-row"><label>Nombre</label><div className="assign-input" style={{border:'none'}}>{`${parentInfo.nombre} ${parentInfo.segundo_nombre || ''} ${parentInfo.apellido1 || ''} ${parentInfo.apellido2 || ''}`.trim()}</div></div>
              <div className="assign-row"><label>Email</label><div className="assign-input" style={{border:'none'}}>{parentInfo.email || '—'}</div></div>
              <div className="assign-row"><label>Teléfono</label><div className="assign-input" style={{border:'none'}}>{parentInfo.telefono || '—'}</div></div>
              <div className="assign-row"><label>Dirección</label><div className="assign-input" style={{border:'none'}}>{parentInfo.direccion || '—'}</div></div>
              <div className="assign-row"><label>Nº identificación</label><div className="assign-input" style={{border:'none'}}>{parentInfo.numero_identificacion || '—'}</div></div>
              <div className="assign-row"><label>Estado</label><div className="assign-input" style={{border:'none'}}>{parentInfo.activo ? 'Activo' : 'Desactivado'}</div></div>
            </>
           )}
        </div>
        <div className="assign-actions">
          <button className="am-btn am-ghost" onClick={() => setViewParentFor(null)}>Cerrar</button>
        </div>
      </div>
    </div>
  )}
    </div>
  );
}