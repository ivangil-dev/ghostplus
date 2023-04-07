// Configuración PM2
module.exports = {
    apps : [{
      name   : "GHOSTPLUS",
      script : "./appjs",
      max_memory_restart: "1G",
      autorestart: true,
      stop_exit_codes: [0],
      out_file: "logs/ghostplus_out.log",
      error_file: "logs/ghostplus_error.log",
      log_date_format: "DD-MM-YYYY HH:mm Z",
      env_production: {
        NODE_ENV: "production"
      },
      // Specify which folder to watch
      watch: ["plantillas", "rutas", "funciones, idiomas, poderes"],
    // Specify delay between watch interval
    watch_delay: 1000,
    // Specify which folder to ignore 
    ignore_watch : ["node_modules", "test", "publico", "logs"],
    }]
  }