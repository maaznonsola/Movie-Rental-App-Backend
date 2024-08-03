const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { User } = require('../../../db/models/User')
const userUrl = '/api/users'

describe('users api', () => {
	let server
	let token
	let userData = {
		name: 'T',
		email: 'someone10@email.com',
		password: 12345678
	}
	beforeEach(async () => {
		server = require('../../../index.js')
		const user = new User(userData)
		await user.save()
		token = user.generateAuthToken()
	})
	afterEach(async () => {
		await server.close()
		await User.deleteMany({})
	})
	afterAll(async () => {
		await mongoose.connection.close()
	})
	describe('GET /my-account', () => {
		const exec = async () => {
			return await request(server)
				.get(`${userUrl}/my-account`)
				.set('x-auth-token', token)
		}
		it('sends a logged in user their user info ', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'T')
			expect(res.body).toHaveProperty('email', 'someone10@email.com')
		})

		it('does not send a user password ', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).not.toHaveProperty('password')
		})

		it('does not include isAdmin property', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).not.toHaveProperty('isAdmin')
		})

		it('includes isAdmin when set to true', async () => {
			const initialRes = await exec()
			// simulates manual db addition of isAdmin to true
			const id = initialRes.body._id
			await User.findByIdAndUpdate(id, { isAdmin: true })
			// Get endpoint can reflect the change
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'T')
			expect(res.body).toHaveProperty('email', 'someone10@email.com')
			expect(res.body).not.toHaveProperty('password')
			expect(res.body).toHaveProperty('isAdmin', true)
		})

		it('returns a 401 when user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
	})
	describe('POST', () => {
		let userData
		beforeEach(() => {
			userData = {
				name: 'L',
				email: 'someone11@email.com',
				password: '12345678'
			}
		})
		const exec = async () => {
			return await request(server)
				.post(userUrl)
				.set('x-auth-token', token)
				.send(userData)
		}
		it('creates a new user with valid user data', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'L')
			expect(res.body).toHaveProperty('email', 'someone11@email.com')
		})
		it('does not send the user password ', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).not.toHaveProperty('password')
		})
		it('creates a new user without isAdmin property', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).not.toHaveProperty('isAdmin')
		})
		it('sends a valid json web token for the user as a header', async () => {
			const res = await exec()
			expect(res.body).toHaveProperty('_id')
			const id = res.body._id
			expect(res.header['x-auth-token']).toBeTruthy()
			const jwtDecoded = jwt.decode(res.header['x-auth-token'])
			expect(jwtDecoded).toHaveProperty('_id', id)
			expect(jwtDecoded).toHaveProperty('iat')
		})

		it('cannot create a new user with an already used email', async () => {
			await exec()
			userData = {
				name: 'X',
				email: 'someone11@email.com',
				password: '1234567890'
			}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bemail\b.*?\balready\b.*?$/im)
		})

		it('returns 400 when invalid user data sent', async () => {
			userData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bemail\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bpassword\b.*?\brequired\b.*?$/im)
		})

		it('returns 400 if password too short', async () => {
			userData.password = '1'
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bpassword\b.*?\blength\b.*?$/im)
		})
	})
})
