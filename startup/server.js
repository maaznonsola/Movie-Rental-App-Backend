const app = require('../index.js')
console.log(app)
console.log(app.listen)

const port = process.env.PORT || 5000
app.listen(port, () => {
	logger.log('info', `Listening on port ${port}...`)
})
