const mongoose = require('mongoose')
const logger = require('./logger')
const config = require('config')

module.exports = function () {
	const db = config.get('db')
	mongoose
		.connect(db, { useUnifiedTopology: false })
		.then(() => logger.log('info', `Connected to MongoDb at ${db}`))
}
