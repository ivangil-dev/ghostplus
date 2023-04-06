module.exports = async function comprobarGhostSession(ctx, next) {
    const ghostCookie = ctx.cookies.get('ghost-members-ssr.sig');
  
    if (!ghostCookie) {
      ctx.status = 401;
      ctx.body = 'No se ha proporcionado la cookie ghost-members-ssr.sig';
      return;
    }
  
    try {
      await axios({
        method: 'get',
        url: `https://${process.env.DOMINIO}/ghost/api/admin/session`,
        headers: {
          'Cookie': `ghost-members-ssr.sig=${ghostCookie}`,
          'Origin': `https://${process.env.DOMINIO}`,
        },
      });
  
      await next(); // Continúa con la siguiente función middleware o el controlador de ruta
    } catch (error) {
      ctx.status = error.response.status;
      ctx.body = error.response.data;
    }
  }