const mongoose = require('mongoose')
const Joi = require('joi')

const GenreSchema = mongoose.Schema({
	name: {
		type: String,
		minLength: 3,
		maxLegnth: 30,
		required: true,
		trim: true,
		lowercase: true
	}
})

const Genre = mongoose.model('Genre', GenreSchema)

const genreValidator = (data) => {
	const joiOptions = { abortEarly: false }

	const genreSchema = Joi.object({
		name: Joi.string().min(3).required()
	})

	const validation = genreSchema.validate(data, joiOptions)
	if (validation.error) {
		const error = validation.error.details.map((e) => e.message)
		return { error: error }
	}
	return { error: null }
}

module.exports = {
	Genre,
	genreValidator,
	GenreSchema
}
