const request = require('supertest')
const mongoose = require('mongoose')
const { Genre } = require('../../../db/models/Genre')
const { Movie } = require('../../../db/models/Movie')
const { User } = require('../../../db/models/User')
const movieUrl = '/api/movies'

describe('Tests for movies api.', () => {
	let server
	let token
	let movieId
	let movieUrlWId
	let validGenre

	// Generate a valid user admin auth token
	const makeValidAdminUserAuthToken = () => {
		const validAdminUser = new User({
			email: 'someone5@email.com',
			password: '12345678',
			name: 'T',
			isAdmin: true
		})
		const token = validAdminUser.generateAuthToken()
		return token
	}

	// Populate database with one valid genre and one valid movie
	const makeAGenreAndMovie = async () => {
		const newGenre = new Genre({ name: 'comedy' })
		const genre = await newGenre.save()
		const newMovie = new Movie({
			title: 'Kajillionaire',
			genre: genre,
			numberInStock: 3,
			dailyRentalRate: 3.0
		})
		const movie = await newMovie.save()
		return { genre, movie }
	}
	// Set up for happy path
	beforeEach(async () => {
		server = require('../../../index.js')
		token = makeValidAdminUserAuthToken()
		// Make a movie
		const { genre, movie } = await makeAGenreAndMovie()
		// Get the movie's id
		movieId = movie._id.toHexString()
		// Create a url with the movie's id
		movieUrlWId = `${movieUrl}/${movieId}`
		// Get the valid genre
		validGenre = genre
	})

	afterEach(async () => {
		await server.close()
		await Movie.deleteMany({})
		await Genre.deleteMany({})
	})
	afterAll(async () => {
		await mongoose.connection.close()
	})

	describe('GET', () => {
		it('gets all movies from db', async () => {
			// Make a second test movie
			const validMovie = new Movie({
				title: 'Invisible Skin',
				genre: validGenre,
				numberInStock: 3,
				dailyRentalRate: 3.0
			})
			await Movie.collection.insertOne(validMovie)
			const res = await request(server).get(movieUrl)
			expect(res.status).toBe(200)
			expect(res.body.length).toBe(2)
			res.body.forEach((movie) => {
				expect(movie).toHaveProperty('_id')
				expect(movie).toHaveProperty('title')
				expect(movie).toHaveProperty('genre')
				expect(movie).toHaveProperty('numberInStock')
				expect(movie).toHaveProperty('dailyRentalRate')
			})
			expect(res.body).toContainEqual(
				expect.objectContaining({
					title: 'Kajillionaire'
				})
			)
			expect(res.body).toContainEqual(
				expect.objectContaining({
					title: 'Invisible Skin'
				})
			)
		})
	})

	describe('GET /:id', () => {
		const exec = async () => {
			return await request(server).get(movieUrlWId)
		}
		it('gets a movie from db by id', async () => {
			const res = await exec()
			expect(res.body).toHaveProperty('_id', movieId)
			expect(res.body).toHaveProperty('title', 'Kajillionaire')
		})
		it('responds with 400 to invalid id', async () => {
			movieUrlWId = `${movieUrl}/1`
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(
				/^.*?\b(no)(?:(|t)?)\b.*?\bvalid\b.*?\bid\b.*?$/im
			)
		})
		it('responds with 404 if no movie with valid sent id found', async () => {
			const objectId = new mongoose.Types.ObjectId()
			const validId = objectId.toHexString()
			movieUrlWId = `${movieUrl}/${validId}`
			const res = await exec()
			expect(res.status).toBe(404)
			expect(res.text).toBeTruthy()
		})
	})

	describe('POST', () => {
		let movieData
		beforeEach(() => {
			movieData = {
				title: 'Little Miss Sunshine',
				genreId: validGenre._id.toHexString(),
				numberInStock: 4,
				dailyRentalRate: 4.0
			}
		})
		const exec = async () => {
			const res = await request(server)
				.post(movieUrl)
				.set('x-auth-token', token)
				.send(movieData)
			return res
		}
		it('creates a new movie with valid data sent', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('title', 'Little Miss Sunshine')
			expect(res.body).toHaveProperty('numberInStock', 4)
			expect(res.body).toHaveProperty('dailyRentalRate', 4.0)
			expect(res.body).toHaveProperty('genre')
			expect(res.body.genre).toHaveProperty('_id')
			expect(res.body.genre).toHaveProperty('name', 'comedy')
		})

		it('returns 400 when invalid movie data sent', async () => {
			movieData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\btitle\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bgenreId\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bnumberInStock\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bdailyRentalRate\b.*?\brequired\b.*?$/im)
		})
		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns a 403 when user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone6@email.com',
				password: '12345678',
				name: 'T'
			})
			token = validUser.generateAuthToken()
			const res = await exec()
			expect(res.status).toBe(403)
			expect(res.text).toMatch(/^.*?\b(no)(?:(|t)?)\b.*?\badmin\b.*?$/im)
		})
	})

	describe('PUT', () => {
		let updateGenreId
		let updatedMovieData
		const exec = async () => {
			return await request(server)
				.put(movieUrlWId)
				.set('x-auth-token', token)
				.send(updatedMovieData)
		}
		beforeEach(async () => {
			// Make a genre to update to
			const updateGenre = new Genre({ name: 'updatedgenre' })
			await updateGenre.save()
			updateGenreId = updateGenre._id.toHexString()
			updatedMovieData = {
				title: 'KajillionaireUpdated',
				genreId: updateGenreId,
				numberInStock: 5,
				dailyRentalRate: 5.0
			}
		})
		it('updates a specific movie with valid data and id', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id', movieId)
			expect(res.body).toHaveProperty('title', 'KajillionaireUpdated')
			expect(res.body).toHaveProperty('numberInStock', 5)
			expect(res.body).toHaveProperty('dailyRentalRate', 5.0)
			expect(res.body).toHaveProperty('genre')
			expect(res.body.genre).toHaveProperty('_id')
			expect(res.body.genre).toHaveProperty('name', 'updatedgenre')
		})
		it('returns 400 when invalid movie data sent', async () => {
			updatedMovieData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\btitle\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bgenreId\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bnumberInStock\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bdailyRentalRate\b.*?\brequired\b.*?$/im)
		})
		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns a 403 when user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone6@email.com',
				password: '12345678',
				name: 'T'
			})
			token = validUser.generateAuthToken()
			const res = await exec()
			expect(res.status).toBe(403)
			expect(res.text).toMatch(/^.*?\b(no)(?:(|t)?)\b.*?\badmin\b.*?$/im)
		})
	})

	describe('DELETE', () => {
		const exec = async () => {
			return await request(server)
				.delete(movieUrlWId)
				.set('x-auth-token', token)
		}
		it('deletes specified movie with valid data sent', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id', movieId)
		})
		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns a 403 when user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone6@email.com',
				password: '12345678',
				name: 'T'
			})
			token = validUser.generateAuthToken()
			const res = await exec()
			expect(res.text).toMatch(/^.*?\b(no)(?:(|t)?)\b.*?\badmin\b.*?$/im)
		})
	})
})
