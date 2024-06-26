const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Utente = require('../models/utente');

// Funzione che implementa l'autenticazione, con la creazione di un token
exports.autenticazione = (req, res) => {
    Utente.find({ email: req.body.email })
    .then(utenti => {
        if (utenti.length < 1){
            return res.status(401).json({
                error: 'Autenticazione fallita'
            });
        }
        // Controllo password
        bcrypt.compare(req.body.password, utenti[0].password, (err, result) => {
            if (err) {
                // Errore durante la compare
                return res.status(401).json({
                    error: 'Autenticazione fallita'
                });
            }
            if (result) {
                // Password corretta => creazione token
                const token = jwt.sign(
                    {
                        _id: utenti[0]._id,
                        _type: utenti[0]._type,
                        email: utenti[0].email
                    }, 
                    process.env.JWT_KEY,
                    {
                        expiresIn: "1h"
                    }
                );
                return res.status(200).json({
                    message: 'Autenticazione effettuata',
                    token: token,
                    email: utenti[0].email,
                    _id: utenti[0]._id
                });
            }
            // Password errata
            return res.status(401).json({
                error: 'Autenticazione fallita'
            });
        })
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err.message
        })
    })
};