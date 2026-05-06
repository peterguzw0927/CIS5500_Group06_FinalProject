const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// =========================================================================
// OPTIMIZATION: IN-MEMORY API CACHING MIDDLEWARE
// =========================================================================
const apiCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  if (apiCache.has(key)) {
    const { data, timestamp } = apiCache.get(key);
    if (Date.now() - timestamp < CACHE_DURATION) {
      console.log(`⚡ Cache HIT (0.005s) for: ${key}`);
      return res.json(data);
    } else {
      apiCache.delete(key);
    }
  }

  console.log(`⏳ Cache MISS (Querying DB) for: ${key}`);
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    apiCache.set(key, { data: body, timestamp: Date.now() });
    originalJson(body);
  };
  next();
};

// Route Bindings for the Flight & Business API
app.get('/flights/most_delayed', routes.most_delayed);
app.get('/airports/cancellations', routes.cancellations);
app.get('/businesses/category_distribution', routes.category_distribution);
app.get('/businesses/top_coffee_shops', routes.top_coffee_shops);
app.get('/businesses/weekend_24hr', routes.weekend_24hr);
app.get('/flights/state_reliability', routes.state_reliability);
app.get('/businesses/top_places', routes.top_places); // Re-added just in case

// Complex Queries (WITH CACHING APPLIED)
app.get('/airports/stranded_guide', cacheMiddleware, routes.stranded_guide);
app.get('/airports/pa_restaurants', cacheMiddleware, routes.pa_restaurants);
app.get('/states/regional_dominance', cacheMiddleware, routes.regional_dominance);
app.get('/airports/no_hotels', cacheMiddleware, routes.no_hotels);

// =========================================================================
// FIX: FALLBACK ALIASES
// Catch older routes that might be hardcoded in your React FlightsPage.js 
// so they resolve successfully instead of returning a 404 HTML parse error.
// =========================================================================
app.get('/airports/regional_dominance', cacheMiddleware, routes.regional_dominance);
app.get('/airports/state_restaurants', cacheMiddleware, routes.pa_restaurants);
app.get('/airports/evening_delays', cacheMiddleware, routes.pa_restaurants);

// =========================================================================
// 404 TRACKER: Instantly flags if your frontend requests a broken URL
// =========================================================================
app.use((req, res) => {
  console.log(`❌ 404 NOT FOUND: Frontend requested ${req.originalUrl}`);
  res.status(404).send('Endpoint not found');
});

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;