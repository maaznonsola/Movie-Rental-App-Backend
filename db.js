const mongoose = require('mongoose')

mongoose
	.connect('mongodb://localhost/playground')
	.then(() => {
		console.log('Connected to mongodb.')
	})
	.catch((err) => {
		console.log('Could not connect to mongo db' + err)
	})

const courseSchema = new mongoose.Schema({
	name: String,
	author: String,
	tags: [String],
	date: { type: Date, default: Date.now() },
	isPublished: Boolean
})

// compile schema into a model to create a class
const Course = mongoose.model('Course', courseSchema)

const createCourse = async () => {
	const course = new Course({
		name: 'React course',
		author: 'Mosh',
		tags: ['react', 'frontend'],
		isPublished: true
	})
	const result = await course.save()
	return result
}

// createCourse()
// Queries return DocumentQuery
const getCourses = async () => {
	const courses = await Course.find({ author: 'Mosh', isPublished: true }) // limit to these attributes
		.limit(2) // how many altogether
		.sort({ name: -1 }) // 1 for asc and -1 for desc
		.select({ name: 1, tags: 1 }) // limits attributes included
	const course = await Course.findById('620df36693e181896fc6afe0')
	console.log(courses)
	console.log(course)
}

// getCourses()

const exerciseOne = async () => {
	const courses = await Course.find()
}
