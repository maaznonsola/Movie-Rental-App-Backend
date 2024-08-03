const mongoose = require('mongoose')
const Joi = require('joi')

const userValidator = (data) => {
	const joiOptions = { abortEarly: false }

	const userSchema = Joi.object({
		email: Joi.string().min(7).max(255).required().email(),
		password: Joi.string().min(8).max(255).required()
	})

	const validation = userSchema.validate(data, joiOptions)
	if (validation.error) {
		const error = validation.error.details.map((e) => e.message)
		return { error: error }
	}
	return { error: null }
}

module.exports = userValidator
