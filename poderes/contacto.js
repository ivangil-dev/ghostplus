const 
  nodemailer  = require('nodemailer'),
  axios       = require('axios'),
  validador   = require('validator'),
  plantilla   = require('../plantillas/emails/contacto'),
  registro    = require('../funciones/registros');

  function crearTransporte() {
    return nodemailer.createTransport({
      service: process.env.SERVICIO_EMAIL,
      auth: {
          user: process.env.USUARIO_EMAIL,
          pass: process.env.CLAVE_EMAIL
      },
      dkim: {
          domainName: process.env.DKIM_DOMINIO,
          keySelector: process.env.DKIM_SELECTOR_LLAVE,
          privateKey: process.env.DKIM_CLAVE
        }
    });
  }

async function enviar(ctx, transporte = crearTransporte(), axiosPost = axios.post.bind(axios)) {
  const { email, nombre, mensaje, gcaptcha } = ctx.request.body;

  try {
    const response = await axiosPost(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.CLAVE_PRIVADA_GOOGLE}&response=${gcaptcha}`);

    if (
      response.data.action === 'contacto' &&
      response.data.score >= 0.4 &&
      response.data.success && 
      validador.isEmail(email)
    ) {
      const OpcionesEmail = {
        from: process.env.USUARIO_EMAIL,
        to: process.env.USUARIO_EMAIL_DESTINO,
        subject: `🎯 Evento | Nuevo mensaje desde el formulario web 📫🌌`,
        html: plantilla({nombre: validador.escape(nombre), nombre: validador.normalizeEmail(email), mensaje: validador.escape(mensaje)})
      };

      const RespuestaEmail = await transporte.sendMail(OpcionesEmail);

      ctx.status = 200;
      ctx.body = {
        message: 'Formulario enviado con éxito',
        response: RespuestaEmail,
      };
    } else {
      ctx.status = 400;
      ctx.body = { message: 'No se pudo verificar el captcha' };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Error al enviar el formulario', error };
  }
}

module.exports = {enviar, crearTransporte};