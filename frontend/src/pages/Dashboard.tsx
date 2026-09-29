import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import '../App.css'

import RechargeModal from '../components/RechargeModal'

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

const datosApuestas = [
    { nombre: 'Ganadas', cantidad: 8 },
    { nombre: 'Perdidas', cantidad: 4 },
]

const datosCaracoles = [
    { nombre: 'Caracol1', victorias: 2 },
    { nombre: 'Caracol2', victorias: 1 },
    { nombre: 'Caracol3', victorias: 1 },
    { nombre: 'Caracol4', victorias: 1 },
    { nombre: 'Caracol5', victorias: 1 },
    { nombre: 'Caracol6', victorias: 0 },
]

const coloresApuestas = ['#b8cbea', '#344154']

function obtenerUsuarioActivo(): Usuario | null {
    try {
        const sesionGuardada = localStorage.getItem(CLAVE_SESION)
        const usuarioGuardado = localStorage.getItem(CLAVE_USUARIO)

        if (!sesionGuardada || !usuarioGuardado) {
            return null
        }

        const sesion = JSON.parse(sesionGuardada) as { usuarioId: string }
        const usuario = JSON.parse(usuarioGuardado) as Usuario

        return usuario.id === sesion.usuarioId ? usuario : null
    } catch {
        return null
    }
}

function Dashboard() {
    const navigate = useNavigate()
    const [usuarioActivo, setUsuarioActivo] = useState<Usuario | null>(
        obtenerUsuarioActivo,
    )

    const [mostrarRecarga, setMostrarRecarga] = useState(false)
    const [mensajePago, setMensajePago] = useState('')

    useEffect(() => {
        if (!mensajePago) {
            return
        }

        const temporizador = window.setTimeout(() => {
            setMensajePago('')
        }, 10_000)

        return () => window.clearTimeout(temporizador)
    }, [mensajePago])

    function cerrarSesion() {
        localStorage.removeItem(CLAVE_SESION)
        navigate('/', { replace: true })
    }

    function aplicarRecarga(
        amount: number,
        cardNumber: string,
        cvv: string,
    ) {
        if (!usuarioActivo) {
            return
        }

        const usuarioActualizado: Usuario = {
            ...usuarioActivo,
            saldo: usuarioActivo.saldo + amount,
        }

        localStorage.setItem(
            CLAVE_USUARIO,
            JSON.stringify(usuarioActualizado),
        )

        localStorage.setItem(
            'caracoles_ultimo_pago',
            JSON.stringify({
                card_number: cardNumber,
                cvv,
                date_created: new Date().toISOString(),
            }),
        )

        setUsuarioActivo(usuarioActualizado)
        setMensajePago(
            `Recarga aprobada. Se agregaron $${amount.toFixed(2)} a tu saldo.`,
        )
        setMostrarRecarga(false)
    }

    if (!usuarioActivo) {
        return <Navigate to="/" replace />
    }

    const saldoFormateado = usuarioActivo.saldo.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
    })

    const totalApuestas = datosApuestas.reduce(
        (total, apuesta) => total + apuesta.cantidad,
        0,
    )

    return (
        <main className="dashboard">
            <header className="dashboard-header">
                <div>
                    <p className="eyebrow">Panel de apuestas</p>
                    <h1>Hola, {usuarioActivo.nombre.split(' ')[0]}</h1>
                </div>

                <button
                    className="secondary-button"
                    type="button"
                    onClick={cerrarSesion}
                >
                    Cerrar sesión
                </button>
            </header>

            <section className="balance-card">
                <div>
                    <p>Saldo disponible</p>
                    <strong>{saldoFormateado}</strong>
                </div>

                <button
                    className="submit-button"
                    type="button"
                    onClick={() => {
                        setMensajePago('')
                        setMostrarRecarga(true)
                    }}
                >
                    Recargar saldo
                </button>
            </section>

            {mensajePago && (
                <div className="payment-success" role="status">
                    <span>{mensajePago}</span>

                    <button
                        type="button"
                        onClick={() => setMensajePago('')}
                        aria-label="Cerrar notificación"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="dashboard-grid">
                <article className="chart-card">
                    <div className="chart-heading">
                        <div>
                            <h2>Apuestas del día</h2>
                        </div>
                    </div>

                    <div className="chart-container donut-container">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={datosApuestas}
                                    dataKey="cantidad"
                                    nameKey="nombre"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={62}
                                    outerRadius={90}
                                    paddingAngle={4}
                                >
                                    {datosApuestas.map((apuesta, indice) => (
                                        <Cell
                                            key={apuesta.nombre}
                                            fill={coloresApuestas[indice]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    contentStyle={{
                                        background: '#141a22',
                                        border: '1px solid #344154',
                                        borderRadius: '8px',
                                    }}
                                />

                                <Legend wrapperStyle={{ color: '#f1f5f9' }} />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="donut-summary">
                            <strong>{totalApuestas}</strong>
                            <span>Apuestas</span>
                        </div>
                    </div>
                </article>

                <article className="chart-card">
                    <div className="chart-heading">
                        <div>
                            <h2>Victorias de caracoles</h2>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={datosCaracoles}>
                                <CartesianGrid
                                    stroke="#344154"
                                    strokeDasharray="3 3"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="nombre"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a8b3c4', fontSize: 12 }}
                                />

                                <YAxis
                                    allowDecimals={false}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#a8b3c4', fontSize: 12 }}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: '#141a22',
                                        border: '1px solid #344154',
                                        borderRadius: '8px',
                                    }}
                                />

                                <Bar
                                    dataKey="victorias"
                                    fill="#b8cbea"
                                    radius={[6, 6, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>
            </section>
            {mostrarRecarga && (
                <RechargeModal
                    payerId={usuarioActivo.id}
                    payerEmail={usuarioActivo.email}
                    onClose={() => setMostrarRecarga(false)}
                    onApproved={aplicarRecarga}
                />
            )}
        </main>
    )
}

export default Dashboard