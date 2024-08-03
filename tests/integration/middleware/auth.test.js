const request = require('supertest')
const mongoose = require('mongoose')
const { User } = require('../../../db/models/User')

describe('auth middleware', () => {
	let server
	let token
	let userData
	beforeEach(async () => {
		server = require('../../../index.js')
		userData = {
			name: 'T',
			email: 'someone@email.com',
			password: 12345678
		}
		const user = new User(userData)
		await user.save()
		token = user.generateAuthToken()
	})
	afterEach(async () => {
		await server.close()
		await User.deleteMany({})
	
	})
	afterAll(async () => {
		await mongoose.disconnect()
	})
	const exec = async () => {
		return await request(server)
			.get('/api/users/my-account')
			.set('x-auth-token', token)
	}
	it('responds with 200 to valid jwt', async () => {
		const res = await exec()
		expect(res.status).toBe(200)
	})
	it('responds with 401 to no jwt', async () => {
		token = ''
		const res = await exec()
		expect(res.status).toBe(401)
		expect(res.text).toMatch(
			/^.*?\baccess\b.*?\bdenied\b.*?\bno\b.*?\bauth\b.*?\btoken\b.*?$/im
		)
	})
	it('responds with 400 to invalid jwt', async () => {
		token = null
		const res = await exec()
		expect(res.status).toBe(400)
		expect(res.text).toMatch(
			/^.*?\baccess\b.*?\bdenied\b.*?\binvalid\b.*?\bauth\b.*?\btoken\b.*?$/im
		)
	})
})
