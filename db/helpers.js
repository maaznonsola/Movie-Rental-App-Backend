const handleMongoError = (message, error) => {
	console.log(message)
	let errors
	if (err.name === 'ValidationError') {
		errors = handleValidationError(error)
	}
	// Return an object with one key named errors.
	// Errors value has an object of readable errors.
	return { errors }
}

const handleValidationError = (error) => {
	let errors = {}
	for (field in error.errors) {
		errors[field] = error.errors[field].message
	}
	return errors
}

module.exports = {
	handleMongoError
}
