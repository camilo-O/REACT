import { useState } from "react";
import {apiLogin, apiRegister} from '../config/api'

const ROLES = [
  { value: "student", label: "🎓 Estudiante" },
  { value: "teacher", label: "👨‍🏫 Profesor" },
  { value: "parent", label: "👨‍👩‍👧‍👦 Padre de familia" },
  { value: "admin", label: "👔 Administrativo" },
];

const SUBJECTS = [
  "Matemáticas",
  "Español",
  "Ciencias Naturales",
  "Ciencias Sociales",
  "Inglés",
  "Educación Física",
  "Tecnología",
  "Artes",
  "Ética y Valores",
  "Religión",
  "Filosofía",
  "Química",
  "Física",
  "Biología",
];

export default function AuthForm({ mode, onLogin, onSuccess }) {
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");  
  const [pass, setPass] = useState("");
  const [nombre, setNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [apellido1, setApellido1] = useState("");
  const [apellido2, setApellido2] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [direccion, setDireccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);


  // 🔸 Registro o inicio de sesión
 const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (isRegister) {
        const reg = await apiRegister({
          nombre,
          segundo_nombre: segundoNombre || null,
          apellido1,
          apellido2: apellido2 || null,
          telefono,
          fecha_nacimiento: fechaNacimiento,
          direccion,
          password: pass
        });
        setMsg({ type: 'success', text: 'Registro exitoso' });
        onSuccess && onSuccess(reg.user.rol);
      } else {
        const login = await apiLogin(username, pass);
        onLogin ? onLogin(username, pass) : onSuccess && onSuccess(login.user.rol);
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isRegister && (
        <div>
          <label>Usuario</label>
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </div>
      )}

      {isRegister && (
        <>
          <div>
            <label>Nombre</label>
            <input value={nombre} onChange={e=>setNombre(e.target.value)} required />
          </div>
          <div>
            <label>Segundo Nombre (opcional)</label>
            <input value={segundoNombre} onChange={e=>setSegundoNombre(e.target.value)} />
          </div>
          <div>
            <label>Apellido 1</label>
            <input value={apellido1} onChange={e=>setApellido1(e.target.value)} required />
          </div>
            <div>
            <label>Apellido 2 (opcional)</label>
            <input value={apellido2} onChange={e=>setApellido2(e.target.value)} />
          </div>
          <div>
            <label>Teléfono</label>
            <input value={telefono} onChange={e=>setTelefono(e.target.value)} required />
          </div>
          <div>
            <label>Fecha nacimiento</label>
            <input type="date" value={fechaNacimiento} onChange={e=>setFechaNacimiento(e.target.value)} required />
          </div>
          <div>
            <label>Dirección</label>
            <input value={direccion} onChange={e=>setDireccion(e.target.value)} required />
          </div>
        </>
      )}

      <div>
        <label>Contraseña</label>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} minLength={6} required />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Iniciar sesión'}
      </button>

      {msg && <div className={msg.type === 'success' ? 'ok' : 'error'}>{msg.text}</div>}
    </form>
  );
}
