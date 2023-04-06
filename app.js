'use strict';

require('dotenv').config();

const 
    koa             = require('koa'),
    cors            = require('@koa/cors'),
    bodyParser      = require('koa-bodyparser'),
    vista           = require('koa-views'),
    recursos        = require('koa-static'),
    utilidades      = require('./funciones/utilidades'),

    puerto          = utilidades.normalizarPuerto(process.env.PUERTO || '8599'),
    entorno         = (process.env.ENTORNO === 'production') ? 'production' : 'dev',

    app = new koa();
app
    .use(cors({
        origin: utilidades.verificarOrigen, 
        allowMethods: ["GET", "POST", "PUT"]
    }))
    .use(recursos(__dirname + '/publico'))
    .use(bodyParser())
                //.use(frontend.routes()).use(frontend.allowedMethods())
                .use(modulos.routes()).use(modulos.allowedMethods())
                .listen(puerto, () => utilidades.inicioApp(entorno, puerto))
                .on('error', (e) => {utilidades.errorApp(e); process.exit(0)})