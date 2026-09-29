import app from './app.js'

const PORT = 3001

app.listen(PORT, () => {
    console.log(`Backend disponible en http://localhost:${PORT}`)
})