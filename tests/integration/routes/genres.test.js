const request = require('supertest')
const mongoose = require('mongoose')
const { Genre } = require('../../../db/models/Genre')
const { User } = require('../../../db/models/User')
const genreUrl = '/api/genres'

describe('Tests for genres api.', () => {
	let server
	const validGenreData = [{ name: 'genre1' }, { name: 'genre2' }]
	beforeEach(async () => {
		server = require('../../../index.js')
	})

	afterEach(async () => {
		await server.close()
		await Genre.deleteMany({})
	})
	afterAll(async () => {
		await mongoose.connection.close()
	})
	describe('GET', () => {
		it('gets all genres from db', async () => {
			await Genre.collection.insertMany(validGenreData)
			const res = await request(server).get(genreUrl)
			expect(res.status).toBe(200)
			expect(res.body.length).toBe(2)
			res.body.forEach((genre) => {
				expect(genre).toHaveProperty('_id')
				expect(genre).toHaveProperty('name')
			})
			expect(res.body).toContainEqual(
				expect.objectContaining({
					name: 'genre1'
				})
			)
			expect(res.body).toContainEqual(
				expect.objectContaining({
					name: 'genre2'
				})
			)
		})
	})
	describe('GET /:id', () => {
		it('gets a genre from db by id', async () => {
			const newGenre = new Genre({ name: 'genre1' })
			await newGenre.save()
			const id = newGenre._id.toHexString()
			const res = await request(server).get(`${genreUrl}/${id}`)
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id', id)
			expect(res.body).toHaveProperty('name', 'genre1')
		})
		it('responds with 400 to invalid id', async () => {
			const res = await request(server).get(`${genreUrl}/1`)
			expect(res.status).toBe(400)
			expect(res.text).toMatch(
				/^.*?\b(no)(?:(|t)?)\b.*?\bvalid\b.*?\bid\b.*?$/im
			)
		})
		it('responds with 404 if no genre with valid sent id found', async () => {
			const objectId = new mongoose.Types.ObjectId()
			const validId = objectId.toHexString()
			const res = await request(server).get(`${genreUrl}/${validId}`)
			expect(res.status).toBe(404)
			expect(res.text).toBeTruthy()
		})
	})
	describe('POST', () => {
		let token
		let genreData = { name: 'genre1' }
		const exec = async () => {
			const res = await request(server)
				.post(genreUrl)
				.set('x-auth-token', token)
				.send(genreData)
			return res
		}
		beforeEach(async () => {
			const validAdminUser = new User({
				email: 'someone3@email.com',
				password: '12345678',
				name: 'T',
				isAdmin: true
			})
			token = validAdminUser.generateAuthToken()
			name = 'genre1'
		})
		it('creates a new genre with valid data sent', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'genre1')
		})
		it('returns 400 when invalid genre data sent: no name', async () => {
			genreData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\brequired\b.*?$/im)
		})
		it('returns 400 when invalid genre data sent: name too short', async () => {
			genreData = { name: 'g' }
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\blength\b.*?$/im)
		})
		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns a 403 when user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone4@email.com',
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
		let token
		let newGenre
		let id
		let validIdUrl
		let genreData = { name: 'genreupdated' }
		const exec = async () => {
			return await request(server)
				.put(validIdUrl)
				.set('x-auth-token', token)
				.send(genreData)
		}
		beforeEach(async () => {
			const validAdminUser = new User({
				email: 'someone4@email.com',
				password: '12345678',
				name: 'T',
				isAdmin: true
			})
			token = validAdminUser.generateAuthToken()
			newGenre = new Genre({ name: 'genre1' })
			await newGenre.save()
			id = newGenre._id.toHexString()
			validIdUrl = `${genreUrl}/${id}`
		})
		it('updates a specific genere with valid data and id', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id', id)
			expect(res.body).toHaveProperty('name', 'genreupdated')
		})
		it('returns 400 when invalid genre data sent: no name', async () => {
			genreData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\brequired\b.*?$/im)
		})
		it('returns 400 when invalid genre data sent: name too short', async () => {
			genreData = { name: 'g' }
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\blength\b.*?$/im)
		})
		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns a 403 when user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone4@email.com',
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
		let token
		let newGenre
		let id
		let validIdUrl
		const exec = async () => {
			return await request(server).delete(validIdUrl).set('x-auth-token', token)
		}
		beforeEach(async () => {
			const validAdminUser = new User({
				email: 'someone4@email.com',
				password: '12345678',
				name: 'T',
				isAdmin: true
			})
			token = validAdminUser.generateAuthToken()
			newGenre = new Genre({ name: 'genre1' })
			await newGenre.save()
			id = newGenre._id.toHexString()
			validIdUrl = `${genreUrl}/${id}`
		})
		it('deletes specified genre with valid data sent', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id', id)
			expect(res.body).toHaveProperty('name', 'genre1')
		})
		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns a 403 when user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone4@email.com',
				password: '12345678',
				name: 'T'
			})
			token = validUser.generateAuthToken()
			const res = await exec()
			expect(res.text).toMatch(/^.*?\b(no)(?:(|t)?)\b.*?\badmin\b.*?$/im)
		})
	})
})
