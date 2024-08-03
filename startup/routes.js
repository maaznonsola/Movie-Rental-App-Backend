const express = require('express')
const homeRouter = require('../routes/home')
const usersRouter = require('../routes/api/users')
const authRouter = require('../routes/api/auth')
const genresRouter = require('../routes/api/genres')
const customersRouter = require('../routes/api/customers')
const moviesRouter = require('../routes/api/movies')
const rentalsRouter = require('../routes/api/rentals')
const returnsRouter = require('../routes/api/returns')
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')
const error = require('../middleware/error')
const logger = require('./logger')

module.exports = function (app) {
	// Express core middleware
	app.use(express.json())

	// custom middlware

	app.use('/', homeRouter)
	app.use('/api/users', usersRouter)
	app.use('/api/auth', authRouter)
	app.use('/api/genres', genresRouter)
	app.use('/api/movies', moviesRouter)
	app.use('/api/rentals', rentalsRouter)
	app.use('/api/returns', returnsRouter)
	app.use('/api/customers', customersRouter)

	// error handling middleware
	app.use(error(logger))
}
