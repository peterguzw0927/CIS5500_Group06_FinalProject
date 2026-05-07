const { Pool, types } = require('pg');
const config = require('./config.json');

// Override the default parsing for BIGINT (PostgreSQL type ID 20)
types.setTypeParser(20, val => parseInt(val, 10));

const connection = new Pool({
  host: config.rds_host,
  user: config.rds_user,
  password: config.rds_password,
  port: config.rds_port,
  database: config.rds_db,
  ssl: { rejectUnauthorized: false },
});
connection.connect((err) => err && console.log("Database connection error:", err));

// Helper function for Input Sanity
const getPagination = (req) => {
  const page = isNaN(req.query.page) ? 1 : Math.max(1, parseInt(req.query.page));
  const pageSize = isNaN(req.query.page_size) ? 10 : Math.max(1, parseInt(req.query.page_size));
  const limit = isNaN(req.query.limit) ? pageSize : Math.max(1, parseInt(req.query.limit));
  return { limit: limit, offset: (page - 1) * limit };
};

// =========================================================================
// SIMPLE / STATIC QUERIES
// =========================================================================

const most_delayed = async function (req, res) {
  const { limit, offset } = getPagination(req);
  const minDelay = isNaN(req.query.min_delay) ? 0 : Number(req.query.min_delay);

  connection.query(`
    SELECT flight_date, origin_code, weather_delay_min, late_aircraft_delay_min, 
           (weather_delay_min+late_aircraft_delay_min) AS total_delay_min 
    FROM flight_clean
    WHERE (weather_delay_min + late_aircraft_delay_min) > $1
    ORDER BY total_delay_min DESC
    LIMIT $2 OFFSET $3;
  `, [minDelay, limit, offset], (err, data) => {
    if (err) console.error("❌ Error in most_delayed:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

const cancellations = async function (req, res) {
  const { limit, offset } = getPagination(req);
  connection.query(`
    SELECT origin_code,
           COUNT(flight_id) as total_flights,
           SUM(CASE WHEN is_cancelled THEN 1 ELSE 0 END) as total_cancelled
    FROM flight_clean 
    GROUP BY origin_code
    ORDER BY total_cancelled DESC
    LIMIT $1 OFFSET $2;
  `, [limit, offset], (err, data) => {
    if (err) console.error("❌ Error in cancellations:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

const category_distribution = async function (req, res) {
  const { limit, offset } = getPagination(req);
  connection.query(`
    SELECT category_name, COUNT(gmap_id) as num_businesses
    FROM rds_categories
    GROUP BY category_name
    ORDER BY num_businesses DESC
    LIMIT $1 OFFSET $2;
  `, [limit, offset], (err, data) => {
    if (err) console.error("❌ Error in category_distribution:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

const top_coffee_shops = async function (req, res) {
  const { limit, offset } = getPagination(req);
  const minReviews = isNaN(req.query.min_reviews) ? 500 : Number(req.query.min_reviews);

  connection.query(`
    SELECT b.name, b.address, b.avg_rating, b.num_of_reviews
    FROM rds_businesses b
    JOIN rds_categories c ON b.gmap_id = c.gmap_id
    WHERE c.category_name = 'Coffee shop' AND b.num_of_reviews > $1
    ORDER BY b.avg_rating DESC, b.num_of_reviews DESC
    LIMIT $2 OFFSET $3;
  `, [minReviews, limit, offset], (err, data) => {
    if (err) console.error("❌ Error in top_coffee_shops:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

const top_places = async function (req, res) {
  const { limit, offset } = getPagination(req);
  const category = req.query.category || 'Coffee shop';
  const state = req.query.state ? req.query.state.toUpperCase() : 'NY';

  connection.query(`
    SELECT b.name, b.address, b.avg_rating, b.num_of_reviews
    FROM rds_businesses b
    JOIN rds_categories c ON b.gmap_id = c.gmap_id
    WHERE c.category_name = $1 AND b.state = $2
    ORDER BY b.avg_rating DESC, b.num_of_reviews DESC
    LIMIT $3 OFFSET $4;
  `, [category, state, limit, offset], (err, data) => {
    if (err) console.error("❌ Error in top_places:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

const weekend_24hr = async function (req, res) {
  const { limit, offset } = getPagination(req);
  connection.query(`
    SELECT b.name, b.address
    FROM rds_businesses b
    WHERE EXISTS (
    SELECT 1
    FROM rds_hours h
    WHERE h.gmap_id = b.gmap_id
      AND h.day IN ('Saturday', 'Sunday')
      AND h.hours_text ILIKE '%Open 24 hours%'
      )
    LIMIT $1 OFFSET $2;
  `, [limit, offset], (err, data) => {
    if (err) console.error("❌ Error in weekend_24hr:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

const state_reliability = async function (req, res) {
  connection.query(`
    SELECT 
    ol.origin_state,
    AVG(fc.weather_delay_min) AS avg_weather_delay,
    AVG(fc.late_aircraft_delay_min) AS avg_late_delay
    FROM flight_clean fc
    JOIN origin_locations ol
        ON fc.origin_code = ol.origin_code
    GROUP BY ol.origin_state
    ORDER BY avg_weather_delay DESC;
  `, (err, data) => {
    if (err) console.error("❌ Error in state_reliability:", err.message);
    res.json(err || !data ? [] : data.rows);
  });
}

// =========================================================================
// COMPLEX QUERIES (Using your highly optimized Materialized Views)
// =========================================================================

// Query 1: Problematic Airports & Top Restaurants
const stranded_guide = async function (req, res) {
  console.log(`➡️  [ENDPOINT HIT] GET ${req.originalUrl}`);
  const minRating = isNaN(req.query.rating) ? 4.5 : Number(req.query.rating);
  const minReviews = isNaN(req.query.reviews) ? 500 : Number(req.query.reviews);

  connection.query(`
    SELECT 
        a.airport, 
        a.city, 
        b.name AS business_name, 
        b.avg_rating, 
        STRING_AGG(DISTINCT c.category_name, ', ') AS category_name
    FROM mv_problematic_airports pa
    JOIN airports a ON pa.origin_code = a.iata_code
    JOIN mv_airport_businesses ab ON a.iata_code = ab.iata_code
    JOIN rds_businesses b ON ab.gmap_id = b.gmap_id
    JOIN rds_categories c ON b.gmap_id = c.gmap_id
    WHERE b.avg_rating >= $1 
      AND b.num_of_reviews >= $2
      AND EXISTS (
          SELECT 1 
          FROM rds_categories rc2 
          WHERE rc2.gmap_id = b.gmap_id 
            AND rc2.category_name ILIKE '%Restaurant%'
      )
    GROUP BY 
        pa.cancellation_rate, 
        a.airport, 
        a.city, 
        b.gmap_id, 
        b.name, 
        b.avg_rating
    ORDER BY pa.cancellation_rate DESC, b.avg_rating DESC
    LIMIT 50;
  `, [minRating, minReviews], (err, data) => {
    if (err) {
      console.error("❌ Database Error in stranded_guide:", err.message);
      return res.json([]);
    }
    console.log(`✅ Success: stranded_guide returned ${data.rows.length} rows.`);
    res.json(data.rows);
  });
}

// Query 2: Reliable States & Coffee Shops
const regional_dominance = async function (req, res) {
  console.log(`➡️  [ENDPOINT HIT] GET ${req.originalUrl}`);
  const maxDelay = isNaN(req.query.max_delay) ? 45 : Number(req.query.max_delay);

  connection.query(`
    SELECT 
        sfs.state,
        sfs.total_flights,
        ROUND(sfs.state_avg_delay::NUMERIC, 2) AS state_avg_delay,
        scs.num_coffee_shops,
        ROUND(scs.avg_coffee_rating::NUMERIC, 2) AS avg_coffee_rating
    FROM mv_state_flight_stats sfs
    JOIN mv_state_coffee_stats scs ON sfs.state = scs.state
    WHERE NOT EXISTS (
        SELECT 1 
        FROM mv_airport_delays mv
        WHERE mv.state = sfs.state AND mv.avg_delay > $1
    )
    ORDER BY scs.avg_coffee_rating DESC, sfs.state_avg_delay ASC
    LIMIT 100;
  `, [maxDelay], (err, data) => {
    if (err) {
      console.error("❌ Database Error in regional_dominance:", err.message);
      return res.json([]);
    }
    console.log(`✅ Success: regional_dominance returned ${data.rows.length} rows.`);
    res.json(data.rows);
  });
}

// Query 3: Lodging near Delayed Airports
const no_hotels = async function (req, res) {
  console.log(`➡️  [ENDPOINT HIT] GET ${req.originalUrl}`);
  connection.query(`
    SELECT
        a.airport,
        a.city,
        a.state,
        adr.total_flights,
        ROUND(adr.avg_delay::NUMERIC, 2) AS avg_delay,
        ROUND(adr.severe_delay_rate::NUMERIC, 3) AS severe_delay_rate,
        lb.name AS lodging_name,
        lb.avg_rating,
        lb.num_of_reviews,
        lb.address
    FROM mv_airport_delay_risk adr
    JOIN airports a ON adr.origin_code = a.iata_code
    JOIN mv_airport_nearby_businesses anb ON a.iata_code = anb.iata_code
    JOIN mv_lodging_businesses lb ON anb.gmap_id = lb.gmap_id
    ORDER BY adr.avg_delay DESC, lb.avg_rating DESC
    LIMIT 50;
  `, (err, data) => {
    if (err) {
      console.error("❌ Database Error in no_hotels:", err.message);
      return res.json([]);
    }
    console.log(`✅ Success: no_hotels returned ${data.rows.length} rows.`);
    res.json(data.rows);
  });
}

// Query 4: Evening Delays & Local Restaurants
const pa_restaurants = async function (req, res) {
  console.log(`➡️  [ENDPOINT HIT] GET ${req.originalUrl}`);
  const topN = isNaN(req.query.top_n) ? 3 : Number(req.query.top_n);

  connection.query(`
    WITH RankedResults AS (
       SELECT
           a.iata_code,
           a.airport,
           a.city,
           a.state,
           ead.evening_flights,
           ROUND(ead.avg_evening_delay::NUMERIC, 2) AS avg_evening_delay,
           ROUND(ead.delayed_evening_rate::NUMERIC, 3) AS delayed_evening_rate,
           r.name AS restaurant_name,
           r.avg_rating,
           r.num_of_reviews,
           h.day,
           h.hours_text,
           ROW_NUMBER() OVER (
               PARTITION BY a.iata_code
               ORDER BY r.avg_rating DESC, r.num_of_reviews DESC
           ) AS restaurant_rank
       FROM mv_evening_airport_delay ead
       JOIN airports a ON ead.origin_code = a.iata_code
       JOIN mv_airport_restaurants ar ON a.iata_code = ar.iata_code
       JOIN mv_high_quality_restaurants r ON ar.gmap_id = r.gmap_id
       JOIN rds_hours h ON r.gmap_id = h.gmap_id
       WHERE h.day IN (
           'Monday', 'Tuesday', 'Wednesday', 'Thursday',
           'Friday', 'Saturday', 'Sunday'
       )
    )
    SELECT
       airport,
       city,
       state,
       evening_flights,
       avg_evening_delay,
       delayed_evening_rate,
       restaurant_name,
       avg_rating,
       num_of_reviews,
       day,
       hours_text
    FROM RankedResults
    WHERE restaurant_rank <= $1
    ORDER BY delayed_evening_rate DESC, avg_rating DESC
    LIMIT 50;
  `, [topN], (err, data) => {
    if (err) {
      console.error("❌ Database Error in pa_restaurants:", err.message);
      return res.json([]);
    }
    console.log(`✅ Success: pa_restaurants returned ${data.rows.length} rows.`);
    res.json(data.rows);
  });
}

module.exports = {
  most_delayed,
  cancellations,
  category_distribution,
  top_coffee_shops,
  top_places,
  weekend_24hr,
  state_reliability,
  stranded_guide,
  regional_dominance,
  no_hotels,
  pa_restaurants,
  // Added Aliases so older frontend requests don't 404 crash
  state_restaurants: pa_restaurants,
  evening_delays: pa_restaurants
}