const { createLogger, format, transports } = require('winston');
const { combine, timestamp, prettyPrint } = format;

var ffiles = {
  error: {
    level: 'error',
    filename: './logs/error.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
  },
  info: {
    level: 'info',
    filename: './logs/app.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: true,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: false,
  },
};

const logger = createLogger({
  format: format.combine(
    timestamp(),
    prettyPrint()
),
  transports: [
    new transports.File(ffiles.error),
    new transports.File(ffiles.info),
    new transports.Console(ffiles.console)
  ],
  exitOnError: false,
});

logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  },
};

module.exports = logger;