const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Test = require('supertest/lib/test');

describe('POST /v1/prenotazione', () => {
    // Creazione token valido
    var payload = {
        _id: mongoose.Schema.Types.ObjectId,
        _type: "UtenteNormale",
        email: "test@unitn.it"
    }
    var options = {
        expiresIn: "1h" // scadenza in un ora
    }
    var token = jwt.sign(payload,process.env.JWT_KEY, options);

    beforeAll( () => {
        const ParcheggioVigilato = require('../models/parcheggioVigilato');
        const Prenotazione = require('../models/prenotazione');
        const Utente = require('../models/utente');
        ParcheggioVigilato.find = jest.fn().mockResolvedValue([{
            _id: 0o0,
            numPosti: 100,
            numPostiDisabili: 10,
            numPostiGravidanza: 10,
            numPostiAuto: 70,
            numPostiMoto: 10,
            numPostiFurgone: 10,
            numPostiBus: 10,
            postiOccupati: {
                postiOcc: 0,
                postiOccDisabili: 0,
                postiOccGravidanza: 0,
                postiOccAuto: 0,
                postiOccMoto: 0,
                postiOccFurgone: 0, 
                postiOccBus: 0
            }
        }]);
        ParcheggioVigilato.findByIdAndUpdate = jest.fn().mockResolvedValue();
        Utente.find = jest.fn().mockResolvedValue([{
            email: 'test@unitn.it',
            veicoli: [{
                tipoVeicolo: 'auto',
                targa: 'AA000AA'
            }]
        }]);
        Prenotazione.prototype.save = jest.fn().mockResolvedValue({
            _id : 0o0,
            parcheggioId : 0o0,
            utenteMail : 'test@unitn.it',
            dataPrenotazione : new Date(),
            tipoPosto: 'Normale',
            veicolo: {
                tipoVeicolo: 'auto',
                targa: 'AA000AA'
            }
        });
    });

    test('Test #22: prenotazione con parametri corretti', async () => {
        let prenotazionePayload = {
            parcheggioId: 0o0,
            tipoPosto: 'normale'
        }
        const response = await request(app)
        .post('/v1/prenotazione')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + token)
        .send(prenotazionePayload)
        .expect(201);
        expect(response.body.message).toEqual('Prenotazione creata');
        expect(response.body.createdPrenotazione._id).toEqual(0o0);
        expect(response.body.createdPrenotazione.parcheggioId).toEqual(0o0);
        expect(response.body.createdPrenotazione.utenteMail).toEqual('test@unitn.it');
        expect(response.body.createdPrenotazione.dataPrenotazione).toEqual(expect.any(String));
        expect(response.body.createdPrenotazione.tipoPosto).toEqual('Normale');
        expect(response.body.createdPrenotazione.veicolo).toEqual({
            tipoVeicolo: 'auto',
            targa: 'AA000AA'
        });
    });
});

describe('GET /v1/prenotazione', () => {
    // Creazione token valido
    var payload = {
        _id: new mongoose.Types.ObjectId(),
        _type: "UtenteNormale",
        email: "test@unitn.it"
    }
    var options = {
        expiresIn: "1h" // scadenza in un ora
    }
    var token = jwt.sign(payload,process.env.JWT_KEY, options);

    beforeAll(() => {
        const Prenotazione = require('../models/prenotazione');
        Prenotazione.find = jest.fn()
        .mockResolvedValue([]);
    });

    test('Test #23: visualizzazione prenotazioni utente senza prenotazioni', () => {
        return request(app)
        .get('/v1/prenotazione')
        .set('Authorization', 'Bearer ' + token)
        .send()
        .expect(200, {
            count: 0,
            prenotazioni: []
        });
    });
});

describe('DELETE /v1/prenotazione/:prenotazioneId', () => {
    var prenotazioneId = new mongoose.Types.ObjectId();
    var parcheggioId = new mongoose.Types.ObjectId();
    // Creazione token valido
    var payload = {
        _id: new mongoose.Types.ObjectId(),
        _type: "UtenteNormale",
        email: "test@unitn.it"
    }
    var options = {
        expiresIn: "1h" // scadenza in un ora
    }
    var token = jwt.sign(payload,process.env.JWT_KEY, options);

    beforeAll(() => {
        const Prenotazione = require('../models/prenotazione');
        const ParcheggioVigilato = require('../models/parcheggioVigilato');
        Prenotazione.findById = jest.fn().mockResolvedValue({
            utenteMail: 'test@unitn.it'
        });
        Prenotazione.findByIdAndDelete = jest.fn().mockResolvedValue({
            _id : prenotazioneId,
            parcheggioId : parcheggioId,
            utenteMail : 'test@unitn.it',
            dataPrenotazione : new Date(),
            tipoPosto: 'Normale',
            veicolo: {
                tipoVeicolo: 'auto',
                targa: 'AA000AA'
            }
        });
        ParcheggioVigilato.findById = jest.fn().mockResolvedValue({
            _id: parcheggioId,
            postiOccupati: {
                postiOcc: 0,
                postiOccDisabili: 0,
                postiOccGravidanza: 0,
                postiOccAuto: 0,
                postiOccMoto: 0,
                postiOccFurgone: 0, 
                postiOccBus: 0
            }
        });
        ParcheggioVigilato.findByIdAndUpdate = jest.fn().mockResolvedValue();
    });

    test('Test #25: cancellazione prenotazione con ID corretto', async () => {
        const response = await request(app)
        .delete('/v1/prenotazione/:' + prenotazioneId)
        .set('Authorization', 'Bearer ' + token)
        .send()
        .expect(200);
        expect(response.body.message).toEqual('Prenotazione cancellata');
        expect(`${response.body.deletedPrenotazione._id}`).toEqual(`${prenotazioneId._id}`);
        expect(`${response.body.deletedPrenotazione.parcheggioId}`).toEqual(`${parcheggioId._id}`);
        expect(response.body.deletedPrenotazione.utenteMail).toEqual('test@unitn.it');
        expect(response.body.deletedPrenotazione.dataPrenotazione).toEqual(expect.any(String));
        expect(response.body.deletedPrenotazione.tipoPosto).toEqual('Normale');
        expect(response.body.deletedPrenotazione.veicolo).toEqual({
            tipoVeicolo: 'auto',
            targa: 'AA000AA'
        });
    });
});