const mongoose = require('mongoose')

const dbIdValidator = (maybeID) => {
	const ObjectId = mongoose.Types.ObjectId
	return ObjectId.isValid(maybeID)
}

const validId = (req, res, next) => {
	if (!dbIdValidator(req.params.id))
		return res.status(400).send('Not a valid ID.')
	next()
}

module.exports = validId
