const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { User } = require('../../../db/models/User')
const authUrl = '/api/auth'

describe('users api', () => {
	let server
	let userData
	let authData
	let userId

	beforeEach(async () => {
		server = require('../../../index.js')

		const encryptPw = async (pw) => {
			const salt = await bcrypt.genSalt()
			const hashedPassword = await bcrypt.hash(pw, salt)
			return hashedPassword
		}
		const encryptedPw = await encryptPw('12345678')
		userData = {
			name: 'T',
			email: 'someone@email.com',
			password: encryptedPw
		}
		authData = {
			email: 'someone@email.com',
			password: '12345678'
		}
		const user = new User(userData)
		await user.save()
		userId = user._id.toHexString()
	})
	afterEach(async () => {
		await server.close()
		await User.deleteMany({})
	})
	afterAll(async () => {
		await mongoose.disconnect()
	})
	const exec = async () => {
		return await request(server).post(authUrl).send(authData)
	}
	describe('POST', () => {
		it('returns valid json web token when sent correct login email and password', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			const token = res.text
			const decodedJwt = jwt.decode(token)
			expect(decodedJwt).toHaveProperty('_id', userId)
			expect(decodedJwt).toHaveProperty('iat')
		})
		it('includes no isAdmin value in the token', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			const token = res.text
			const decodedJwt = jwt.decode(token)
			expect(decodedJwt).not.toHaveProperty('isAdmin')
		})

		it('includes isAdmin value for an admin user', async () => {
			await User.findByIdAndUpdate(userId, { isAdmin: true })
			const res = await exec()
			expect(res.status).toBe(200)
			const token = res.text
			const decodedJwt = jwt.decode(token)
			expect(decodedJwt).toHaveProperty('_id', userId)
			expect(decodedJwt).toHaveProperty('iat')
			expect(decodedJwt).toHaveProperty('isAdmin', true)
		})

		it('errors clearly without email', async () => {
			delete authData.email
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bemail\b.*?\brequired\b.*?$/im)
		})
		it('errors clearly without password', async () => {
			delete authData.password
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bpassword\b.*?\brequired\b.*?$/im)
		})

		it('sends 400 if user cannot be found in db by email', async () => {
			authData.email = 'unknown@email.com'
			const res = await exec()
			expect(res.status).toBe(400)
			//  ambiguous message
			expect(res.text).toMatch(/^.*?\busername\b.*?\bpassword\b.*?$/im)
		})
		it('sends 400 with incorrect password', async () => {
			authData.password = 'xxxxxxxxxx'
			const res = await exec()
			expect(res.status).toBe(400)
			//  ambiguous message
			expect(res.text).toMatch(/^.*?\busername\b.*?\bpassword\b.*?$/im)
		})
	})
})
