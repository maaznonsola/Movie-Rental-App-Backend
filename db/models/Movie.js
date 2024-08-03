const mongoose = require('mongoose')
const { GenreSchema } = require('./Genre')
const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const MovieSchema = mongoose.Schema({
	title: {
		type: String,
		required: true,
		trim: true,
		minLength: 1,
		maxLength: 100
	},
	genre: {
		required: true,
		type: GenreSchema
	},
	numberInStock: {
		type: Number,
		required: true,
		min: 0
	},
	dailyRentalRate: {
		type: Number,
		required: true,
		min: 0
	}
})

const Movie = mongoose.model('Movie', MovieSchema)

const movieValidator = (data) => {
	const joiOptions = { abortEarly: false }

	const movieSchema = Joi.object({
		title: Joi.string().min(1).max(100).required(),
		genreId: Joi.objectId().required(),
		numberInStock: Joi.number().required(),
		dailyRentalRate: Joi.number().required()
	})

	const validation = movieSchema.validate(data, joiOptions)
	if (validation.error) {
		const error = validation.error.details.map((e) => e.message)
		return { error: error }
	}
	return { error: null }
}

module.exports = {
	Movie,
	movieValidator
}
