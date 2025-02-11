const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");
const validateData = require("../../middleware/validateData");
const {Rental, rentalValidator} = require("../../db/models/Rental");
const {Movie} = require("../../db/models/Movie");
const {Customer} = require("../../db/models/Customer");

const movieFound = async (id, res) => {
  const movie = await Movie.findById(id);
  if (!movie) {
    res.status(404).send(`Could not find movie with id ${id}.`);
    return false;
  }
  return movie;
};

const customerFound = async (id, res) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    res.status(404).send(`Could not find customer with id ${id}.`);
    return false;
  }
  return customer;
};

router.get("/", [auth], async (req, res) => {
  const rentals = await Rental.find({}).sort("name");
  res.send(rentals);
});

router.post("/", [auth, validateData(rentalValidator)], async (req, res) => {
  const movieId = req.body.movieId;
  const movie = await movieFound(movieId, res);
  if (!movie) return;
  if (movie.numberInStock < 1) {
    return res.status(400).send("Movie not in stock.");
  }

  const customerId = req.body.customerId;
  const customer = await customerFound(customerId, res);
  if (!customer) return;

  const newRental = new Rental({
    customer: {
      _id: customer._id,
      name: customer.name,
      phone: customer.phone,
      isGold: customer.isGold,
    },
    movie: {
      _id: movie._id,
      title: movie.title,
      dailyRentalRate: movie.dailyRentalRate,
    },
  });

  try {
    await newRental.save();
    await Movie.findByIdAndUpdate(
      movie._id,
      {
        $inc: {numberInStock: -1},
      },
      {new: true}
    );

    res.send(newRental);
  } catch (error) {
    console.error("Error processing rental:", error);
    res.status(500).send("There was an error processing the rental.");
  }
});

module.exports = router;
