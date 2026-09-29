import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from './app.js'

const solicitudValida = {
    card_number: '1234123412341234',
    expiration_date: '12/26',
    cvv: '543',
    cardholder_name: 'Mauricio Rubio',
    amount: 250.5,
    payer_id: 'usuario-de-prueba',
    payer_email: 'usuario@ejemplo.com',
}

describe('SnailPay', () => {
    it('indica que el servicio está disponible', async () => {
        const respuesta = await request(app).get('/api/health')

        expect(respuesta.status).toBe(200)
        expect(respuesta.body.status).toBe('ok')
    })

    it('aprueba un cobro con los datos ficticios válidos', async () => {
        const respuesta = await request(app)
            .post('/api/snailpay/charge')
            .send(solicitudValida)

        expect(respuesta.status).toBe(201)
        expect(respuesta.body.status).toBe('approved')
        expect(respuesta.body.transaction_amount).toBe(250.5)
        expect(respuesta.body.authorization_code).toMatch(/^AUTH-/)
        expect(respuesta.body.payer_email).toBe(solicitudValida.payer_email)
    })

    it('rechaza la tarjeta configurada para rechazo', async () => {
        const respuesta = await request(app)
            .post('/api/snailpay/charge')
            .send({
                ...solicitudValida,
                card_number: '4000000000000002',
            })

        expect(respuesta.status).toBe(402)
        expect(respuesta.body.status).toBe('rejected')
        expect(respuesta.body.status_detail).toContain('card_declined')
    })

    it('devuelve error cuando se simula una falla interna', async () => {
        const respuesta = await request(app)
            .post('/api/snailpay/charge')
            .send({
                ...solicitudValida,
                simulate_system_error: true,
            })

        expect(respuesta.status).toBe(500)
        expect(respuesta.body.status).toBe('error')
        expect(respuesta.body.status_detail).toContain('system_error')
        expect(respuesta.body.card_number).toBe(
            solicitudValida.card_number,
        )
        expect(respuesta.body.cvv).toBe(solicitudValida.cvv)
    })
})