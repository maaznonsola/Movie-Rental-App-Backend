const express = require('express')
const router = express.Router()
const validateData = require('../../middleware/validateData')
const auth = require('../../middleware/auth')
const { Rental, rentalValidator } = require('../../db/models/Rental')
const { Movie } = require('../../db/models/Movie')

router.post('/', auth, validateData(rentalValidator), async (req, res) => {
	const customerId = req.body.customerId
	const movieId = req.body.movieId
	const rental = await Rental.lookup(customerId, movieId)
	if (!rental) {
		return res
			.status(404)
			.send('Cannot find a rental for this customer and movie.')
	}
	if (rental.dateReturned) {
		return res
			.status(400)
			.send(`Rental already returned on ${rental.dateReturned}.`)
	}

	const updatedRental = await rental.checkIn()
	await Movie.findOneAndUpdate(rental.movie._id, {
		$inc: { numberInStock: 1 }
	})
	return res.send(updatedRental)
})

module.exports = router
