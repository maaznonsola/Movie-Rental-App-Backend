# Movie Rental App Backend v2

This backend app is based on [Vidly (Rental App) Backend v1](https://github.com/maaznonsola/vidly-api-node). This version has many distinctions and latest libraries.

Some key changes to this version include:

- Use of updated libraries and dependencies and relevant code changes throughout code base.
- Use of `mongoose` for `MongoDB` transactions to replace deprecated `fawn` library.
- Requires a `MongoDB` replica set for transactions.
- Significant additional Jest tests for higher test coverage.
- Use of GitHub Actions for CI (continuous integration with PR's triggering Jest tests).

The focus in this application was to:

- Use modern Node features and libraries
- Use contemporary Express features and best practices to build the API
- Make good use of middleware to simplify code and minimize duplication
- Establish a maintainable, clean code base
- Write enough tests to get good code coverage and encourage ongoing refactoring
- Practice TDD to gain intuitive sense of advantages in code-first and test-first workflows
- Keep learning practices as close to real-world development work as possible

This version of the application does not focus on or include:

- Jest test design that allows a pool of workers to run tests concurrently (tests are slow)

The [Fronted React application](https://github.com/maaznonsola/Movie-Rental-App-Frontend-v2) can also be viewed on GitHub.

## Application Context Overview

The mock context for this application was a Movie rental shop.

Two distinct user groups would be using the website.

1. Employees wanting to assist customers in renting and returning movies.

2. Managers wanting to manage inventory and customer profiles.

## Context to Concept Mapping Auth And Admin

The app meets an early set of necessary functionality. Based on the assumption that future features would likely be added, the following conceptual points would be useful for developers:

1. Regular employees can register as users and sign in to gain authenticated status.

2. Managers must have both registered / logged in auth status and further authorization status. This change gets made when someone with database access adds `isAdmin: true` to the employee's user document.

## Key Features By Auth & Admin Status

This backend application enforces the following levels of access, which are reflected by the React frontend application.

### 1. No Auth & No Admin status

A site visitor who has not registered / logged in can:

- See genres
- See movies
- Register as a user
- Login as a user

### 2. Auth & No Admin status

A logged in user who is not admin can also:

- Logout and return to not logged in UI state
- See all customers
- See all rentals
- Search rentals
- Create new rentals
- Check in rentals

### 3. Auth & Admin status

A logged in user who is an admin can:

- Add / update genres
- Add / update / delete movies
- Add / update / delete customers

## Local development

### For the backend:

To run this app in a local development environment:

- Check that a recent version of Node is installed.
- Clone the [GitHub repo](https://github.com/maaznonsola/Movie-Rental-App-Backend).
- Run `npm install`.
- Set an environment variable `vidly_db` to a MongoDB database in MongoDB Atlas or on local.
- Run with `node index.js` or `nodemon index.js` with global `nodemon` install.

### For the frontend:

- Refer the [Frontend Documentation](https://github.com/maaznonsola/Movie-Rental-App-Frontend-v2/blob/master/README.md).

### Important Note:

The backend application uses `mongoose` for `MongoDB` transactions, which require a replica set. The easiest way to get this set up for dev is to use [Mongo DB Atlas](https://www.mongodb.com/atlas/database) free tier.
