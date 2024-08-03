const mongoose = require('mongoose')
const Joi = require('joi')

const CustomerSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		trim: true,
		minLength: 1,
		maxLength: 255
	},
	phone: {
		type: String,
		required: true,
		trim: true,
		minLength: 7,
		maxLength: 255
	},
	isGold: {
		type: Boolean,
		default: false
	}
})

const Customer = mongoose.model('Customer', CustomerSchema)

const customerValidator = (data) => {
	const joiOptions = { abortEarly: false }

	const customerSchema = Joi.object({
		name: Joi.string().required().min(1),
		phone: Joi.string().required().min(7),
		isGold: Joi.bool()
	})

	const validation = customerSchema.validate(data, joiOptions)
	if (validation.error) {
		const error = validation.error.details.map((e) => e.message)
		return { error: error }
	}
	return { error: null }
}

module.exports = { Customer, customerValidator }
