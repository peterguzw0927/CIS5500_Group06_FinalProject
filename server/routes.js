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
  ssl: {
    rejectUnauthorized: false,
  },
});
connection.connect((err) => err && console.log(err));

// Route 1: GET /flights/most_delayed
const most_delayed = async function (req, res) {
  // Extract pagination parameters or default to page 1, size 10
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
  const offset = (page - 1) * pageSize;

  connection.query(`
    SELECT flight_date, origin_code, origin_city, weather_delay_min, late_aircraft_delay_min, 
           (weather_delay_min+late_aircraft_delay_min) AS total_delay_min 
    FROM flight_clean
    WHERE weather_delay_min > 0 OR late_aircraft_delay_min > 0
    ORDER BY (weather_delay_min + late_aircraft_delay_min) DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 2: GET /airports/cancellations
const cancellations = async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
  const offset = (page - 1) * pageSize;

  connection.query(`
    SELECT origin_code, origin_city,
           COUNT(flight_id) as total_flights,
           SUM(CASE WHEN is_cancelled THEN 1 ELSE 0 END) as total_cancelled
    FROM flight_clean 
    GROUP BY origin_code, origin_city
    ORDER BY total_cancelled DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 3: GET /businesses/category_distribution
const category_distribution = async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
  const offset = (page - 1) * pageSize;

  connection.query(`
    SELECT category_name, COUNT(gmap_id) as num_businesses
    FROM rds_categories
    GROUP BY category_name
    ORDER BY num_businesses DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 4: GET /businesses/top_coffee_shops
const top_coffee_shops = async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
  const offset = (page - 1) * pageSize;
  const minReviews = req.query.min_reviews || 500;

  connection.query(`
    SELECT b.name, b.address, b.avg_rating, b.num_of_reviews
    FROM rds_businesses b
    JOIN rds_categories c ON b.gmap_id = c.gmap_id
    WHERE c.category_name = 'Coffee shop' AND b.num_of_reviews > ${minReviews}
    ORDER BY b.avg_rating DESC, b.num_of_reviews DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 5: GET /businesses/weekend_24hr
const weekend_24hr = async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
  const offset = (page - 1) * pageSize;

  connection.query(`
    SELECT DISTINCT b.name, b.address, h.hours_text
    FROM rds_businesses b
    JOIN rds_hours h ON b.gmap_id = h.gmap_id
    WHERE h.day IN ('Saturday', 'Sunday') AND h.hours_text LIKE '%Open 24 hours%'
    LIMIT ${pageSize} OFFSET ${offset};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 6: GET /flights/state_reliability
const state_reliability = async function (req, res) {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const pageSize = req.query.page_size ? parseInt(req.query.page_size) : 10;
  const offset = (page - 1) * pageSize;

  connection.query(`
    SELECT origin_state, 
           AVG(weather_delay_min) as avg_weather_delay, 
           AVG(late_aircraft_delay_min) as avg_late_delay
    FROM flight_clean
    GROUP BY origin_state
    ORDER BY avg_weather_delay DESC
    LIMIT ${pageSize} OFFSET ${offset};
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 7: GET /airports/stranded_guide (Complex)
// Note: Kept without pagination because FlightsPage uses DataGrid which handles pagination client-side
const stranded_guide = async function (req, res) {
  const minDelay = req.query.min_delay || 60;
  connection.query(`
    SELECT a.AIRPORT, a.CITY, a.STATE, AVG(f.weather_delay_min) as avg_weather_delay,
           COUNT(DISTINCT b.gmap_id) as nearby_excellent_hotels
    FROM airports a
    JOIN flight_clean f ON a.IATA_CODE = f.origin_code
    JOIN rds_businesses b ON b.address LIKE '%' || a.CITY || ', ' || a.STATE || '%'
    JOIN rds_categories c ON b.gmap_id = c.gmap_id
    WHERE c.category_name IN ('Hotel', 'Motel') 
      AND b.avg_rating >= 4.0 
      AND f.weather_delay_min > ${minDelay}
    GROUP BY a.AIRPORT, a.CITY, a.STATE
    HAVING COUNT(DISTINCT b.gmap_id) < 5	
    ORDER BY avg_weather_delay DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 8: GET /airports/pa_restaurants (Complex)
const pa_restaurants = async function (req, res) {
  connection.query(`
    WITH airport_restaurants AS (
        SELECT
            a.iata_code,
            a.airport,
            a.city,
            COUNT(DISTINCT r.gmap_id)          AS nearby_restaurants,
            ROUND(AVG(r.avg_rating)::numeric, 2) AS avg_restaurant_rating
        FROM airports a
        JOIN pa_restaurants r
            ON r.latitude  BETWEEN a.latitude  - 0.3 AND a.latitude  + 0.3
           AND r.longitude BETWEEN a.longitude - 0.3 AND a.longitude + 0.3
        WHERE a.state = 'PA'
        GROUP BY a.iata_code, a.airport, a.city
    ),
    flight_stats AS (
        SELECT
            origin_code,
            ROUND(AVG(weather_delay_min)::numeric, 2)       AS avg_weather_delay,
            ROUND(AVG(late_aircraft_delay_min)::numeric, 2) AS avg_late_aircraft_delay
        FROM flight_clean
        WHERE weather_delay_min > 0 OR late_aircraft_delay_min > 0
        GROUP BY origin_code
    )
    SELECT
        ar.airport,
        ar.city,
        fs.avg_weather_delay,
        fs.avg_late_aircraft_delay,
        ar.nearby_restaurants,
        ar.avg_restaurant_rating,
        RANK() OVER (ORDER BY fs.avg_weather_delay DESC) AS weather_delay_rank
    FROM airport_restaurants ar
    JOIN flight_stats fs ON ar.iata_code = fs.origin_code
    ORDER BY weather_delay_rank;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 9: GET /states/regional_dominance (Complex)
const regional_dominance = async function (req, res) {
  connection.query(`
    WITH StateDelays AS (
        SELECT a.STATE as origin_state_code, SUM(f.is_cancelled::int) as total_cancellations
        FROM flight_clean f
        JOIN airports a ON f.origin_code = a.IATA_CODE
        GROUP BY a.STATE
    ),
    StateBusinesses AS (
        SELECT b.state as state_code,
               c.category_name,
               COUNT(*) as business_count
        FROM rds_businesses b
        JOIN rds_categories c ON b.gmap_id = c.gmap_id
        WHERE b.state IS NOT NULL
        GROUP BY b.state, c.category_name
    ),
    RankedBusinesses AS (
        SELECT state_code, category_name, business_count,
               RANK() OVER(PARTITION BY state_code ORDER BY business_count DESC) as cat_rank
        FROM StateBusinesses
    )
    SELECT sd.origin_state_code, sd.total_cancellations, rb.category_name
    FROM StateDelays sd
    JOIN RankedBusinesses rb ON sd.origin_state_code = rb.state_code
    WHERE rb.cat_rank = 1
    ORDER BY sd.total_cancellations DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

// Route 10: GET /airports/no_hotels (Complex)
const no_hotels = async function (req, res) {
  const minDelay = req.query.min_delay || 60;
  connection.query(`
    WITH delayed_airports AS (
       SELECT
           a.iata_code,
           a.airport,
           a.city,
           a.state,
           ROUND(AVG(f.weather_delay_min)::numeric, 2) AS avg_weather_delay
       FROM airports a
       JOIN flight_clean f ON a.iata_code = f.origin_code
       WHERE f.weather_delay_min > ${minDelay}
       GROUP BY a.iata_code, a.airport, a.city, a.state
    )
    SELECT
       da.airport,
       da.city,
       da.state,
       da.avg_weather_delay
    FROM delayed_airports da
    WHERE NOT EXISTS (
       SELECT 1
       FROM rds_businesses b
       JOIN rds_categories c ON b.gmap_id = c.gmap_id
       WHERE c.category_name IN ('Hotel', 'Motel')
         AND b.avg_rating >= 4.0
         AND b.state = da.state
    )
    ORDER BY da.avg_weather_delay DESC;
  `, (err, data) => {
    if (err) {
      console.log(err);
      res.json([]);
    } else {
      res.json(data.rows);
    }
  });
}

module.exports = {
  most_delayed,
  cancellations,
  category_distribution,
  top_coffee_shops,
  weekend_24hr,
  state_reliability,
  stranded_guide,
  pa_restaurants,
  regional_dominance,
  no_hotels
}