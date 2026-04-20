const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');

const app = express();
app.use(cors({
  origin: '*',
}));

// Route Bindings for the Flight & Business API
app.get('/flights/most_delayed', routes.most_delayed);
app.get('/airports/cancellations', routes.cancellations);
app.get('/businesses/category_distribution', routes.category_distribution);
app.get('/businesses/top_coffee_shops', routes.top_coffee_shops);
app.get('/businesses/weekend_24hr', routes.weekend_24hr);
app.get('/flights/state_reliability', routes.state_reliability);

// Complex Queries
app.get('/airports/stranded_guide', routes.stranded_guide);
app.get('/airports/pa_restaurants', routes.pa_restaurants);
app.get('/states/regional_dominance', routes.regional_dominance);
app.get('/airports/no_hotels', routes.no_hotels);

app.listen(config.server_port, () => {
  console.log(`Server running at http://${config.server_host}:${config.server_port}/`)
});

module.exports = app;