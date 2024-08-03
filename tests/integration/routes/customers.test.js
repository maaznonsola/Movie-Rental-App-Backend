const { set } = require('lodash')
const mongoose = require('mongoose')
const request = require('supertest')
const { Customer } = require('../../../db/models/Customer')
const { User } = require('../../../db/models/User')
const customerUrl = '/api/customers'

describe('customers api', () => {
	// Set up

	let server
	let token
	let customerId
	let customerIdUrl

	// Generate a valid user admin auth token
	const makeValidAdminUserAuthToken = () => {
		const validAdminUser = new User({
			email: 'someone1@email.com',
			password: '12345678',
			name: 'T',
			isAdmin: true
		})
		const token = validAdminUser.generateAuthToken()
		return token
	}

	const makeACustomer = async () => {
		// Add a valid customer to the db
		const customer = new Customer({
			name: 'T',
			phone: '777-777-7777',
			isGold: true
		})
		await customer.save()
		return customer
	}

	beforeEach(async () => {
		server = require('../../../index.js')
		// Set up for happy path
		// Make a valid admin user auth token
		token = makeValidAdminUserAuthToken()
		const customer = await makeACustomer()
		// Make a valid url from customer's id
		customerId = customer._id.toHexString()
		customerIdUrl = `${customerUrl}/${customerId}`
	})
	afterEach(async () => {
		await server.close()
		await Customer.deleteMany({})
	})
	afterAll(async () => {
		await mongoose.connection.close()
	})

	describe('GET', () => {
		const exec = async () => {
			return await request(server).get(customerUrl).set('x-auth-token', token)
		}

		it('can get all the customers', async () => {
			// Make a second customer
			const customer2 = new Customer({
				name: 'M',
				phone: '999-999-9999',
				isGold: true
			})
			await Customer.collection.insertOne(customer2)
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body.length).toBe(2)
			res.body.forEach((movie) => {
				expect(movie).toHaveProperty('_id')
				expect(movie).toHaveProperty('name')
				expect(movie).toHaveProperty('phone')
				expect(movie).toHaveProperty('isGold')
			})
			expect(res.body).toContainEqual(
				expect.objectContaining({
					name: 'T'
				})
			)
			expect(res.body).toContainEqual(
				expect.objectContaining({
					name: 'M'
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
		let customerData = {
			name: 'J',
			phone: '111-111-1111',
			isGold: true
		}

		const exec = async () => {
			return await request(server)
				.post(customerUrl)
				.set('x-auth-token', token)
				.send(customerData)
		}

		it('can create a new customer', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'J')
			expect(res.body).toHaveProperty('phone', '111-111-1111')
			expect(res.body).toHaveProperty('isGold', true)
		})
		it('by default makes isGold false', async () => {
			delete customerData.isGold
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'J')
			expect(res.body).toHaveProperty('phone', '111-111-1111')
			expect(res.body).toHaveProperty('isGold', false)
		})
		it('returns 400 when invalid movie data sent', async () => {
			customerData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bphone\b.*?\brequired\b.*?$/im)
		})
		it('returns 401 if user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
			expect(true).toBe(true)
		})
		it('returns 403 if user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone2@email.com',
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
		let updatedData
		const exec = async () => {
			return await request(server)
				.put(customerIdUrl)
				.set('x-auth-token', token)
				.send(updatedData)
		}
		beforeEach(() => {
			updatedData = {
				name: 'Updated',
				phone: '000-000-0000',
				isGold: false
			}
		})
		it('can update a specified customer', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'Updated')
			expect(res.body).toHaveProperty('phone', '000-000-0000')
			expect(res.body).toHaveProperty('isGold', false)
		})
		it('responds with 400 to invalid id', async () => {
			customerIdUrl = `${customerUrl}/1`
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(
				/^.*?\b(no)(?:(|t)?)\b.*?\bvalid\b.*?\bid\b.*?$/im
			)
		})
		it('responds with 400 to invalid customer data', async () => {
			updatedData = {}
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(/^.*?\bname\b.*?\brequired\b.*?$/im)
			expect(res.text).toMatch(/^.*?\bphone\b.*?\brequired\b.*?$/im)
		})
		it('responds with 404 if no customer with valid sent id found', async () => {
			const objectId = new mongoose.Types.ObjectId()
			const voidId = objectId.toHexString()
			customerIdUrl = `${customerUrl}/${voidId}`
			const res = await exec()
			expect(res.status).toBe(404)
			expect(res.text).toBeTruthy()
		})
		it('returns 401 if user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('returns 403 if user does not have admin status', async () => {
			const validUser = new User({
				email: 'someone2@email.com',
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
			return await await request(server)
				.delete(customerIdUrl)
				.set('x-auth-token', token)
		}
		it('can delete a specified customer', async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.body).toHaveProperty('_id')
			expect(res.body).toHaveProperty('name', 'T')
			expect(res.body).toHaveProperty('phone', '777-777-7777')
			expect(res.body).toHaveProperty('isGold', true)
		})
		it('responds with 400 to invalid id', async () => {
			customerIdUrl = `${customerUrl}/${1}`
			const res = await exec()
			expect(res.status).toBe(400)
			expect(res.text).toMatch(
				/^.*?\b(no)(?:(|t)?)\b.*?\bvalid\b.*?\bid\b.*?$/im
			)
		})
		it('responds with 404 if no customer found when valid id sent', async () => {
			const objectId = new mongoose.Types.ObjectId()
			const voidId = objectId.toHexString()
			customerIdUrl = `${customerUrl}/${voidId}`
			const res = await exec()
			expect(res.status).toBe(404)
			expect(res.text).toBeTruthy()
		})
		it('responds with 401 if user not logged in', async () => {
			token = ''
			const res = await exec()
			expect(res.status).toBe(401)
		})
		it('responds with 403 if user not admin', async () => {
			const validUser = new User({
				email: 'someone2@email.com',
				password: '12345678',
				name: 'T'
			})
			token = validUser.generateAuthToken()
			const res = await exec()
			expect(res.status).toBe(403)
			expect(res.text).toMatch(/^.*?\b(no)(?:(|t)?)\b.*?\badmin\b.*?$/im)
		})
	})
})
