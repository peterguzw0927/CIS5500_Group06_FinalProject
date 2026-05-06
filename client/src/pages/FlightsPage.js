import { useEffect, useState } from 'react';
import { Button, Container, Grid, Slider, Typography, Divider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
const config = require('../config.json');

export default function FlightsPage() {
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);

  // Interactive Variables mapping to the outer queries of MVs and Simple Queries
  const [minDelay, setMinDelay] = useState(30);
  const [minRating, setMinRating] = useState(4.5);
  const [minReviews, setMinReviews] = useState(500);
  const [maxDelayThreshold, setMaxDelayThreshold] = useState(45);
  const [topN, setTopN] = useState(3);

  const [activeQuery, setActiveQuery] = useState('most_delayed');

  useEffect(() => {
    runQuery(activeQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runQuery = (queryName) => {
    setActiveQuery(queryName);
    let route = '';

    // --- Simple Queries ---
    // Note: We append &limit=100 so the frontend DataGrid has enough data to paginate
    if (queryName === 'most_delayed') {
      route = `/flights/most_delayed?min_delay=${minDelay}&limit=100`;
    } else if (queryName === 'cancellations') {
      route = `/airports/cancellations?limit=100`;
    } else if (queryName === 'category_distribution') {
      route = `/businesses/category_distribution?limit=100`;
    } else if (queryName === 'top_coffee_shops') {
      route = `/businesses/top_coffee_shops?min_reviews=${minReviews}&limit=100`;
    } else if (queryName === 'weekend_24hr') {
      route = `/businesses/weekend_24hr?limit=100`;
    } else if (queryName === 'state_reliability') {
      route = `/flights/state_reliability`;
    }
    // --- Complex Queries ---
    else if (queryName === 'stranded') {
      route = `/airports/stranded_guide?rating=${minRating}&reviews=${minReviews}`;
    } else if (queryName === 'regional') {
      route = `/states/regional_dominance?max_delay=${maxDelayThreshold}`;
    } else if (queryName === 'nohotels') {
      route = `/airports/no_hotels`;
    } else if (queryName === 'restaurants') {
      route = `/airports/pa_restaurants?top_n=${topN}`;
    }

    fetch(`http://${config.server_host}:${config.server_port}${route}`)
      .then(res => res.json())
      .then(resJson => {
        // DataGrid requires a unique 'id' for every row
        const withIds = resJson.map((row, index) => ({ id: index, ...row }));
        setData(withIds);
      })
      .catch(err => alert("Error fetching data. Is your server running?"));
  }

  // Maps the exact JSON keys returned by your SQL Queries
  const getColumns = () => {
    // Columns for Simple Queries
    if (activeQuery === 'most_delayed') return [
      { field: 'flight_date', headerName: 'Date', width: 120 },
      { field: 'origin_code', headerName: 'Airport', width: 120 },
      { field: 'origin_city', headerName: 'City', width: 180 },
      { field: 'weather_delay_min', headerName: 'Weather Delay (m)', width: 160 },
      { field: 'late_aircraft_delay_min', headerName: 'Late Aircraft Delay (m)', width: 200 },
      { field: 'total_delay_min', headerName: 'Total Delay (m)', width: 160 },
    ];
    if (activeQuery === 'cancellations') return [
      { field: 'origin_code', headerName: 'Airport Code', width: 150 },
      { field: 'origin_city', headerName: 'City', width: 250 },
      { field: 'total_flights', headerName: 'Total Flights', width: 200 },
      { field: 'total_cancelled', headerName: 'Cancelled Flights', width: 200 },
    ];
    if (activeQuery === 'category_distribution') return [
      { field: 'category_name', headerName: 'Business Category', width: 300 },
      { field: 'num_businesses', headerName: 'Total Businesses', width: 200 },
    ];
    if (activeQuery === 'top_coffee_shops') return [
      { field: 'name', headerName: 'Shop Name', width: 250 },
      { field: 'address', headerName: 'Address', width: 350 },
      { field: 'avg_rating', headerName: 'Rating', width: 120 },
      { field: 'num_of_reviews', headerName: 'Reviews', width: 120 },
    ];
    if (activeQuery === 'weekend_24hr') return [
      { field: 'name', headerName: 'Business Name', width: 250 },
      { field: 'address', headerName: 'Address', width: 350 },
      { field: 'hours_text', headerName: 'Hours', width: 250 },
    ];
    if (activeQuery === 'state_reliability') return [
      { field: 'origin_state', headerName: 'State Code', width: 150 },
      { field: 'avg_weather_delay', headerName: 'Avg Weather Delay (m)', width: 250 },
    ];

    // Columns for Complex Queries
    if (activeQuery === 'stranded') return [
      { field: 'airport', headerName: 'Airport', width: 250 },
      { field: 'city', headerName: 'City', width: 150 },
      { field: 'business_name', headerName: 'Top Restaurant', width: 250 },
      { field: 'avg_rating', headerName: `Rating (>${minRating})`, width: 150 },
      { field: 'category_name', headerName: 'Category', width: 200 },
    ];
    if (activeQuery === 'regional') return [
      { field: 'state', headerName: 'State', width: 100 },
      { field: 'total_flights', headerName: 'Total Flights', width: 150 },
      { field: 'state_avg_delay', headerName: 'Avg Delay (mins)', width: 150 },
      { field: 'num_coffee_shops', headerName: 'Total Coffee Shops', width: 200 },
      { field: 'avg_coffee_rating', headerName: 'Avg Coffee Rating', width: 150 },
    ];
    if (activeQuery === 'nohotels') return [
      { field: 'airport', headerName: 'Airport', width: 250 },
      { field: 'avg_delay', headerName: 'Avg Delay', width: 120 },
      { field: 'severe_delay_rate', headerName: 'Severe Delay Rate', width: 150 },
      { field: 'lodging_name', headerName: 'Nearby Lodging', width: 250 },
      { field: 'avg_rating', headerName: 'Rating', width: 120 },
      { field: 'address', headerName: 'Address', width: 300 },
    ];
    if (activeQuery === 'restaurants') return [
      { field: 'airport', headerName: 'Airport', width: 200 },
      { field: 'delayed_evening_rate', headerName: 'Evening Delay Rate', width: 180 },
      { field: 'restaurant_name', headerName: `Top ${topN} Restaurants`, width: 250 },
      { field: 'avg_rating', headerName: 'Rating', width: 120 },
      { field: 'day', headerName: 'Day', width: 120 },
      { field: 'hours_text', headerName: 'Hours', width: 250 },
    ];
    return [];
  };

  return (
    <Container style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      <Typography variant="h3" gutterBottom>Ultimate Travel Dashboard</Typography>
      <p>Fine-tune the parameters below to filter both standard flight metrics and advanced geospatial analytics.</p>

      <Grid container spacing={4} style={{ marginBottom: '20px', background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <Grid item xs={12} sm={4}>
          <Typography gutterBottom>Min Flight Delay: {minDelay}m</Typography>
          <Slider value={minDelay} min={0} max={180} step={10} onChange={(e, val) => setMinDelay(val)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography gutterBottom>Min Restaurant Rating: {minRating}</Typography>
          <Slider value={minRating} min={4.0} max={5.0} step={0.1} onChange={(e, val) => setMinRating(val)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography gutterBottom>Min Reviews: {minReviews}</Typography>
          <Slider value={minReviews} min={100} max={2000} step={100} onChange={(e, val) => setMinReviews(val)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography gutterBottom>Reliable State Threshold: {maxDelayThreshold}m</Typography>
          <Slider value={maxDelayThreshold} min={15} max={90} step={5} onChange={(e, val) => setMaxDelayThreshold(val)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography gutterBottom>Top N Evening Restaurants: {topN}</Typography>
          <Slider value={topN} min={1} max={5} step={1} onChange={(e, val) => setTopN(val)} />
        </Grid>
      </Grid>

      <Typography variant="h5" style={{ marginTop: '30px', marginBottom: '10px' }}>Standard Analytics</Typography>
      <Grid container spacing={2} style={{ marginBottom: '20px' }}>
        <Grid item><Button variant={activeQuery === 'most_delayed' ? 'contained' : 'outlined'} onClick={() => runQuery('most_delayed')}>Most Delayed</Button></Grid>
        <Grid item><Button variant={activeQuery === 'cancellations' ? 'contained' : 'outlined'} onClick={() => runQuery('cancellations')}>Cancellations</Button></Grid>
        <Grid item><Button variant={activeQuery === 'category_distribution' ? 'contained' : 'outlined'} onClick={() => runQuery('category_distribution')}>Business Categories</Button></Grid>
        <Grid item><Button variant={activeQuery === 'top_coffee_shops' ? 'contained' : 'outlined'} onClick={() => runQuery('top_coffee_shops')}>Top Coffee Shops</Button></Grid>
        <Grid item><Button variant={activeQuery === 'weekend_24hr' ? 'contained' : 'outlined'} onClick={() => runQuery('weekend_24hr')}>24/7 Weekend Spots</Button></Grid>
        <Grid item><Button variant={activeQuery === 'state_reliability' ? 'contained' : 'outlined'} onClick={() => runQuery('state_reliability')}>State Reliability</Button></Grid>
      </Grid>

      <Typography variant="h5" style={{ marginTop: '20px', marginBottom: '10px' }}>Complex Analytics</Typography>
      <Grid container spacing={2} style={{ marginBottom: '30px' }}>
        <Grid item><Button color="secondary" variant={activeQuery === 'stranded' ? 'contained' : 'outlined'} onClick={() => runQuery('stranded')}>Problematic Airports</Button></Grid>
        <Grid item><Button color="secondary" variant={activeQuery === 'regional' ? 'contained' : 'outlined'} onClick={() => runQuery('regional')}>Reliable States & Coffee</Button></Grid>
        <Grid item><Button color="secondary" variant={activeQuery === 'nohotels' ? 'contained' : 'outlined'} onClick={() => runQuery('nohotels')}>Nearby Lodgings</Button></Grid>
        <Grid item><Button color="secondary" variant={activeQuery === 'restaurants' ? 'contained' : 'outlined'} onClick={() => runQuery('restaurants')}>Evening Delays</Button></Grid>
      </Grid>

      <Divider style={{ marginBottom: '20px' }} />

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data}
          columns={getColumns()}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25]}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        />
      </div>
    </Container>
  );
}