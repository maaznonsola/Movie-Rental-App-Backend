const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const _ = require('lodash')
const { User } = require('../../db/models/User')
const authValidator = require('../../db/models/authValidator')
const validateData = require('../../middleware/validateData')

router.post('/', validateData(authValidator), async (req, res) => {
	const data = req.body
	const user = await User.findOne({ email: data.email })
	if (!user) return res.status(400).send('Username or password incorrect.')
	const validPassword = await bcrypt.compare(data.password, user.password)
	if (!validPassword)
		return res.status(400).send('Username or password incorrect.')
	const token = user.generateAuthToken()
	res.send(token)
})

module.exports = router
