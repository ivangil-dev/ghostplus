'use strict';

require('dotenv').config();

const 
    koa             = require('koa'),
    cors            = require('@koa/cors'),
    bodyParser      = require('koa-bodyparser'),
    vista           = require('koa-views'),
    recursos        = require('koa-static'),
    { I18n }        = require('i18n'),
    utilidades      = require('./funciones/utilidades'),

    frontend        = require('./rutas/frontend'),
    poderes         = require('./rutas/poderes'),

    puerto          = utilidades.normalizarPuerto(process.env.PUERTO || '8498'),
    entorno         = (process.env.ENTORNO === 'production') ? 'production' : 'dev',

    session         = require('koa-session'),
    { MongoClient } = require('mongodb'),

    { USUARIOBD, CONTRABD, SERVIDORBD, NOMBRE_BD } = process.env,

    encodedUsername = encodeURIComponent(USUARIOBD),
    encodedPassword = encodeURIComponent(CONTRABD),
    MONGODB_URI     = `mongodb+srv://${encodedUsername}:${encodedPassword}@${SERVIDORBD}?retryWrites=true&w=majority`,

    i18n = new I18n({
        locales: ['es', 'en'],
        directory: `${__dirname}/idiomas`,
        defaultLocale: 'es'
    }),

    app = new koa();

// Configuración de la sesión
    app.keys = [process.env.LLAVE1, process.env.LLAVE2];
    app
    .use(session({
        key: process.env.COOKIE_SESSION,
        signed: true,
        httpOnly: (entorno != 'production') ? false : true,
        overwrite: true,
        maxAge: 86400000,
        secure: (entorno != 'production') ? false : true,
        sameSite: 'lax',
        rolling: true,
        renew: false,
        store: {
            async get(key, maxAge, { rolling }) {
            const client = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(`${NOMBRE_BD}`);
            const collection = db.collection('sesiones');
            const session = await collection.findOne({ _id: key });
            await client.close();
            return session;
            },
            async set(key, session, maxAge, { rolling, changed }) {
            const client = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(`${NOMBRE_BD}`);
            const collection = db.collection('sesiones');
            await collection.updateOne({ _id: key }, { $set: session }, { upsert: true });
            await client.close();
            },
            async destroy(key) {
            const client = await MongoClient.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db(`${NOMBRE_BD}`);
            const collection = db.collection('sesiones');
            await collection.deleteOne({ _id: key });
            await client.close();
            }
        }
    }, app))
    .use(cors({
        origin: utilidades.verificarOrigen, 
        allowMethods: ["GET", "POST", "PUT"]
    }))
    .use(recursos(__dirname + '/publico'))
    .use(bodyParser())
                .use(frontend.routes()).use(frontend.allowedMethods())
                .use(poderes.routes()).use(poderes.allowedMethods())
                .listen(puerto, () => utilidades.inicioApp(entorno, puerto))
                .on('error', (e) => {utilidades.errorApp(e); process.exit(0)})