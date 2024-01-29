const properties = require("./json/properties.json");
const users = require("./json/users.json");

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool.query(`SELECT * FROM users WHERE email = $1;`, [email?.toLowerCase()])
    .then((result) => {
      const user = result.rows[0];
      return user;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {

  const query = `
  SELECT * FROM users
  WHERE id = $1;`;

  return pool.query(query, [id])
    .then((result) => {
      const user = result.rows[0];
      return user;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {

  const query = `
  INSERT INTO users (name, password, email)
  VALUES ($1, $2, $3)
  RETURNING *;`;

  const values = [user.name, user.password, user.email];

  return pool.query(query, values)
    .then((result) => {
      const newUser = result.rows[0];
      return newUser;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return getAllProperties(null, 2);
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  //const limitedProperties = {};
  //for (let i = 1; i <= limit; i++) {
  //  limitedProperties[i] = properties[i];
  //}
  //return Promise.resolve(limitedProperties);

  return pool.query(`SELECT * FROM properties LIMIT $1;`, [limit])
    .then((result) => {
      console.log('Query result:', result);
      console.log('Result rows:', result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.error('Error executing query:', err);
      throw err;
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
