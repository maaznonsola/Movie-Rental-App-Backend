const mongoose = require('mongoose')

const dbIdValidator = (maybeID) => {
	const ObjectId = mongoose.Types.ObjectId
	return ObjectId.isValid(maybeID)
}

module.exports = dbIdValidator
