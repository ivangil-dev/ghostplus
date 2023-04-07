const   
    enrutador       = require('koa-router'),
    ruta            = new enrutador(),
    validador       = require('validator'),
    registro        = require('../funciones/registros'),

    enviar          = require('../poderes/contacto'),
    instagram       = require('../poderes/Instagram');

ruta
    .get(`/lector/:id`, async (respuesta, siguiente) =>{
        
    })
    .get(`/instagram`, async (respuesta) => {
        return respuesta.body = await instagram.extraerDatos();
    })
    .post('/contactar', async (datos) => {
        await enviar(datos);
    })
module.exports = ruta;