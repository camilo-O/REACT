// Simple wrapper fetch
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

function getToken() {
  return localStorage.getItem('token');
}


async function request(path, { method='GET', body, auth=true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      // Logout automático si token inválido/expirado
      localStorage.removeItem('token');
      localStorage.removeItem('rol');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      throw new Error('No autorizado. Por favor inicia sesión de nuevo.');
    }
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Error'}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.error('API request error', { url, method, body, message: e.message });
    throw e;
  }
}

// Auth
export async function apiLogin(username, password) {
  const data = await request('/auth/login', { method:'POST', body:{ username, password }, auth:false });
  localStorage.setItem('token', data.token);
  localStorage.setItem('rol', data.user.rol);
  localStorage.setItem('username', data.user.username);
  localStorage.setItem('userId', data.user.id);
  return data;
}

export async function apiRegister(payload) {
  const data = await request('/auth/register', { method:'POST', body: payload, auth:false });
  localStorage.setItem('token', data.token);
  localStorage.setItem('rol', data.user.rol);
  localStorage.setItem('username', data.user.username);
  localStorage.setItem('userId', data.user.id);
  return data;
}

export function apiLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('rol');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
}

export async function apiMe() {
  return request('/auth/me');
}

// Ejemplos dominio
export async function apiMisTareas() {
  return request('/tareas/mias');
}

export async function apiCursos() {
  return request('/cursos');
}

export async function apiCrearCurso(payload) {
  return request('/cursos', { method:'POST', body: payload });
}
export async function apiListCursos() {
  return request('/cursos');
}
export async function apiCurso(id) {
  return request(`/cursos/${id}`);
}
export async function apiEditarCurso(id, payload) {
  return request(`/cursos/${id}`, { method:'PUT', body: payload });
}
export async function apiEliminarCurso(id) {
  return request(`/cursos/${id}`, { method:'DELETE' });
}
export async function apiMatricularEstudiante(cursoId, estudianteOrNumero) {
  const body =
    typeof estudianteOrNumero === "number"
      ? { estudiante_id: Number(estudianteOrNumero) }
      : { numero_identificacion: String(estudianteOrNumero).trim() };
  return request(`/cursos/${cursoId}/matricular`, { method: 'POST', body });
}
export async function apiDesmatricularEstudiante(cursoId, estudianteOrNumero) {
  const body =
    typeof estudianteOrNumero === "number"
      ? { estudiante_id: Number(estudianteOrNumero) }
      : { numero_identificacion: String(estudianteOrNumero).trim() };
  return request(`/cursos/${cursoId}/desmatricular`, { method: 'POST', body });
}

export async function apiGenerarCodigoCurso(cursoId) {
  return request(`/cursos/${cursoId}/generar-codigo`, { method:'POST' });
}
export async function apiUnirseCurso(code) {
  return request('/cursos/unirse', { method:'POST', body:{ code } });
}




// Tareas
export async function apiCrearTarea(payload) {
  return request('/tareas', { method:'POST', body: payload });
}
export async function apiTareasCurso(cursoId, materia_id) {
  const q = materia_id !== undefined ? `?materia_id=${materia_id}` : '';
  return request(`/tareas/curso/${cursoId}${q}`);
}
export async function apiTareasMias() {
  return request('/tareas/mias');
}
export async function apiTareasEstudiante(id, materia_id) {
  const q = materia_id !== undefined ? `?materia_id=${materia_id}` : '';
  return request(`/tareas/estudiante/${id}${q}`);
}
export async function apiEntregarTarea(payload, file) {
  const url = `${API_URL}/tareas/entregar`;
  const fd = new FormData();
  if (payload && payload.tarea_id) fd.append("tarea_id", String(payload.tarea_id));
  if (payload && payload.comentario) fd.append("comentario", String(payload.comentario));
  if (file) fd.append("archivo", file, file.name);
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: "POST", headers, body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || json?.message || "Error en apiEntregarTarea");
  return json;
}
export async function apiActualizarEntrega(entregaId, payload) {
  return request(`/tareas/entrega/${entregaId}`, { method:'PUT', body: payload });
}
export async function apiMisEntregas() {
  return request('/tareas/mis-entregas');
}

export async function apiMiEntregaDeTarea(tareaId) {
  const list = await request('/tareas/mis-entregas');
  if (!Array.isArray(list)) return null;
  return list.find(e =>
    Number(e.tarea_id) === Number(tareaId) ||
    Number(e.tareaId) === Number(tareaId) ||
    Number(e.tarea) === Number(tareaId) ||
    Number(e.tarea?.id) === Number(tareaId) ||
    Number(e.Tarea?.id) === Number(tareaId)
  ) || null;
}

export async function apiEntregasDeTarea(tareaId) {
  return request(`/tareas/tarea/${tareaId}/entregas`);
}

export async function apiCalificarEntrega(entregaId, payload) {
  return request(`/tareas/entrega/${entregaId}/calificar`, { method: 'POST', body: payload });
}



// Asistencia
export async function apiTomarAsistencia(payload) {
  return request('/asistencia/tomar', { method:'POST', body: payload });
}
export async function apiActualizarAsistencia(id, payload) {
  return request(`/asistencia/${id}`, { method:'PUT', body: payload });
}
export async function apiAsistenciaPorFecha(cursoId, fecha) {
  return request(`/asistencia/curso/${cursoId}/fecha/${fecha}`);
}
export async function apiHistorialAsistencia(estudianteId, params={}) {
  const q = new URLSearchParams(params).toString();
  return request(`/asistencia/estudiante/${estudianteId}/historial${q?`?${q}`:''}`);
}
export async function apiReporteCurso(cursoId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/asistencia/curso/${cursoId}/reporte${q ? `?${q}` : ''}`);
}
export async function apiJustificarFalta(id, payload) {
  return request(`/asistencia/${id}/justificar`, { method:'PUT', body: payload });
}
export async function apiConfigAsistenciaGuardar(cursoId, payload) {
  return request(`/asistencia/curso/${cursoId}/configuracion`, { method:'POST', body: payload });
}
export async function apiConfigAsistencia(cursoId) {
  return request(`/asistencia/curso/${cursoId}/configuracion`);
}
export async function apiResumenHoy() {
  return request('/asistencia/resumen/hoy');
}
export async function apiLlamadoLista(params) {
  const q = params ? `?${new URLSearchParams(params).toString()}` : '';
  return request(`/asistencia/llamado${q}`);
}

export async function apiListMatriculas(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/matriculas${q ? `?${q}` : ''}`);
}

export async function apiUpdateMatricula(id, payload) {
  return request(`/matriculas/${id}`, { method: 'PUT', body: payload });
}

// Reportes
export async function apiCrearReporteEstudiante(payload) {
  return request('/reportes/estudiante', { method:'POST', body: payload });
}
export async function apiListarReportesEstudiante(params={}) {
  const q = new URLSearchParams(params).toString();
  return request(`/reportes/estudiante${q?`?${q}`:''}`);
}

export async function apiEditarReporteEstudiante(id, payload) {
  return request(`/reportes/estudiante/${id}`, { method:'PUT', body: payload });
}



export async function apiListarReportesCurso(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/reportes/curso${q ? `?${q}` : ''}`);
}

export async function apiCrearReporteCurso(payload) {
  return request('/reportes/curso', { method:'POST', body: payload });
}

export async function apiEditarReporteCurso(id, payload) {
  return request(`/reportes/curso/${id}`, { method:'PUT', body: payload });
}

// Padres

export async function apiPadreDeEstudiante(estudianteId) {
  return request(`/padres/de-estudiante/${estudianteId}`);
}

export async function apiDesasignarPadre(payload) {
  return request('/padres/desasignar', { method:'DELETE', body: payload });
}
export async function apiCrearInvitacionPadre(payload) {
  return request('/padres/invitaciones', { method:'POST', body: payload });
}
export async function apiAceptarInvitacionPadre(payload) {
  return request('/padres/aceptar', { method:'POST', body: payload, auth:false });
}

export async function apiAsignarPadre(payload) {
  return request('/padres/asignar', { method: 'POST', body: payload });
}

export async function apiEnviarCitacion(payload) {
  return request('/citaciones', { method: 'POST', body: payload });
}

// Eventos / calendario
export async function apiListEventos(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/eventos${q ? `?${q}` : ''}`);
}
export async function apiCrearEvento(payload) {
  return request('/eventos', { method: 'POST', body: payload });
}
export async function apiEditarEvento(id, payload) {
  return request(`/eventos/${id}`, { method: 'PUT', body: payload });
}
export async function apiEliminarEvento(id) {
  return request(`/eventos/${id}`, { method: 'DELETE' });
}

export async function apiListMaterias(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/materias${q ? `?${q}` : ''}`);
}
export async function apiCrearMateria(payload) {
  return request('/materias', { method: 'POST', body: payload });
}
export async function apiEditarMateria(id, payload) {
  return request(`/materias/${id}`, { method: 'PUT', body: payload });
}
export async function apiAsignarProfesorMateria(materiaId, profesor_id) {
  return request(`/materias/${materiaId}/asignar-profesor`, { method: 'POST', body: { profesor_id } });
}
export async function apiAsignarMateriaCurso(materiaId, curso_id) {
  return request(`/materias/${materiaId}/asignar-curso`, { method: 'POST', body: { curso_id } });
}
export async function apiListProfesores(params = {}) {
  const q = new URLSearchParams({ role: 'profesor', activo: 'true', ...(params || {}) }).toString();
  return request(`/auth/admin/usuarios${q ? `?${q}` : ''}`);
}

export async function apiCancelarEvento(id) {
  return request(`/eventos/${id}/cancelar`, { method:'POST' });
}

export async function apiListCitaciones() {
  return request('/citaciones');
}

export async function apiListComunicaciones() {
  return request('/comunicaciones');
}

export async function apiEnviarComunicacion(payload) {
  return request('/comunicaciones/enviar', { method: 'POST', body: payload });
}

export async function apiListComunicacionesEnviadas(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/comunicaciones/enviadas${q ? `?${q}` : ''}`);
}

export async function apiSolicitarJustificacion(payload, file) {
  if (!file) return request('/asistencia/solicitar', { method: 'POST', body: payload });

  const url = `${API_URL}/asistencia/solicitar`;
  const fd = new FormData();
  if (payload) {
    Object.keys(payload).forEach(k => {
      if (payload[k] !== undefined && payload[k] !== null) fd.append(k, String(payload[k]));
    });
  }
  fd.append('archivo_justificacion', file, file.name);

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: fd });
  const json = await res.json().catch(()=>null);
  if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
  return json;
}

export async function apiHorarioEstudiante(estudianteId) {
  return request(`/horario/estudiante/${estudianteId}`);
}
export async function apiHorarioCurso(cursoId) {
  return request(`/horario/curso/${cursoId}`);
}

export async function apiMiHorario() {
  return request('/horario/mi');
}
export async function apiListHorarioProfesor(profesorId) {
  return request(`/horario/profesor/${profesorId}`);
}
export async function apiCrearHorario(payload) {
  return request('/horario', { method: 'POST', body: payload });
}
export async function apiEditarHorario(id, payload) {
  return request(`/horario/${id}`, { method: 'PUT', body: payload });
}
export async function apiEliminarHorario(id) {
  return request(`/horario/${id}`, { method: 'DELETE' });
}

export async function apiAdminUpdateUser(id, payload) {
  return request(`/auth/admin/usuarios/${id}`, { method: 'PUT', body: payload });
}

export async function apiAdminDeleteUser(id) {
  return request(`/auth/admin/usuarios/${id}`, { method: 'DELETE' });
}

export async function apiMisMaterias() {
  return request('/asistencia/materias/mias');
}
export async function apiAsistenciaPorMateriaFecha(materiaId, fecha) {
  return request(`/asistencia/materia/${materiaId}/fecha/${fecha}`);
}
export async function apiTomarAsistenciaMateria(payload) {
  return request('/asistencia/tomar', { method:'POST', body: payload });
}

export async function apiCrearExcusa(payload, file) {
  const token = localStorage.getItem('token');
  const url = `${API_URL}/asistencia/excusas`;
  const fd = new FormData();
  Object.entries(payload).forEach(([k,v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  if (file) fd.append('archivo_justificacion', file);
  const res = await fetch(url, { method:'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear excusa');
  return data;
}

export async function apiListExcusas(params = {}) {
  const q = new URLSearchParams(params).toString();
  return request(`/asistencia/excusas${q ? `?${q}` : ''}`);
}

export async function apiActualizarExcusaEstado(id, body) {
  return request(`/asistencia/excusas/${id}/estado`, { method:'PUT', body });
}

export async function apiRendimientoCurso(cursoId) {
  return request(`/reportes/curso/${cursoId}/rendimiento`);
}