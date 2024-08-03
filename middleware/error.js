const error = (logger) => {
	return (err, req, res, next) => {
		logger.log('error', err.message, { metadata: err })
		res.status(500).send('Unexpected error.')
	}
}

module.exports = error
