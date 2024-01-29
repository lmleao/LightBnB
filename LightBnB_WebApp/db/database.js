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

  const query = `
    SELECT
      reservations.*,
      properties.*,
      AVG(property_reviews.rating) AS average_rating
    FROM
      reservations
    JOIN
      properties ON reservations.property_id = properties.id
    LEFT JOIN
      property_reviews ON properties.id = property_reviews.property_id
    WHERE
      reservations.guest_id = $1
    GROUP BY
      reservations.id, properties.id
    ORDER BY
      reservations.start_date
    LIMIT $2;
  `;

  return pool.query(query, [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.error('Error executing query:', err);
      throw err;
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  let whereAdded = false;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
    whereAdded = true;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `${whereAdded ? ' AND' : 'WHERE'} owner_id = $${queryParams.length}`
    whereAdded = true;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`); // Convert to cents
    queryString += `${whereAdded ? ' AND' : 'WHERE'} cost_per_night >= $${queryParams.length}`;
    whereAdded = true;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    queryString += `${whereAdded ? ' AND' : 'WHERE'} cost_per_night <= $${queryParams.length}`;
    whereAdded = true;
  }

  if (!whereAdded) {
    queryString += `WHERE TRUE`; // Ensures WHERE clause is always present
    whereAdded = true;
  }

  queryString += `
  GROUP BY properties.id
  `;

  if (options.minimum_rating !== undefined) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING AVG(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
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
