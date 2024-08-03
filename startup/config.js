const config = require('config')
const logger = require('./logger')

module.exports = function () {
	// Check for mandatory auth key
	if (!config.get('jwtPrivateKey')) {
		throw new Error('FATAL ERROR:  jwtPrivateKey is not defined.')
	}
}
