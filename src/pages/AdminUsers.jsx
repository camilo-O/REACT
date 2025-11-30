/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "./AdminUsers.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:4001/api";

import { apiAdminSetPassword, apiListMatriculas, apiUpdateMatricula, apiAsignarPadre, apiAdminUpdateUser, apiPadreDeEstudiante, apiAdminDeleteUser } from "../config/api";

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

    const [editModalUser, setEditModalUser] = useState(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    segundo_nombre: '',
    apellido1: '',
    apellido2: '',
    direccion: '',
    numero_identificacion: '',
    rol: ''
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editFeedback, setEditFeedback] = useState(null);
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
  const [errors, setErrors] = useState({});
  const TEL_REGEX = /^[0-9+\-\s]{7,20}$/;
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(usuarios.length / PAGE_SIZE);
  const pagedUsuarios = usuarios.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const [pwdModalUser, setPwdModalUser] = useState(null);
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState(null);
  

  function validar(nextForm = form) {
    const e = {};
    if (!nextForm.nombre?.trim()) e.nombre = "Nombre requerido";
    if (!nextForm.apellido1?.trim()) e.apellido1 = "Apellido requerido";
    if (!nextForm.telefono?.trim()) e.telefono = "Teléfono requerido";
    else if (!TEL_REGEX.test(nextForm.telefono.trim())) e.telefono = "Teléfono inválido (10 dígitos)";
    if (!nextForm.fecha_nacimiento) e.fecha_nacimiento = "Fecha nacimiento requerida";
    else {
      const edad = calcularEdad(nextForm.fecha_nacimiento);
      if (isNaN(edad)) e.fecha_nacimiento = "Fecha inválida";
      else if (nextForm.rol === "estudiante" && (edad < 5 || edad > 18)) e.fecha_nacimiento = "Edad fuera de rango (5-18)";
    }
    if (!nextForm.direccion?.trim()) e.direccion = "Dirección requerida";
    if (!nextForm.password?.trim()) e.password = "Password requerido";
    else if (nextForm.password.length < 8) e.password = "Mínimo 8 caracteres";
    if (nextForm.numero_identificacion) {
      const ni = String(nextForm.numero_identificacion).trim();
      if (ni.length < 9) e.numero_identificacion = "Mínimo 9 caracteres";
      else if (ni.length > 12) e.numero_identificacion = "Máximo 12 caracteres";
      else if (!/^[0-9A-Za-z-]+$/.test(ni)) e.numero_identificacion = "Solo dígitos/letras/-";
    }
    setErrors(e);
    return e;
  }
    function onChangeField(k, v) {
    const next = { ...form, [k]: v };
    setForm(next);
    validar(next);
  }


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

  async function resetPassword(user) {
    // Abrir modal
    setPwdModalUser(user);
    setPwd1("");
    setPwd2("");
    setPwdFeedback(null);
  }

  async function submitPassword(e) {
    e?.preventDefault();
    setPwdFeedback(null);
    if (pwd1.length < 8) {
      setPwdFeedback({ type: "error", text: "La contraseña debe tener al menos 8 caracteres" });
      return;
    }
    if (pwd1 !== pwd2) {
      setPwdFeedback({ type: "error", text: "Las contraseñas no coinciden" });
      return;
    }
    setPwdSaving(true);
    try {
      await apiAdminSetPassword(pwdModalUser.id, pwd1);
      setPwdFeedback({ type: "success", text: "Contraseña actualizada" });
      // cerrar modal tras breve confirmación
      setTimeout(() => setPwdModalUser(null), 700);
    } catch (e) {
      setPwdFeedback({ type: "error", text: e.message || "No se pudo cambiar la contraseña" });
    } finally {
      setPwdSaving(false);
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
    const eMap = validar();
    if (Object.keys(eMap).length) {
      setFeedback({ type: "error", text: "Corrige los campos marcados" });
      return;
    }
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

    function calcularEdad(fecha) {
    if (!fecha) return NaN;
    const b = new Date(fecha);
    if (isNaN(b.getTime())) return NaN;
    const t = new Date();
    let edad = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) edad--;
    return edad;
  }

    async function editar(user) {
    setEditModalUser(user);
    setEditForm({
      nombre: user.nombre || '',
      segundo_nombre: user.segundo_nombre || '',
      apellido1: user.apellido1 || '',
      apellido2: user.apellido2 || '',
      direccion: user.direccion || '',
      numero_identificacion: user.numero_identificacion || '',
      rol: user.rol || 'estudiante'
    });
    setEditFeedback(null);
  }

  function onEditChange(k, v) {
    setEditForm(f => ({ ...f, [k]: v }));
  }

  function validarEdit() {
    const errs = {};
    if (!editForm.nombre.trim()) errs.nombre = 'Nombre requerido';
    if (!editForm.apellido1.trim()) errs.apellido1 = 'Primer apellido requerido';
    if (editForm.numero_identificacion) {
      const ni = editForm.numero_identificacion.trim();
      if (ni.length < 4 || ni.length > 12) errs.numero_identificacion = 'NI 4-12';
      else if (!/^[0-9A-Za-z-]+$/.test(ni)) errs.numero_identificacion = 'Formato NI inválido';
    }
    return errs;
  }

  async function submitEdit(e) {
    e.preventDefault();
    const errs = validarEdit();
    if (Object.keys(errs).length) {
      setEditFeedback({ type:'error', text:'Corrige los campos' });
      return;
    }
    setEditSaving(true);
    setEditFeedback(null);
    try {
      await apiAdminUpdateUser(editModalUser.id, {
        nombre: editForm.nombre.trim(),
        segundo_nombre: editForm.segundo_nombre.trim() || null,
        apellido1: editForm.apellido1.trim(),
        apellido2: editForm.apellido2.trim() || null,
        direccion: editForm.direccion.trim() || null,
        numero_identificacion: editForm.numero_identificacion.trim() || null,
        rol: editForm.rol
      });
      setEditFeedback({ type:'success', text:'Actualizado' });
      await loadUsers();
      setTimeout(()=> setEditModalUser(null), 600);
    } catch (err) {
      setEditFeedback({ type:'error', text: err.message || 'Error al guardar' });
    } finally {
      setEditSaving(false);
    }
  }

  useEffect(() => { setPage(0); }, [roleFilter, estadoFilter, query, usuarios.length]);



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
          <form onSubmit={crear} className="create-form" noValidate>
            <input
              placeholder="Nombre"
              value={form.nombre}
              onChange={e => onChangeField("nombre", e.target.value)}
            />
            {errors.nombre && <div className="field-error">{errors.nombre}</div>}
            <input
              placeholder="Apellido1"
              value={form.apellido1}
              onChange={e => onChangeField("apellido1", e.target.value)}
            />
            {errors.apellido1 && <div className="field-error">{errors.apellido1}</div>}
            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={e => onChangeField("telefono", e.target.value)}
            />
            {errors.telefono && <div className="field-error">{errors.telefono}</div>}
            <span style={{color: 'gray', fontSize: '12px'}} >Fecha de nacimiento</span>
            <input
              type="date"
              value={form.fecha_nacimiento}
              onChange={e => onChangeField("fecha_nacimiento", e.target.value)}
            />
            {errors.fecha_nacimiento && <div className="field-error">{errors.fecha_nacimiento}</div>}
            <input
              placeholder="Dirección"
              value={form.direccion}
              onChange={e => onChangeField("direccion", e.target.value)}
            />
            {errors.direccion && <div className="field-error">{errors.direccion}</div>}
            <input
              placeholder="Número identificación"
              value={form.numero_identificacion}
              onChange={e => onChangeField("numero_identificacion", e.target.value)}
            />
            {errors.numero_identificacion && <div className="field-error">{errors.numero_identificacion}</div>}
            <select value={form.rol} onChange={e => onChangeField("rol", e.target.value)}>
              <option value="admin">Admin</option>
              <option value="profesor">Profesor</option>
              <option value="estudiante">Estudiante</option>
              <option value="padre">Padre</option>
            </select>
            <input
              type="text"
              placeholder="Password"
              value={form.password}
              onChange={e => onChangeField("password", e.target.value)}
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
            <button
              type="submit"
              disabled={Object.keys(errors).length > 0}
            >
              Crear usuario
            </button>
          </form>
          {feedback && <div className={`feedback ${feedback.type}`}>{feedback.text}</div>}
        </aside>

        <main className="panel list">
          <h3>Listado ({usuarios.length})</h3>
          {loading ? <div>Cargando usuarios...</div> : (
            <>
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
                {pagedUsuarios.map(u => (
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

            {usuarios.length > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 10 }}>
                <div className="muted">Página {totalPages ? (page + 1) : 0} de {totalPages || 0}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor: page===0?'not-allowed':'pointer' }}
                  >
                    ◀ Anterior
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', cursor: (page>=totalPages-1)?'not-allowed':'pointer' }}
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
            )}
            </>

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

               {editModalUser && (
        <div className="assign-overlay">
          <div className="assign-modal">
            <div className="assign-header">
              <h3 className="assign-title">Editar usuario — {editModalUser.nombre} {editModalUser.apellido1 || ''}</h3>
              <button className="assign-close" onClick={()=>setEditModalUser(null)}>Cerrar</button>
            </div>
            <form className="assign-body" onSubmit={submitEdit}>
              <div className="assign-row">
                <label>Nombre</label>
                <input className="assign-input" value={editForm.nombre} onChange={e=>onEditChange('nombre', e.target.value)} required />
              </div>
              <div className="assign-row">
                <label>Segundo nombre</label>
                <input className="assign-input" value={editForm.segundo_nombre} onChange={e=>onEditChange('segundo_nombre', e.target.value)} />
              </div>
              <div className="assign-row">
                <label>Apellido 1</label>
                <input className="assign-input" value={editForm.apellido1} onChange={e=>onEditChange('apellido1', e.target.value)} required />
              </div>
              <div className="assign-row">
                <label>Apellido 2</label>
                <input className="assign-input" value={editForm.apellido2} onChange={e=>onEditChange('apellido2', e.target.value)} />
              </div>
              <div className="assign-row">
                <label>Dirección</label>
                <input className="assign-input" value={editForm.direccion} onChange={e=>onEditChange('direccion', e.target.value)} />
              </div>
              <div className="assign-row">
                <label>Número identificación</label>
                <input className="assign-input" value={editForm.numero_identificacion} onChange={e=>onEditChange('numero_identificacion', e.target.value)} />
              </div>
              <div className="assign-row">
                <label>Rol</label>
                <select className="assign-input" value={editForm.rol} onChange={e=>onEditChange('rol', e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="profesor">Profesor</option>
                  <option value="estudiante">Estudiante</option>
                  <option value="padre">Padre</option>
                </select>
              </div>
              {editFeedback && <div className={`assign-feedback ${editFeedback.type}`}>{editFeedback.text}</div>}
              <div className="assign-actions">
                <button type="button" className="am-ghost" onClick={()=>setEditModalUser(null)}>Cancelar</button>
                <button type="submit" className="am-primary" disabled={editSaving}>{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


            {pwdModalUser && (
        <div className="assign-overlay">
          <div className="assign-modal">
            <div className="assign-header">
              <h3 className="assign-title">Cambiar contraseña — {pwdModalUser.nombre} {pwdModalUser.apellido1 || ""}</h3>
              <button className="assign-close" onClick={() => setPwdModalUser(null)}>Cerrar</button>
            </div>
            <form className="assign-body" onSubmit={submitPassword}>
              <div className="assign-row">
                <label>Nueva contraseña</label>
                <input
                  className="assign-input"
                  type="password"
                  value={pwd1}
                  onChange={e => setPwd1(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              <div className="assign-row">
                <label>Confirmar contraseña</label>
                <input
                  className="assign-input"
                  type="password"
                  value={pwd2}
                  onChange={e => setPwd2(e.target.value)}
                  required
                />
              </div>
              {pwdFeedback && (
                <div className={`assign-feedback ${pwdFeedback.type}`}>{pwdFeedback.text}</div>
              )}
              <div className="assign-actions">
                <button type="button" className="am-ghost" onClick={() => setPwdModalUser(null)}>Cancelar</button>
                <button type="submit" className="am-primary" disabled={pwdSaving}>
                  {pwdSaving ? "Guardando..." : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          </div>
        </div>
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