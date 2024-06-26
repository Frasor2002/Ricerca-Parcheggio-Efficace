const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const jwt = require ('jsonwebtoken');
const Test = require('supertest/lib/test');

describe('POST /v1/feedback', () => {
    const parcheggioId = new mongoose.Types.ObjectId();
    const feedbackId = new mongoose.Types.ObjectId();
    const utenteMail = 'test@unitn.it';
    // Creazione token valido
    var payload = {
        _id: mongoose.Schema.Types.ObjectId,
        _type: "UtenteNormale",
        email: utenteMail
    }
    var options = {
        expiresIn: "1h" // scadenza in un ora
    }
    var token = jwt.sign(payload,process.env.JWT_KEY, options);

    beforeAll(() => {
        const Parcheggio = require('../models/parcheggio');
        const Utente = require('../models/utente');
        const Feedback = require('../models/feedback');
        Parcheggio.find = jest.fn().mockResolvedValue([{
            _id: parcheggioId
        }]);
        Utente.find = jest.fn().mockResolvedValue([{
            email: utenteMail
        }]);
        Feedback.prototype.save = jest.fn()
        .mockResolvedValue({
            _id : feedbackId,
            parcheggioId : parcheggioId,
            utenteMail : utenteMail,
            rating: 4,
            testoFeedback: 'Feedback'
        });
    });

    test('Test #26: creazione feedback con parametri corretti e token valido', () => {
        const feedbackPayload = {
            parcheggioId: parcheggioId,
            rating: 4,
            testoFeedback: 'Feedback'
        }
        return request(app)
        .post('/v1/feedback')
        .set('Authorization', 'Bearer ' + token)
        .send(feedbackPayload)
        .expect(201, {
            message: 'Feedback creato',
            createdFeedback: {
                _id : `${feedbackId._id}`,
                parcheggioId : `${parcheggioId._id}`,
                rating: 4,
                testoFeedback: 'Feedback' 
            }
        });
    });

    test('Test #27: creazione feedback senza parametro rating', () => {
        const feedbackPayload = {
            parcheggioId: parcheggioId,
            testoFeedback: 'Feedback'
        }
        return request(app)
        .post('/v1/feedback')
        .set('Authorization', 'Bearer ' + token)
        .send(feedbackPayload)
        .expect(400, {
            error: 'Parametri mancanti'
        });
    });

    test('Test #28: creazione feedback senza parametro testoFeedback', () => {
        const feedbackPayload = {
            parcheggioId: parcheggioId,
            rating: 4
        }
        return request(app)
        .post('/v1/feedback')
        .set('Authorization', 'Bearer ' + token)
        .send(feedbackPayload)
        .expect(400, {
            error: 'Parametri mancanti'
        });
    });

    test('Test #29: creazione feedback senza parametro parcheggioId', () => {
        const feedbackPayload = {
            rating: 4,
            testoFeedback: 'Feedback'
        }
        return request(app)
        .post('/v1/feedback')
        .set('Authorization', 'Bearer ' + token)
        .send(feedbackPayload)
        .expect(400, {
            error: 'Parametri mancanti'
        });
    });

    describe('Parametro parcheggioId errato', () => {
        beforeAll(() => {
            const Parcheggio = require('../models/parcheggio');
            Parcheggio.find = jest.fn().mockResolvedValue([]);
        });

        test('Test #30: creazione feedback con parametro parcheggioId errato', () => {
            const feedbackPayload = {
                parcheggioId: new mongoose.Types.ObjectId(),
                rating: 4,
                testoFeedback: 'Feedback'
            }
            return request(app)
            .post('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send(feedbackPayload)
            .expect(400, {
                error: 'parcheggio non trovato'
            });
        });
    });

    test('Test #31: creazione feedback con token non valido', () => {
        const feedbackPayload = {
            parcheggioId: parcheggioId,
            rating: 4,
            testoFeedback: 'Feedback'
        }
        const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NjQzM2Q0NmJjYjI0MjNjMzk3YzQ1MjAiLCJfdHlwZSI6IlV0ZW50ZUFkbWluIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzE2ODI4NTc0LCJleHAiOjE3MTY4MzIxNzR9.KFEK47FXuV2-j0RFwSmlfYORcrUTfi2q3xTHxakca-Q';
        return request(app)
        .post('/v1/feedback')
        .set('Authorization', 'Bearer ' + invalidToken)
        .send(feedbackPayload)
        .expect(403, {
            error: 'jwt expired'
        });
    });

    describe('Errore nel salvataggio nel database', () => {
        beforeAll(() => {
            const Parcheggio = require('../models/parcheggio');
            const Utente = require('../models/utente');
            const Feedback = require('../models/feedback');
            Parcheggio.find = jest.fn().mockResolvedValue([{
                _id: parcheggioId
            }]);
            Utente.find = jest.fn().mockResolvedValue([{
                email: utenteMail
            }]);
            Feedback.prototype.save = jest.fn().mockRejectedValue(new Error('DB save error'));
        });

        test('Test #32: creazione feedback con errore salvataggio DB', () => {
            const feedbackPayload = {
                parcheggioId: parcheggioId,
                rating: 4,
                testoFeedback: 'Feedback'
            }
            return request(app)
            .post('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send(feedbackPayload)
            .expect(500, {
                error: 'DB save error'
            });
        });
    });

    describe('Nessun utente trovato con email del token', () => {
        beforeAll(() => {
            const Parcheggio = require('../models/parcheggio');
            const Utente = require('../models/utente');
            Parcheggio.find = jest.fn().mockResolvedValue([{
                _id: parcheggioId
            }]);
            Utente.find = jest.fn().mockResolvedValue([]);
        });

        test('Test #36: creazione feedback con email non esistente nel DB', () => {
            const feedbackPayload = {
                parcheggioId: parcheggioId,
                rating: 4,
                testoFeedback: 'Feedback'
            }
            return request(app)
            .post('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send(feedbackPayload)
            .expect(400, {
                error: 'Email not found'
            });
        });
    });

    describe('Errore DB nella find utente', () => {
        beforeAll(() => {
            const Parcheggio = require('../models/parcheggio');
            const Utente = require('../models/utente');
            Parcheggio.find = jest.fn().mockResolvedValue([{
                _id: parcheggioId
            }]);
            Utente.find = jest.fn().mockRejectedValue(new Error('DB find error'));
        });

        test('Test #37: creazione feedback con errore del DB per la find utente', () => {
            const feedbackPayload = {
                parcheggioId: parcheggioId,
                rating: 4,
                testoFeedback: 'Feedback'
            }
            return request(app)
            .post('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send(feedbackPayload)
            .expect(500, {
                error: 'DB find error'
            });
        });
    });

    describe('Errore DB nella find parcheggio', () => {
        beforeAll(() => {
            const Parcheggio = require('../models/parcheggio');
            Parcheggio.find = jest.fn().mockRejectedValue(new Error('DB find error'));
        });

        test('Test #38: creazione feedback con errore del DB per la find utente', () => {
            const feedbackPayload = {
                parcheggioId: parcheggioId,
                rating: 4,
                testoFeedback: 'Feedback'
            }
            return request(app)
            .post('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send(feedbackPayload)
            .expect(500, {
                error: 'DB find error'
            });
        });
    });
});

describe('GET /v1/feedback', () => {
    const feedbackId1 = new mongoose.Types.ObjectId();
    const feedbackId2 = new mongoose.Types.ObjectId();
    const parcheggioId = new mongoose.Types.ObjectId();
    const utenteMail = 'admin@test.com';
    // Creazione token valido
    var payload = {
        _id: mongoose.Schema.Types.ObjectId,
        _type: "UtenteAdmin",
        email: utenteMail
    }
    var options = {
        expiresIn: "1h" // scadenza in un ora
    }
    var token = jwt.sign(payload,process.env.JWT_KEY, options);

    beforeAll(() => {
        const Feedback = require('../models/feedback');
        Feedback.find = jest.fn().mockResolvedValue(
            [{
                _id: feedbackId1,
                parcheggioId: parcheggioId,
                utenteMail : utenteMail,
                rating: 4,
                testoFeedback: 'Feedback'
            },
            {
                _id: feedbackId2,
                parcheggioId: parcheggioId,
                utenteMail : utenteMail,
                rating: 4,
                testoFeedback: 'Feedback'
            }]
        );
    });

    test('Test #33: visualizzazione feedback di un utente admin', () => {
        return request(app)
        .get('/v1/feedback')
        .set('Authorization', 'Bearer ' + token)
        .send()
        .expect(200, {
            count: 2,
            feedback: [{
                _id: `${feedbackId1._id}`,
                parcheggioId: `${parcheggioId._id}`,
                utenteMail : utenteMail,
                rating: 4,
                testoFeedback: 'Feedback'
            },
            {
                _id: `${feedbackId2._id}`,
                parcheggioId: `${parcheggioId._id}`,
                utenteMail : utenteMail,
                rating: 4,
                testoFeedback: 'Feedback'
            }]
        });
    });

    describe('Parcheggio con un feedback', () => {
        beforeAll(() => {
            const Feedback = require('../models/feedback');
            Feedback.find = jest.fn().mockResolvedValue(
                [{
                    _id: feedbackId1,
                    parcheggioId: parcheggioId,
                    utenteMail : utenteMail,
                    rating: 4,
                    testoFeedback: 'Feedback'
                }]
            );
        });

        test('Test #34: visualizzazione feedback parcheggio', () => {
            return request(app)
            .get('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send()
            .expect(200, {
                count: 1,
                feedback: [{
                    _id: `${feedbackId1._id}`,
                    parcheggioId: `${parcheggioId._id}`,
                    utenteMail : utenteMail,
                    rating: 4,
                    testoFeedback: 'Feedback'
                }]
            });
        });
    });

    describe('Errore nella ricerca dei feedback', () => {
        beforeAll(() => {
            const Feedback = require('../models/feedback');
            Feedback.find = jest.fn().mockRejectedValue(new Error('DB find error'));
        });

        test('Test #35: visualizzazione feedback utente con errore find DB', () => {
            return request(app)
            .get('/v1/feedback')
            .set('Authorization', 'Bearer ' + token)
            .send()
            .expect(500, {error: 'DB find error'});
        });
    });
});