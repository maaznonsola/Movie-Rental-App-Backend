const mongoose = require('mongoose')
const request = require('supertest')
const { User } = require('../../../db/models/User')
const { Rental } = require('../../../db/models/Rental')
const { Movie } = require('../../../db/models/Movie')
const { Genre } = require('../../../db/models/Genre')
const { Customer } = require('../../../db/models/Customer')
const rentalUrl = '/api/rentals'

describe('rentals api', () => {
	let server
	let token
	let movie
	let movie2
	let customer
	let customer2

	// Set up for happy path

	// Generate a valid user admin auth token
	const makeValidAdminUserAuthToken = () => {
		const validAdminUser = new User({
			email: 'someone@email7.com',
			password: '12345678',
			name: 'T',
			isAdmin: true
		})
		const token = validAdminUser.generateAuthToken()
		return token
	}

	// Populate database with one valid genre and one valid movie
	const makeAGenreAndTwoMovies = async () => {
		const newGenre = new Genre({ name: 'comedy' })
		const genre = await newGenre.save()
		const newMovie = new Movie({
			title: 'Kajillionaire',
			genre: genre,
			numberInStock: 1,
			dailyRentalRate: 3.0
		})
		const movieOne = await newMovie.save()
		const movieTwo = new Movie({
			title: 'Little Miss Sunshine',
			genre: genre,
			numberInStock: 2,
			dailyRentalRate: 4.0
		})
		await movieOne.save()
		await movieTwo.save()
		return { movieOne, movieTwo }
	}

	// Populate database with one valid customer
	const makeTwoCustomers = async () => {
		// Add a valid customer to the db
		const customerOne = new Customer({
			name: 'T',
			phone: '777-777-7777',
			isGold: true
		})
		await customerOne.save()
		const customerTwo = new Customer({
			name: 'J',
			phone: '888-888-8888',
			isGold: false
		})
		await customerTwo.save()
		return { customerOne, customerTwo }
	}

	beforeEach(async () => {
		server = require('../../../index.js')
		// Make a token
		token = makeValidAdminUserAuthToken()
		// Make a genre and a movie
		const { movieOne, movieTwo } = await makeAGenreAndTwoMovies()
		movie = movieOne
		movie2 = movieTwo
		// Make a customer
		const { customerOne, customerTwo } = await makeTwoCustomers()
		customer = customerOne
		customer2 = customerTwo
	})

	afterEach(async () => {
		await server.close()
		await Rental.deleteMany({})
		await Customer.deleteMany({})
		await Movie.deleteMany({})
		await Genre.deleteMany({})
	})
	afterAll(async () => {
		mongoose.connection.close()
	})

	describe('GET', () => {
		const exec = async () => {
			return await request(server).get(rentalUrl).set('x-auth-token', token)
		}

		it('can get all rentals', async () => {
			// Add two rentals to db
			const rental1 = new Rental({ movie, customer })
			const rental2 = new Rental({ movie: movie2, customer: customer2 })
			await Rental.collection.insertMany([rental1, rental2])
			const res = await exec()
			expect(res.status).toBe(200)
			res.body.forEach((rental) => {
				expect(rental).toHaveProperty('_id')
				expect(rental).toHaveProperty('movie')
				expect(rental).toHaveProperty('customer')
				expect(rental).toHaveProperty('dateOut')
			})

			expect(res.body).toContainEqual(
				expect.objectContaining({
					customer: {
						_id: customer._id.toHexString(),
						name: customer.name,
						phone: customer.phone,
						isGold: customer.isGold
					}
				})
			)
			expect(res.body).toContainEqual(
				expect.objectContaining({
					movie: {
						_id: movie._id.toHexString(),
						title: movie.title,
						dailyRentalRate: movie.dailyRentalRate
					}
				})
			)

			expect(res.body).toContainEqual(
				expect.objectContaining({
					customer: {
						_id: customer2._id.toHexString(),
						name: customer2.name,
						phone: customer2.phone,
						isGold: customer2.isGold
					}
				})
			)
			expect(res.body).toContainEqual(
				expect.objectContaining({
					movie: {
						_id: movie2._id.toHexString(),
						title: movie2.title,
						dailyRentalRate: movie2.dailyRentalRate
					}
				})
			)
		})

		it('returns 401 if user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
			expect(true).toBe(true)
		})
	})

	describe('POST', () => {
		let rentalData
		const objectId = new mongoose.Types.ObjectId()
		const voidId = objectId.toHexString()

		const exec = async () => {
			return await request(server)
				.post(rentalUrl)
				.set('x-auth-token', token)
				.send(rentalData)
		}
		beforeEach(() => {
			rentalData = {
				movieId: movie._id.toHexString(),
				customerId: customer._id.toHexString()
			}
		})
		it('can create a new rental with valid data', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('dateOut')
			expect(res.body).toHaveProperty('movie', {
				_id: movie._id.toHexString(),
				title: movie.title,
				dailyRentalRate: movie.dailyRentalRate
			})
			expect(res.body).toHaveProperty('customer', {
				_id: customer._id.toHexString(),
				name: customer.name,
				phone: customer.phone,
				isGold: customer.isGold
			})
		})

		it('changes the rented movie numberInStock to one fewer', async () => {
			// Run twice on a movie with only 1 in stock
			await exec()
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bnot\b.*?\bin\b.*?\bstock\b.*?$/im)
		})

		it('returns 400 when invalid rental data sent', async () => {
			rentalData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bmovieId\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bcustomerId\b.*?\brequired\b.*?$/im)
		})
		it('responds with 400 if movie not in stock', async () => {
			// Rent movie with 1 in stock
			const newGenre = new Genre({ name: 'indie' })
			await newGenre.save()
			const outOfStockMovie = new Movie({
				title: 'First Cow',
				genre: newGenre,
				numberInStock: 0,
				dailyRentalRate: 3.0
			})
			await outOfStockMovie.save()
			rentalData.movieId = outOfStockMovie._id.toHexString()
			const res = await exec()
			expect(res.status).toBe(400)
		})
		it('responds with 404 if customer not found wtih valid id', async () => {
			rentalData.customerId = voidId
			const res = await exec()
			expect(res.status).toBe(404)
			expect(res.text).toMatch(
				/^.*?\bnot\b.*?\bfind\b.*?\bcustomer\b.*?\bid\b.*?$/im
			)
		})
		it('responds with 404 if movie not found with valid id', async () => {
			rentalData.movieId = voidId
			const res = await exec()
			expect(res.status).toBe(404)
			expect(res.text).toMatch(
				/^.*?\bnot\b.*?\bfind\b.*?\bmovie\b.*?\bid\b.*?$/im
			)
			expect(true).toBe(true)
		})
		it('returns 401 if user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
			expect(true).toBe(true)
		})
	})
})
