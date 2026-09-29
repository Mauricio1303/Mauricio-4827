import { useState, type FormEvent } from 'react'

type RechargeModalProps = {
    payerId: string
    payerEmail: string
    onClose: () => void
    onApproved: (
        amount: number,
        cardNumber: string,
        cvv: string,
    ) => void
}

type SnailPayResponse = {
    status: 'approved' | 'rejected' | 'error'
    status_detail: string
    transaction_amount: number
    card_number: string
    cvv: string
}

function RechargeModal({
    payerId,
    payerEmail,
    onClose,
    onApproved,
}: RechargeModalProps) {
    const [mensaje, setMensaje] = useState('')
    const [procesando, setProcesando] = useState(false)
    const [montoVisible, setMontoVisible] = useState('')

    async function procesarRecarga(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setMensaje('')
        setProcesando(true)

        const datos = new FormData(event.currentTarget)
        const escenario = String(datos.get('escenario') ?? 'normal')

        const controller = new AbortController()
        const timeout = window.setTimeout(() => controller.abort(), 8_000)

        try {
            const response = await fetch('http://localhost:3001/api/snailpay/charge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: controller.signal,
                body: JSON.stringify({
                    card_number: String(datos.get('card_number') ?? ''),
                    expiration_date: String(datos.get('expiration_date') ?? ''),
                    cvv: String(datos.get('cvv') ?? ''),
                    cardholder_name: String(datos.get('cardholder_name') ?? ''),
                    amount: Number(String(datos.get('amount') ?? '').replace(/,/g, '')),
                    payer_id: payerId,
                    payer_email: payerEmail,
                    simulate_system_error: escenario === 'system_error',
                    simulate_timeout: escenario === 'timeout',
                }),
            })

            const resultado = (await response.json()) as SnailPayResponse

            if (resultado.status === 'approved') {
                onApproved(
                    resultado.transaction_amount,
                    resultado.card_number,
                    resultado.cvv,
                )
                return
            }

            setMensaje(resultado.status_detail)
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                setMensaje('Tiempo de espera agotado. No se aplicó ninguna recarga.')
            } else {
                setMensaje('No fue posible comunicarse con SnailPay.')
            }
        } finally {
            window.clearTimeout(timeout)
            setProcesando(false)
        }
    }

    function limitarDigitos(
        event: FormEvent<HTMLInputElement>,
        longitudMaxima: number,
    ) {
        const input = event.currentTarget

        input.value = input.value
            .replace(/\D/g, '')
            .slice(0, longitudMaxima)
    }

    function formatearVencimiento(event: FormEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const digitos = input.value.replace(/\D/g, '').slice(0, 4)

        input.value =
            digitos.length > 2
                ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
                : digitos
    }

    function limpiarNombre(event: FormEvent<HTMLInputElement>) {
        const input = event.currentTarget

        input.value = input.value
            .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, '')
            .replace(/\s{2,}/g, ' ')
    }

    function formatearMonto(event: FormEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const valorSinComas = input.value.replace(/,/g, '')

        if (valorSinComas === '') {
            setMontoVisible('')
            return
        }

        const tieneDecimal = valorSinComas.includes('.')
        const [parteEntera = '', parteDecimal = ''] = valorSinComas.split('.')

        const enteros = parteEntera.replace(/\D/g, '')
        const decimales = parteDecimal.replace(/\D/g, '').slice(0, 2)

        const enteroFormateado = Number(enteros || 0).toLocaleString('en-US')

        setMontoVisible(
            tieneDecimal ? `${enteroFormateado}.${decimales}` : enteroFormateado,
        )
    }

    return (
        <div className="modal-backdrop" role="presentation">
            <section
                className="recharge-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="recharge-title"
            >
                <div className="modal-header">
                    <div>
                        <p className="eyebrow">SnailPay</p>
                        <h2 id="recharge-title">Recargar saldo</h2>
                    </div>

                    <button
                        className="close-button"
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar recarga"
                    >
                        ×
                    </button>
                </div>

                <br />

                <form className="auth-form" onSubmit={procesarRecarga}>
                    <div className="form-field">
                        <label htmlFor="cardholder-name">Nombre completo</label>
                        <input
                            id="cardholder-name"
                            name="cardholder_name"
                            type="text"
                            pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+"
                            title="Usa solo letras y espacios."
                            onInput={limpiarNombre}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="card-number">Número de tarjeta</label>
                        <input
                            id="card-number"
                            name="card_number"
                            type="text"
                            inputMode="numeric"
                            minLength={16}
                            maxLength={16}
                            pattern="\d{16}"
                            placeholder="1234123412341234"
                            onInput={(event) => limitarDigitos(event, 16)}
                            required
                        />
                    </div>

                    <div className="recharge-row">
                        <div className="form-field">
                            <label htmlFor="expiration-date">Vencimiento</label>
                            <input
                                id="expiration-date"
                                name="expiration_date"
                                type="text"
                                inputMode="numeric"
                                minLength={5}
                                maxLength={5}
                                pattern="\d{2}/\d{2}"
                                placeholder="12/26"
                                onInput={formatearVencimiento}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="cvv">CVV</label>
                            <input
                                id="cvv"
                                name="cvv"
                                type="text"
                                inputMode="numeric"
                                minLength={3}
                                maxLength={3}
                                pattern="\d{3}"
                                placeholder="543"
                                onInput={(event) => limitarDigitos(event, 3)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="amount">Monto de recarga</label>
                        <input
                            id="amount"
                            name="amount"
                            type="text"
                            inputMode="decimal"
                            placeholder="100.00"
                            value={montoVisible}
                            onInput={formatearMonto}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="scenario">Escenario de prueba</label>
                        <select id="scenario" name="escenario" defaultValue="normal">
                            <option value="normal">Cobro normal</option>
                            <option value="system_error">Error interno de SnailPay</option>
                            <option value="timeout">Tiempo de espera agotado</option>
                        </select>
                    </div>

                    {mensaje && (
                        <p className="payment-message" role="status">
                            {mensaje}
                        </p>
                    )}

                    <button
                        className="submit-button"
                        type="submit"
                        disabled={procesando}
                    >
                        {procesando ? 'Procesando...' : 'Confirmar recarga'}
                    </button>
                </form>
            </section>
        </div>
    )
}

export default RechargeModal