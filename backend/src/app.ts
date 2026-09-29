import cors from 'cors'
import express from 'express'

type SolicitudCobro = {
    card_number?: string
    expiration_date?: string
    cvv?: string
    cardholder_name?: string
    amount?: number
    payer_id?: string
    payer_email?: string
    simulate_system_error?: boolean
    simulate_timeout?: boolean
}

const app = express()
const PORT = 3001

app.use(
    cors({
        origin: 'http://localhost:5173',
    }),
)

app.use(express.json())

function crearRespuesta(
    solicitud: SolicitudCobro,
    status: 'approved' | 'rejected' | 'error',
    statusDetail: string,
    authorizationCode: string | null = null,
) {
    return {
        id: crypto.randomUUID(),
        status,
        status_detail: statusDetail,
        transaction_amount: solicitud.amount ?? 0,
        date_created: new Date().toISOString(),
        authorization_code: authorizationCode,
        reference: `SNP-${Date.now()}`,
        payer_id: solicitud.payer_id ?? '',
        payer_email: solicitud.payer_email ?? '',

        card_number: solicitud.card_number ?? '',
        expiration_date: solicitud.expiration_date ?? '',
        cvv: solicitud.cvv ?? '',
        cardholder_name: solicitud.cardholder_name ?? '',
    }
}

function esperar(milisegundos: number) {
    return new Promise((resolve) => setTimeout(resolve, milisegundos))
}

app.get('/api/health', (_request, response) => {
    response.json({
        status: 'ok',
        message: 'SnailPay está disponible.',
    })
})

app.post('/api/snailpay/charge', async (request, response) => {
    const solicitud = request.body as SolicitudCobro

    // falla interna
    if (solicitud.simulate_system_error) {
        return response.status(500).json(
            crearRespuesta(
                solicitud,
                'error',
                'system_error: SnailPay no puede procesar la solicitud.',
            ),
        )
    }

    // timeout
    if (solicitud.simulate_timeout) {
        await esperar(12_000)

        return response.status(504).json(
            crearRespuesta(
                solicitud,
                'error',
                'gateway_timeout: SnailPay tardó demasiado en responder.',
            ),
        )
    }

    const datosObligatorios = [
        solicitud.card_number,
        solicitud.expiration_date,
        solicitud.cvv,
        solicitud.cardholder_name,
        solicitud.amount,
        solicitud.payer_id,
        solicitud.payer_email,
    ]

    if (datosObligatorios.some((dato) => !dato)) {
        return response.status(400).json(
            crearRespuesta(
                solicitud,
                'rejected',
                'invalid_data: Faltan datos obligatorios para procesar el cobro.',
            ),
        )
    }

    if (typeof solicitud.amount !== 'number' || solicitud.amount <= 0) {
        return response.status(400).json(
            crearRespuesta(
                solicitud,
                'rejected',
                'invalid_amount: El monto debe ser mayor que cero.',
            ),
        )
    }

    // tarjeta rechazadaa
    if (solicitud.card_number === '4000000000000002') {
        return response.status(402).json(
            crearRespuesta(
                solicitud,
                'rejected',
                'card_declined: La tarjeta de prueba fue rechazada.',
            ),
        )
    }

    const nombreTitular = solicitud.cardholder_name?.trim() ?? ''

    const esCobroExitoso =
        solicitud.card_number === '1234123412341234' &&
        solicitud.expiration_date === '12/26' &&
        solicitud.cvv === '543' &&
        nombreTitular.length > 0

    if (!esCobroExitoso) {
        return response.status(402).json(
            crearRespuesta(
                solicitud,
                'rejected',
                'invalid_card_data: Los datos de la tarjeta de prueba no son válidos.',
            ),
        )
    }

    return response.status(201).json(
        crearRespuesta(
            solicitud,
            'approved',
            'approved: Cobro aprobado correctamente.',
            `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        ),
    )
})

export default app