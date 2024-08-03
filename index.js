const logger = require('./startup/logger')
const express = require('express')
const app = express()
const config = require('config')

require('./startup/cors')(app)
require('./startup/morgan')(app)
require('./startup/config')(app)
require('./startup/debuggers')()
require('./startup/db')()
require('./startup/prod')(app)
require('./startup/routes')(app)

let port = process.env.PORT || config.get('port')
if (process.env.NODE_ENV === 'test' || config.get('NODE_ENV') === 'test') {
	port = 0
}
const server = app.listen(port, () => {
	logger.log('info', `Listening on port ${port}...`)
})

module.exports = server
