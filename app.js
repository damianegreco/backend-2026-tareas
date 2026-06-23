const express = require('express');
const app = express();

const path = require('path');

require('dotenv').config({path: path.join(__dirname, ".env")})

const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const apiRouter = require('./api/main');

const { PORT } = process.env;

// --- MIDDLEWARES DE SEGURIDAD ---

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-eval'"],
    }
  }
}));
app.use(cors());
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100, // Máximo 100 peticiones por IP
  message: 'Demasiadas peticiones, por favor intenta más tarde.'
});

// --- MIDDLEWARES DE RENDIMIENTO Y LOGS ---

app.use(compression());
app.use(morgan('dev')); 

// --- MIDDLEWARE DE PARSEO ---

app.use(express.json());

app.use(express.static(path.join(__dirname, 'api/public/docs')));

app.use('/api', limiter, apiRouter)

app.listen(PORT, function() {
  console.log(`Escuchando en el puerto ${PORT}`)
})