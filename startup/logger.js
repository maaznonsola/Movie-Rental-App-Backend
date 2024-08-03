const winston = require('winston')
require('winston-mongodb')
require('express-async-errors')
const config = require('config')
const dbUrl = config.get('db')
const env = process.env.NODE_ENV

// winston logger for error middleware

/*
	winston exception handler also handles rejected promises. 
	not the expected behavior from reading the winston docs... 
	leaving out rejection handlers to avoid duplication of error logs. 
	promise rejections can be duplicated into a separate file / db collecion.  
	but there does not seem to be a way to keep them from logging to exceptions.  
*/

const winstonConsoleLogger = new winston.transports.Console({
	handleExceptions: true,
	handleRejections: true
})

const logger = winston.createLogger({
	level: 'silly',
	format: winston.format.combine(
		winston.format.colorize({ all: true }),
		winston.format.align(),
		winston.format.printf((info) => `${info.level}: ${info.message}`)
	),
	exitOnError: true,
	transports: [
		winstonConsoleLogger,
		new winston.transports.File({
			filename: 'error.log',
			level: 'error'
		})
	],
	exceptionHandlers: [
		new winston.transports.File({
			filename: 'uncaughtExceptions.log'
		})
	]
})

// Jest test environment will error with winston-mongodb
if (env !== 'test') {
	logger.add(
		new winston.transports.MongoDB({
			db: dbUrl,
			options: { useNewUrlParser: true, useUnifiedTopology: true },
			level: 'error'
		})
	)
	logger.exceptions.handle(
		new winston.transports.MongoDB({
			db: dbUrl,
			options: { useNewUrlParser: true, useUnifiedTopology: true },
			collection: 'log-uncaughtExceptions',
			level: 'error'
		})
	)
}

module.exports = logger
