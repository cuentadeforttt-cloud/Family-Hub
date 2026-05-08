// 1. Cargar variables de entorno SIEMPRE primero
require('dotenv').config(); 

// 2. Importar librerías (UNA sola vez cada una)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// 3. Importar tus rutas de la carpeta src
const authRoutes = require('./src/routes/auth'); 

const app = express();

// 4. Middlewares de seguridad y logs
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json()); // Crucial para recibir datos de Thunder Client

// 5. Conectar rutas
app.use('/api/auth', authRoutes);
// Ruta de prueba
app.get('/', (req, res) => {
    res.send('¡El servidor de FamilyHub está funcionando correctamente!');
});

// 6. Encender servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
});
