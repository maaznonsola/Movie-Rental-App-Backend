const mongoose = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')

const userSchema = mongoose.Schema({
	name: {
		type: String,
		required: true,
		min: 1,
		max: 255,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		min: 7,
		max: 255,
		trim: true
	},
	password: {
		type: String,
		rquired: true,
		min: 8,
		max: 255,
		trim: true
	},
	isAdmin: {
		type: Boolean
	}
})

userSchema.methods.generateAuthToken = function () {
	const token = jwt.sign(
		{ _id: this._id, isAdmin: this.isAdmin },
		config.get('jwtPrivateKey')
	)
	return token
}

const User = mongoose.model('User', userSchema)

const userValidator = (data) => {
	const joiOptions = { abortEarly: false }

	const userSchema = Joi.object({
		name: Joi.string().min(1).max(255).required(),
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

module.exports = {
	User,
	userValidator
}
