import { useState } from 'react'
import '../App.css'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Usuario = {
    id: string
    nombre: string
    email: string
    passwordHash: string
    salt: string
    saldo: number
}

const CLAVE_USUARIO = 'caracoles_usuario'
const CLAVE_SESION = 'caracoles_sesion'

function EyeIcon({ visible }: { visible: boolean }) {
    if (visible) {
        return (
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                <circle cx="12" cy="12" r="2.5" />
            </svg>
        )
    }

    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.1 18.1 0 0 1-3.2 4.1" />
            <path d="M6.2 6.2A18.3 18.3 0 0 0 2 12s3.5 7 10 7a10.8 10.8 0 0 0 3.1-.5" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
    )
}

async function crearHash(texto: string): Promise<string> {
    const datos = new TextEncoder().encode(texto)
    const resultado = await crypto.subtle.digest('SHA-256', datos)

    return Array.from(new Uint8Array(resultado))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
}

function App() {
    const navigate = useNavigate()

    const [pestana, setPestana] = useState<'login' | 'registro'>('login')
    const [mensajeRegistro, setMsgRegistro] = useState('')
    const [verPasswordLogin, setVerPasswordLogin] = useState(false)
    const [verPasswordRegistro, setVerPasswordRegistro] = useState(false)
    const [verConfirmacion, setVerConfirmacion] = useState(false)

    const [mensajeLogin, setMsgLogin] = useState('')

    async function registrarUsuario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const datos = new FormData(event.currentTarget)

        const nombre = String(datos.get('nombre') ?? '').trim()
        const email = String(datos.get('email') ?? '').trim().toLowerCase()
        const password = String(datos.get('password') ?? '')
        const confirmacion = String(datos.get('confirmacion') ?? '')

        const usuarioGuardado = localStorage.getItem('caracoles_usuario')

        if (usuarioGuardado) {
            const usuarioExistente = JSON.parse(usuarioGuardado)

            if (usuarioExistente.email === email) {
                setMsgRegistro('Ya existe una cuenta con este correo.')
            } else {
                setMsgRegistro(
                    'Esta demostración permite registrar una sola cuenta local.',
                )
            }

            return
        }


        if (!nombre || !email || !password || !confirmacion) {
            setMsgRegistro('Completa todos los campos.')
            return
        }

        const nombreValido = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(nombre)

        if (!nombreValido) {
            setMsgRegistro(
                'El nombre solo puede contener letras, espacios y letras con acento.',
            )
            return
        }

        if (password.length < 8) {
            setMsgRegistro('La contraseña debe tener al menos 8 caracteres.')
            return
        }

        if (password !== confirmacion) {
            setMsgRegistro('Las contraseñas no coinciden.')
            return
        }

        const usuarioExistente = localStorage.getItem(CLAVE_USUARIO)

        if (usuarioExistente) {
            setMsgRegistro(
                'Ya existe una cuenta registrada en este navegador. Inicia sesión.',
            )
            return
        }

        const salt = crypto.randomUUID()
        const passwordHash = await crearHash(`${salt}:${password}`)

        const usuario: Usuario = {
            id: crypto.randomUUID(),
            nombre,
            email,
            passwordHash,
            salt,
            saldo: 0,
        }

        localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
        setMsgRegistro('Cuenta creada correctamente. Ahora puedes iniciar sesión.')
        event.currentTarget.reset()
        setPestana('login')
    }

    async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const datos = new FormData(event.currentTarget)

        const email = String(datos.get('email') ?? '').trim().toLowerCase()
        const password = String(datos.get('password') ?? '')

        const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO)

        if (!usuarioGuardado) {
            setMsgLogin('No existe una cuenta registrada en este navegador.')
            return
        }

        const usuario: Usuario = JSON.parse(usuarioGuardado)

        if (usuario.email !== email) {
            setMsgLogin('El correo o la contraseña son incorrectos.')
            return
        }

        const passwordHash = await crearHash(`${usuario.salt}:${password}`)

        if (usuario.passwordHash !== passwordHash) {
            setMsgLogin('El correo o la contraseña son incorrectos.')
            return
        }

        localStorage.setItem(
            CLAVE_SESION,
            JSON.stringify({ usuarioId: usuario.id }),
        )

        navigate('/dashboard')
    }


    return (
        <main className="auth-container">
            {/* <h1>Carreras de caracoles</h1> */}

            <div className="auth-panel">
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={pestana === 'login' ? 'tab active' : 'tab'}
                        onClick={() => setPestana('login')}
                        aria-pressed={pestana === 'login'}
                    >
                        Iniciar sesión
                    </button>

                    <button
                        type="button"
                        className={pestana === 'registro' ? 'tab active' : 'tab'}
                        onClick={() => setPestana('registro')}
                        aria-pressed={pestana === 'registro'}
                    >
                        Registrarse
                    </button>
                </div>

                <div className="auth-content">
                    {pestana === 'login' ? (
                        <form
                            key="login"
                            className="auth-form"
                            onSubmit={iniciarSesion}
                        >
                            <h2>Bienvenido</h2>

                            <div className="form-field">
                                <label htmlFor="login-email">Correo electrónico</label>
                                <input
                                    id="login-email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="login-password">Contraseña</label>

                                <div className="password-input">
                                    <input
                                        id="login-password"
                                        name="password"
                                        type={verPasswordLogin ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        className="password-toggle"
                                        type="button"
                                        onClick={() => setVerPasswordLogin(!verPasswordLogin)}
                                        aria-label={
                                            verPasswordLogin ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                        }
                                    >
                                        <EyeIcon visible={verPasswordLogin} />
                                    </button>
                                </div>
                            </div>

                            {mensajeLogin && (
                                <p role="status">{mensajeLogin}</p>
                            )}

                            <button className="submit-button" type="submit">
                                Iniciar sesión
                            </button>
                        </form>
                    ) : (
                        <form
                            key="registro"
                            className="auth-form"
                            onSubmit={registrarUsuario}
                        >
                            <h2>Crea tu cuenta</h2>
                            <p>Completa tus datos para registrarte.</p>

                            <div className="form-field">
                                <label htmlFor="registro-nombre">Nombre completo</label>
                                <input
                                    id="registro-nombre"
                                    name="nombre"
                                    type="text"
                                    autoComplete="name"
                                    pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+"
                                    title="Usa solo letras y espacios."
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="registro-email">Correo electrónico</label>
                                <input
                                    id="registro-email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    placeholder="correo@ejemplo.com"
                                    required
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="registro-password">Contraseña</label>

                                <div className="password-input">
                                    <input
                                        id="registro-password"
                                        name="password"
                                        type={verPasswordRegistro ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        minLength={8}
                                        aria-describedby="password-help"
                                        required
                                    />

                                    <button
                                        className="password-toggle"
                                        type="button"
                                        onClick={() => setVerPasswordRegistro(!verPasswordRegistro)}
                                        aria-label={
                                            verPasswordRegistro ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                        }
                                    >
                                        <EyeIcon visible={verPasswordRegistro} />
                                    </button>
                                </div>

                                <small id="password-help">Usa al menos 8 caracteres.</small>
                            </div>

                            <div className="form-field">
                                <label htmlFor="registro-confirmacion">
                                    Confirmar contraseña
                                </label>

                                <div className="password-input">
                                    <input
                                        id="registro-confirmacion"
                                        name="confirmacion"
                                        type={verConfirmacion ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />

                                    <button
                                        className="password-toggle"
                                        type="button"
                                        onClick={() => setVerConfirmacion(!verConfirmacion)}
                                        aria-label={
                                            verConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'
                                        }
                                    >
                                        <EyeIcon visible={verConfirmacion} />
                                    </button>
                                </div>
                            </div>

                            {mensajeRegistro && (
                                <p role="status">{mensajeRegistro}</p>
                            )}

                            <button className="submit-button" type="submit">
                                Crear cuenta
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    )
}

export default App