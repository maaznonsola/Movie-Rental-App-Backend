const validateData = (validator) => (req, res, next) => {
	const data = req.body
	const dataValidation = validator(data)
	if (dataValidation.error) {
		return res.status(400).send(dataValidation.error)
	}
	next()
}

module.exports = validateData
