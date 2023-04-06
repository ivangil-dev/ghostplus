'use strict'

const   log         = require('./registros'),
        {Signale}   = require('signale'),
        interactive = new Signale({
            interactive: true, 
            scope: 'GHOST PLUS', 
            types: {
                informativo: {badge: '⚙️', color: 'blue', label: 'Encendiendo...', logLevel: 'info' },
                inicio: {badge: '⚡', color: 'green', label: 'Funcionando', logLevel: 'info' }
            }
        }),

    normalizarPuerto = val => {
        var puerto = parseInt(val, 10);
        if (isNaN(puerto)) {return val;}
        if (puerto >= 0) {return puerto;}
        return false;
    },
    errorApp = error => {
        // Si hay error, lo registro y documento en fichero de carpeta logs
        log.error(`Código: ${error.code || 500} /// Mensaje: ${error.message}`);
        // Si estamos en consola mostraré el error por pantalla
        signale.fatal(new Error("Error:" + error.message));
        if ("EACCES" === error.errno) {
            signale.fatal(new Error(`GHOSTPLUS no tiene permisos para acceder a ${error.address}:${error.puerto}`));
            signale.debug('Probablemente faltan permisos, así que puedes probar con \"sudo\" o con \"sudo setcap \'cap_net_bind_service=+ep\' $(which node)\"');
            return;
        }
        if ("EADDRINUSE" === error.errno) {
            signale.fatal(new Error(`${error.address}:${error.puerto} se encuentra en uso por otro programa`));
            signale.debug('Probablemente necesites parar GHOSTPLUS porque lo estás ejecutando dos veces');
            return;
        }
        signale.fatal(new Error(`${error.code}:${error.address}:${error.puerto}`));
    },
    inicioApp = (entorno, puerto) => {
        if (entorno === 'dev') {
            interactive.informativo(`[%d/2] - Iniciando aplicación en modo DESARROLLO ☕ en el puerto ${puerto} ⚓`, 1);
            setTimeout(() => {
                interactive.inicio(`[%d/2] - Aplicación en funcionamiento y accesible en http://localhost:${puerto} ⚓`, 2);
            }, 1000);
        } else {
            interactive.informativo(`[%d/2] - Levantando aplicación en modo PRODUCCIÓN en el puerto ${puerto} ⚓`, 1);
            log.info(`Iniciando GHOSTPLUS en el puerto ${puerto}`)
            setTimeout(() => {
                interactive.inicio(`[%d/2] - ⚡ Aplicación operativa en el puerto ${puerto} ⚓`, 2);
                log.info(`⚓ GHOSTPLUS en funcionamiento en el puerto ${puerto}`)
            }, 1000);
        }
    },
    origenes = [`http://localhost:${normalizarPuerto(process.env.PUERTO || '8498')}`, `http://localhost:${normalizarPuerto('2368')}`, `https://${process.env.DOMINIO}` ];
    
    function origenValido (origen) {
        return origenes.indexOf( origen ) != -1;
    }
    const verificarOrigen = ctx => {
        const origen = ctx.headers.origin;
        if (!origenValido(origen)) {
            return false;
        } else {
            return origen
        }
    }

module.exports = { normalizarPuerto, verificarOrigen, errorApp, inicioApp };