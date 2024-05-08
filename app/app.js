const express = require('express');
const app = express();
const cors = require('cors');

const parcheggioRoutes = require('./routes/parcheggio');
const utenteRoutes = require('./routes/utente');

// Configurazione middleware di parsing
app.use(express.json());

// Lettura a schermo delle richieste
app.use((req,res,next) => {
    console.log(req.method + ' ' + req.url)
    next()
})

// Richieste CORS
app.use(cors());

// Routes per raggiungere risorse
app.use('/v1/parcheggio', parcheggioRoutes);
app.use('/v1/utente', utenteRoutes);

// Handler errore 404 NOT FOUND di default
app.use((req, res) => {
    res.status(404);
    res.json({ error: 'NOT FOUND' });
});

module.exports = app;