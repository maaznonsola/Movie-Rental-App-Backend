const mongoose = require('mongoose')
const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const rentalSchema = mongoose.Schema({
	customer: {
		type: mongoose.Schema({
			name: {
				type: String,
				required: true,
				minLength: 1,
				maxLength: 255
			},
			phone: {
				type: String,
				required: true
			},
			isGold: {
				type: Boolean,
				default: false
			}
		}),
		required: true
	},
	movie: {
		type: mongoose.Schema({
			title: {
				type: String,
				required: true,
				trim: true,
				minLength: 1,
				maxLength: 255
			},
			dailyRentalRate: {
				type: Number,
				min: 0,
				max: 255
			}
		})
	},
	dateOut: {
		type: Date,
		required: true,
		default: Date.now
	},
	dateReturned: {
		type: Date
	},
	rentalFee: {
		type: Number,
		min: 0
	}
})

rentalSchema.statics.lookup = function (customerId, movieId) {
	return this.findOne({
		'customer._id': customerId,
		'movie._id': movieId
	})
}

rentalSchema.methods.checkIn = async function () {
	const getNumberOfDays = (start) => {
		const date1 = new Date(start)
		const date2 = new Date()
		// One day in milliseconds
		const oneDay = 1000 * 60 * 60 * 24
		// Calculating the time difference between two dates
		const diffInTime = date2.getTime() - date1.getTime()
		// Calculating the no. of days between two dates
		const diffInDays = Math.round(diffInTime / oneDay)
		return diffInDays
	}

	const daysOut = getNumberOfDays(this.dateOut)
	const rentalFee =
		daysOut > 0
			? daysOut * this.movie.dailyRentalRate
			: this.movie.dailyRentalRate

	this.dateReturned = new Date()
	this.rentalFee = rentalFee
	return await this.save()
}

const Rental = mongoose.model('Rental', rentalSchema)

const rentalValidator = (data) => {
	const joiOptions = { abortEarly: false }

	const rentalSchema = Joi.object({
		customerId: Joi.objectId().required(),
		movieId: Joi.objectId().required()
	})

	const validation = rentalSchema.validate(data, joiOptions)
	if (validation.error) {
		const error = validation.error.details.map((e) => e.message)
		return { error: error }
	}
	return { error: null }
}

module.exports = {
	Rental,
	rentalValidator
}
