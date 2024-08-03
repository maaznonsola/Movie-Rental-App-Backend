const { Rental } = require('../../../db/models/Rental')
const { User } = require('../../../db/models/User')
const { Movie } = require('../../../db/models/Movie')
const request = require('supertest')
const mongoose = require('mongoose')

describe('Tests for returns api', () => {
	const returnsUrl = '/api/returns'
	let server
	let customerId
	let movieId
	let token
	let rental
	let movie

	beforeEach(async () => {
		server = require('../../../index.js')
		customerId = mongoose.Types.ObjectId().toHexString()
		movieId = mongoose.Types.ObjectId().toHexString()
		const rentalData = {
			customer: {
				_id: customerId,
				name: 'Sadie Smith',
				phone: '777-777-7777',
				isGold: true
			},
			movie: {
				_id: movieId,
				title: 'Happy Go Lucky',
				dailyRentalRate: 2
			}
		}
		rental = new Rental(rentalData)
		await rental.save()
		// Put a corresponding movie into the db for testing change of numberInStock
		movie = new Movie({
			_id: movieId,
			title: 'Happy Go Lucky',
			dailyRentalRate: 2,
			genre: { name: 'Indie' },
			numberInStock: 10
		})
		await movie.save()

		const userData = {
			name: 'T',
			email: 'someone9@email.com',
			password: 12345678
		}
		const user = new User(userData)
		token = user.generateAuthToken()
	})
	afterEach(async () => {
		await server.close()
		await Rental.deleteMany({})
		await Movie.deleteMany({})
	})
	afterAll(async () => {
		await mongoose.connection.close()
	})
	const exec = async () => {
		return await request(server)
			.post(returnsUrl)
			.set('x-auth-token', token)
			.send({ customerId, movieId })
	}
	it('should return with 401 if user not signed in', async () => {
		token = ''
		const res = await exec()
		expect(res.status).toBe(401)
	})
	it('should return 400 if customerId not sent', async () => {
		customerId = ''
		const res = await exec()
		expect(res.status).toBe(400)
		expect(res.text).toMatch(/^.*?\bcustomerId\b.*?\bempty\b.*?$/im)
	})
	it('should return 400 if movieId not sent', async () => {
		movieId = ''
		const res = await exec()
		expect(res.status).toBe(400)
		expect(res.text).toMatch(/^.*?\bmovieId\b.*?\bempty\b.*?$/im)
	})
	it('should return 404 if rental for customer id not found', async () => {
		customerId = mongoose.Types.ObjectId().toHexString()
		const res = await exec()
		expect(res.status).toBe(404)
		expect(res.text).toMatch(/^.*?\bcannot\b.*?\bfind\b.*?\brental\b.*?$/im)
	})
	it('should return 400 if rental already processed', async () => {
		await exec()
		const res = await exec()
		expect(res.status).toBe(400)
		expect(res.text).toMatch(
			/^.*?\brental\b.*?\balready\b.*?\breturned\b.*?$/im
		)
	})
	it('should return 200 to a valid request', async () => {
		const res = await exec()
		expect(res.status).toBe(200)
	})
	it('should set the dateReturned on the rental', async () => {
		const res = await exec()
		const dateDiff = new Date() - new Date(res.body.dateReturned)
		expect(dateDiff).toBeLessThan(10 * 1000)
	})
	it('should calculate the rental fee', async () => {
		// Adjust rental date to 4 days ago.
		const twoDaysAgo = new Date() - 1000 * 60 * 60 * 24 * 4
		rental.dateOut = new Date(twoDaysAgo)
		await rental.save()
		const res = await exec()
		expect(res.body.rentalFee).toBe(8)
	})
	it('should charge one dailyRentalFee for same day return', async () => {
		const res = await exec()
		expect(res.body.rentalFee).toBe(2)
	})
	it('should increment the movie numberInStock by 1', async () => {
		await exec()
		const movieInDb = await Movie.findById(movieId)
		expect(movieInDb.numberInStock).toBe(movie.numberInStock + 1)
	})
	it('should return the rental in the response body', async () => {
		const res = await exec()
		expect(Object.keys(res.body)).toEqual([
			'_id',
			'customer',
			'movie',
			'dateOut',
			'__v',
			'dateReturned',
			'rentalFee'
		])
	})
})
