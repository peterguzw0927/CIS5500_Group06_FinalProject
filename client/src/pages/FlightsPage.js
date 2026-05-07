import { useEffect, useState } from 'react';
import { Button, Container, Grid, Slider, Typography, Divider, Box, Paper, Alert, Fade } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
const config = require('../config.json');

export default function FlightsPage() {
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive Variables for Complex Queries
  const [minRating, setMinRating] = useState(4.5);
  const [minReviews, setMinReviews] = useState(500);
  const [maxDelayThreshold, setMaxDelayThreshold] = useState(45);
  const [topN, setTopN] = useState(3);

  const [activeQuery, setActiveQuery] = useState('stranded');

  useEffect(() => {
    runQuery(activeQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runQuery = (queryName) => {
    setActiveQuery(queryName);
    setLoading(true);
    setErrorMsg('');

    let route = '';
    if (queryName === 'stranded') route = `/airports/stranded_guide?rating=${minRating}&reviews=${minReviews}`;
    else if (queryName === 'regional') route = `/states/regional_dominance?max_delay=${maxDelayThreshold}`;
    else if (queryName === 'nohotels') route = `/airports/no_hotels`;
    else if (queryName === 'restaurants') route = `/airports/pa_restaurants?top_n=${topN}`;

    fetch(`http://${config.server_host}:${config.server_port}${route}`)
      .then(res => res.json())
      .then(resJson => {
        if (!resJson || resJson.length === 0) setData([]);
        else {
          const withIds = resJson.map((row, index) => ({ id: index, ...row }));
          setData(withIds);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg("Lost connection to the database server.");
        setLoading(false);
      });
  }

  const getColumns = () => {
    if (activeQuery === 'stranded') return [
      { field: 'airport', headerName: 'Airport', width: 250 },
      { field: 'city', headerName: 'City', width: 150 },
      { field: 'business_name', headerName: 'Top Restaurant', width: 250 },
      { field: 'avg_rating', headerName: `Rating (>${minRating})`, width: 150 },
      { field: 'category_name', headerName: 'Category', flex: 1 },
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
      { field: 'address', headerName: 'Address', flex: 1 },
    ];
    if (activeQuery === 'restaurants') return [
      { field: 'airport', headerName: 'Airport', width: 200 },
      { field: 'delayed_evening_rate', headerName: 'Evening Delay Rate', width: 180 },
      { field: 'restaurant_name', headerName: `Top ${topN} Restaurants`, width: 250 },
      { field: 'avg_rating', headerName: 'Rating', width: 120 },
      { field: 'day', headerName: 'Day', width: 120 },
      { field: 'hours_text', headerName: 'Hours', flex: 1 },
    ];
    return [];
  };

  const QueryButton = ({ id, label }) => (
    <Grid item>
      <Button
        variant={activeQuery === id ? 'contained' : 'outlined'} color="secondary"
        onClick={() => runQuery(id)} disableElevation
        sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 600, px: 3 }}
      >
        {label}
      </Button>
    </Grid>
  );

  return (
    <Container maxWidth="xl" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1A365D 0%, #00B4D8 100%)', borderRadius: '16px', padding: '40px', color: 'white', mb: 4, boxShadow: '0 10px 30px rgba(0, 180, 216, 0.2)' }}>
        <Typography variant="h3" fontWeight="800" gutterBottom>Deep Dive Analytics</Typography>
        <Typography variant="h6" fontWeight="300" sx={{ opacity: 0.9 }}>Discover hidden insights using complex spatial bounding boxes and Window-based ranking.</Typography>
      </Box>

      <Paper elevation={0} sx={{ padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', mb: 4 }}>
        <Typography variant="overline" color="textSecondary" fontWeight="700">Dynamic Tuning Parameters</Typography>
        <Divider sx={{ mb: 3, mt: 1 }} />
        <Grid container spacing={5}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" fontWeight="600" color="primary.main">Min Restaurant Rating: {minRating}</Typography>
            <Slider value={minRating} min={4.0} max={5.0} step={0.1} onChange={(e, val) => setMinRating(val)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" fontWeight="600" color="primary.main">Min Reviews: {minReviews}</Typography>
            <Slider value={minReviews} min={100} max={2000} step={100} onChange={(e, val) => setMinReviews(val)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" fontWeight="600" color="warning.dark">Reliable State Threshold: {maxDelayThreshold}m</Typography>
            <Slider value={maxDelayThreshold} min={15} max={90} step={5} onChange={(e, val) => setMaxDelayThreshold(val)} color="warning" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2" fontWeight="600" color="primary.main">Top N Evening Restaurants: {topN}</Typography>
            <Slider value={topN} min={1} max={5} step={1} onChange={(e, val) => setTopN(val)} />
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <QueryButton id="stranded" label="Stranded Traveler Guide" />
        <QueryButton id="regional" label="Reliable States & Coffee" />
        <QueryButton id="nohotels" label="Airport Lodging Desert" />
        <QueryButton id="restaurants" label="Evening Dinner Scrambles" />
      </Grid>

      <Fade in={!!errorMsg}><Box mb={3}>{errorMsg && <Alert severity="error" variant="filled">{errorMsg}</Alert>}</Box></Fade>

      <Paper elevation={0} sx={{ height: 600, width: '100%', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
        <DataGrid
          rows={data} columns={getColumns()} pageSize={pageSize} loading={loading}
          rowsPerPageOptions={[5, 10, 25, 50]} onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          disableSelectionOnClick
          sx={{ '& .MuiDataGrid-columnHeaders': { backgroundColor: '#F1F5F9', color: '#1E293B', fontWeight: 'bold' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#F8FAFC' } }}
        />
      </Paper>
    </Container>
  );
}