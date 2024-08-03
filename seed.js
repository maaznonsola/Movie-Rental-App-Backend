const { Genre } = require('./db//models/Genre')
const { Movie } = require('./db/models/Movie')
const { Customer } = require('./db/models/Customer')
const { Rental } = require('./db/models/Rental')
const mongoose = require('mongoose')
const config = require('config')

const data = [
	{
		name: 'Comedy',
		movies: [
			{ title: 'Austin Powers', numberInStock: 5, dailyRentalRate: 2 },
			{ title: 'Modern Times', numberInStock: 5, dailyRentalRate: 2 },
			{ title: 'Office Space', numberInStock: 15, dailyRentalRate: 2 }
		]
	},
	{
		name: 'Action',
		movies: [
			{ title: 'Aliens', numberInStock: 5, dailyRentalRate: 2 },
			{ title: 'Terminator', numberInStock: 10, dailyRentalRate: 2 },
			{ title: 'Tomb Raider', numberInStock: 15, dailyRentalRate: 2 }
		]
	},
	{
		name: 'Indie',
		movies: [
			{ title: 'Happy Go Lucky', numberInStock: 5, dailyRentalRate: 2 },
			{ title: 'Kajillionaire', numberInStock: 10, dailyRentalRate: 2 },
			{
				title: 'Portrait Of A Lady On Fire',
				numberInStock: 15,
				dailyRentalRate: 2
			}
		]
	},
	{
		name: 'Horror',
		movies: [
			{ title: 'Get Out', numberInStock: 5, dailyRentalRate: 2 },
			{ title: 'Let The Right One In', numberInStock: 15, dailyRentalRate: 2 },
			{
				title: 'Night Of The Living Dead',
				numberInStock: 10,
				dailyRentalRate: 2
			}
		]
	}
]

const customersData = [
	{
		name: 'Sallie Smith',
		phone: '555-555-5555'
	},
	{
		name: 'Dan Donnovan',
		phone: '333-333-3333',
		isGold: true
	},
	{
		name: 'Wendy Wilkins',
		phone: '777-777-7777',
		isGold: true
	}
]

async function seed() {
	await mongoose.connect(config.get('db'))

	// Clear genre and movie collections in the db.
	await Movie.deleteMany({})
	await Genre.deleteMany({})
	await Customer.deleteMany({})
	await Rental.deleteMany({})

	let movies = []
	let customers = []

	// Populate genre and movie collections in db.
	for (let genre of data) {
		const { _id: genreId } = await new Genre({ name: genre.name }).save()
		const moviesData = genre.movies.map((movie) => ({
			...movie,
			genre: { _id: genreId, name: genre.name }
		}))
		for (let movieData of moviesData) {
			const newMovie = await new Movie(movieData).save()
			movies.push(newMovie)
		}
		// await Movie.insertMany(movies)
	}

	for (let customerData of customersData) {
		const newCustomer = await new Customer(customerData).save()
		console.log(newCustomer)
		customers.push(newCustomer)
	}

	for (let index in customers) {
		await new Rental({
			customer: customers[index],
			movie: {
				title: movies[index].title,
				dailyRentalRate: movies[index].dailyRentalRate
			}
		}).save()
	}

	mongoose.disconnect()

	console.info(`Seed data loaded to ${config.get('db')}!`)
}

seed()
