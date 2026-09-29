# Carreras

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
</p>

Aplicación web de apuestas ficticias en carreras. Incluye registro e inicio de sesión local, dashboard con estadísticas, recarga de saldo y una simulación de pasarela de pago llamada **SnailPay**.

> Todos los datos de pago usados por la aplicación son ficticios y se utilizan únicamente para pruebas.

## Tecnologías

- Frontend: React, Vite y TypeScript.
- Backend: Express y TypeScript.
- Gráficas: Recharts.
- Pruebas de API: Vitest y Supertest.
- Persistencia de la demostración: LocalStorage.

## Estructura

```text
AplicacionCaracoles/
├── frontend/       # Interfaz React/Vite
├── backend/        # API Express y simulador SnailPay
└── README.md
```

## Requisitos previos

- Node.js 20 o superior.
- npm 10 o superior.

Comprueba las versiones instaladas:

```bash
node -v
npm -v
```

## Instalación

Instala las dependencias de cada proyecto de manera independiente.

### Frontend

```bash
cd frontend
npm install
```

### Backend

En otra terminal:

```bash
cd backend
npm install
```

## Ejecutar la aplicación localmente

Es necesario levantar los dos servicios al mismo tiempo.

### 1. Iniciar el backend

Desde la carpeta `backend`:

```bash
npm run dev
```

La API queda disponible en:

```text
http://localhost:3001
```

Puedes comprobar que está activa abriendo:

```text
http://localhost:3001/api/health
```

La respuesta esperada es un JSON que indica que el servicio está disponible.

### 2. Iniciar el frontend

Desde la carpeta `frontend`, en una segunda terminal:

```bash
npm run dev
```

Vite mostrará una URL similar a:

```text
http://localhost:5173
```

Abre esa dirección en el navegador. El frontend se comunica con la API local en el puerto `3001`.

## Flujo de uso

1. En la pestaña **Registrarse**, crea una cuenta con nombre, correo y contraseña.
2. La contraseña debe tener al menos 8 caracteres; el nombre solo admite letras, espacios y acentos.
3. Inicia sesión con el correo y contraseña registrados.
4. En el dashboard selecciona **Recargar saldo**.
5. Captura los datos ficticios de pago y revisa el resultado de la operación.

El usuario, la sesión, el saldo y la última respuesta de pago se guardan en `LocalStorage`. Para reiniciar completamente la demostración, borra los datos del sitio desde las herramientas de desarrollo del navegador o ejecuta lo siguiente en la consola del navegador:

```js
localStorage.removeItem('caracoles_usuario')
localStorage.removeItem('caracoles_sesion')
localStorage.removeItem('caracoles_ultimo_pago')
```

## Escenarios de SnailPay

El modal de recarga permite seleccionar distintos escenarios antes de enviar el cobro.

| Escenario | Datos / acción | Resultado esperado |
| --- | --- | --- |
| Cobro aprobado | Tarjeta `1234 1234 1234 1234`, fecha `12/26`, CVV `543`, nombre y monto válidos | Respuesta `201`, estado `approved` y aumento del saldo. |
| Tarjeta rechazada | Tarjeta `4000 0000 0000 0002` | Respuesta `402`, estado `rejected`; el saldo no cambia. |
| Error del sistema | Selecciona el escenario de error interno | Respuesta `500`, estado `error`; el saldo no cambia. |
| Tiempo de espera | Selecciona el escenario de timeout | El cliente cancela la solicitud tras 8 segundos; el saldo no cambia. |

La respuesta del simulador incluye identificador de transacción, estado, detalle, monto, fecha, código de autorización, referencia, datos del pagador y datos de tarjeta ficticios, como solicita el ejercicio.

## Pruebas automatizadas

Las pruebas se encuentran en el backend y validan los endpoints principales del simulador.

Desde `backend` ejecuta:

```bash
npm test
```

También puedes dejar Vitest observando cambios:

```bash
npm run test:watch
```

Se prueban estos casos:

1. Health check disponible.
2. Cobro ficticio aprobado.
3. Tarjeta configurada para rechazo.
4. Error interno simulado.

## Verificaciones de producción

### Compilar frontend

```bash
cd frontend
npm run build
```

El resultado se genera dentro de `frontend/dist`.

### Verificar TypeScript del backend

```bash
cd backend
npx tsc --noEmit
```

## API disponible

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/health` | Confirma que el backend está disponible. |
| `POST` | `/api/snailpay/charge` | Simula un cobro con SnailPay. |

Ejemplo de solicitud aprobada:

```json
{
  "card_number": "1234123412341234",
  "expiration_date": "12/26",
  "cvv": "543",
  "cardholder_name": "Usuario Prueba",
  "transaction_amount": 100,
  "payer_id": "usuario-local",
  "payer_email": "usuario@ejemplo.com"
}
```


