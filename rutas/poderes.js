const   
    enrutador       = require('koa-router'),
    ruta            = new enrutador(),
    validador       = require('validator'),
    registro        = require('../funciones/registros'),
    API_ghost       = require('../funciones/API_ghost'),
    utilidades      = require('../funciones/utilidades'),

    fs              = require('fs'),
    util            = require('util'),
    promisify       = util.promisify,

    enviar          = require('../poderes/contacto'),
    instagram       = require('../poderes/Instagram'),
    lista           = require('../poderes/listas');

    async function existeArchivo(ruta) {
        try {
            await fs.promises.access(ruta);
            return true;
        } catch (error) {
            return false;
        }
    }

ruta
.get('/lector/:id', utilidades.verificarOrigen, async (respuesta, siguiente) => {
    try {
    //Ejemplo de ruta https://XXXXXX/modulos/lector/6153650f8bd882881769a204
    const IDarticulo  = validador.escape(respuesta.params.id),
          datos       = await API_ghost.articuloPorID(IDarticulo),
          textoPlano  = datos.plaintext,
          nombreFinal = datos.slug,
          rutaCompleta = `./audios/${nombreFinal}.mp3`,
          existe      = await existeArchivo(rutaCompleta);

          respuesta.state.audio = `${nombreFinal}.mp3`;
          respuesta.state.RutaAudio = `./audios/`;
          respuesta.state.RutaAudioCompleta = `./audios/${nombreFinal}.mp3`;

          if(!existe) {
            registro.info(`Accediendo al audio "${nombreFinal}.mp3" del artículo ${IDarticulo} pero no existe. Lo creamos.`)
            const buffer = await conversionVoz(`${textoPlano}`, 2000),
            salida = rutaCompleta,
            writeFile = promisify(fs.writeFile);
            await writeFile(salida, buffer, 'binary');
            registro.info(`Audio "${nombreFinal}.mp3" creado con éxito.`)
            await siguiente();
          } else {
            await siguiente(); 
          }
    
    } catch (error) {
        registro.error(`Error en la ruta /lector/:id: ${error.message}`);
        respuesta.status = 500;
        respuesta.body = { error: 'Ocurrió un error al procesar la solicitud' };
    }
  }, async respuesta => {
    const archivo             = respuesta.state.RutaAudioCompleta,
          { size: filesize }  = await fs.promises.stat(archivo),
          src                 = fs.createReadStream(archivo);
    
    respuesta.length = filesize;
    respuesta.set({
       'Accept-Ranges': 'bytes',
       "content-type": "audio/mp3"});
    respuesta.body = src;
    
  })
    .get('/listalectura/:id', lista.ListaLectura)
        .post('/listalectura/mas', lista.nuevoListaLectura)
        .post('/listalectura/quitar', lista.quitarListaLectura)
        .post('/listalectura/vaciar', lista.limpiarListaLectura)
        
    .get(`/instagram`, async (respuesta) => {
        return respuesta.body = await instagram.extraerDatos();
    })
    .post('/contactar', async (datos) => {
        await enviar(datos).then(resultado => {
            if (resultado) {
                respuesta = {
                    status: 200,
                    message: 'Formulario enviado con éxito',
                    response: respuestaEmail,
                }
                return respuesta;
            } else {  
                respuesta = {
                status: 500,
                message: 'Error al enviar el formulario',
                error
                }
                return respuesta;
            }
        }).catch(error => {
            respuesta = {
                status: 500,
                message: 'Error al enviar el formulario',
                error
            }
            return respuesta;
        });
    })
module.exports = ruta;