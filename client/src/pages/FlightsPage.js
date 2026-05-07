import { useEffect, useState } from 'react';
import { Button, Container, Grid, Slider, Typography, Divider, Box, Paper, Alert, Fade, Switch, FormControlLabel } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
const config = require('../config.json');

export default function FlightsPage() {
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [privacyMode, setPrivacyMode] = useState(false);

  const [minRating, setMinRating] = useState(4.5);
  const [minReviews, setMinReviews] = useState(500);
  const [maxDelayThreshold, setMaxDelayThreshold] = useState(45);
  const [topN, setTopN] = useState(3);

  const [activeQuery, setActiveQuery] = useState('stranded');

  const queryCards = [
    {
      id: 'stranded',
      label: 'Stranded Traveler Guide',
      description: 'Match delayed airports with strong nearby restaurant options.',
      service: 'Airport Recovery Service',
      sliders: [
        {
          label: 'Min Restaurant Rating',
          valueLabel: `${minRating}`,
          value: minRating,
          min: 4.0,
          max: 5.0,
          step: 0.1,
          onChange: (value) => setMinRating(value),
          color: 'primary.main'
        },
        {
          label: 'Min Reviews',
          valueLabel: `${minReviews}`,
          value: minReviews,
          min: 100,
          max: 2000,
          step: 100,
          onChange: (value) => setMinReviews(value),
          color: 'primary.main'
        }
      ]
    },
    {
      id: 'regional',
      label: 'Reliable States & Coffee',
      description: 'Compare states with stable delays against coffee density.',
      service: 'Regional Benchmark Service',
      sliders: [
        {
          label: 'Reliable State Threshold',
          valueLabel: `${maxDelayThreshold}m`,
          value: maxDelayThreshold,
          min: 15,
          max: 90,
          step: 5,
          onChange: (value) => setMaxDelayThreshold(value),
          color: 'warning.dark',
          sliderColor: 'warning'
        }
      ]
    },
    {
      id: 'nohotels',
      label: 'Airport Lodging Desert',
      description: 'Identify delayed airports with weak lodging support.',
      service: 'Lodging Gap Service',
      sliders: []
    },
    {
      id: 'restaurants',
      label: 'Evening Dinner Scrambles',
      description: 'Surface the best late-day dining options near delayed airports.',
      service: 'Restaurant Coverage Service',
      sliders: [
        {
          label: 'Top N Evening Restaurants',
          valueLabel: `${topN}`,
          value: topN,
          min: 1,
          max: 5,
          step: 1,
          onChange: (value) => setTopN(value),
          color: 'primary.main'
        }
      ]
    }
  ];

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

  // Security Helper to mask PII data when Privacy Mode is ON
  const maskData = (text) => {
    if (!privacyMode || !text) return text;
    return text.replace(/[a-zA-Z]/g, '*');
  };

  const getColumns = () => {
    if (activeQuery === 'stranded') return [
      { field: 'airport', headerName: 'Airport', width: 250 },
      { field: 'city', headerName: 'City', width: 150, renderCell: (p) => maskData(p.value) },
      { field: 'business_name', headerName: 'Top Restaurant', width: 250, renderCell: (p) => maskData(p.value) },
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
      { field: 'lodging_name', headerName: 'Nearby Lodging', width: 250, renderCell: (p) => maskData(p.value) },
      { field: 'avg_rating', headerName: 'Rating', width: 120 },
      // EXTRA CREDIT 1: Google Maps Integration
      {
        field: 'address', headerName: 'Address (Click for Maps)', flex: 1, renderCell: (params) => (
          privacyMode ? maskData(params.value) :
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.value)}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 500 }}>
              📍 {params.value}
            </a>
        )
      },
    ];
    if (activeQuery === 'restaurants') return [
      { field: 'airport', headerName: 'Airport', width: 200 },
      { field: 'delayed_evening_rate', headerName: 'Evening Delay Rate', width: 180 },
      { field: 'restaurant_name', headerName: `Top ${topN} Restaurants`, width: 250, renderCell: (p) => maskData(p.value) },
      { field: 'avg_rating', headerName: 'Rating', width: 120 },
      { field: 'day', headerName: 'Day', width: 120 },
      { field: 'hours_text', headerName: 'Hours', flex: 1 },
    ];
    return [];
  };

  const QueryCard = ({ query }) => (
    <Grid item xs={12} md={6}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: activeQuery === query.id ? '2px solid #DC2626' : '1px solid #CBD5E1',
          backgroundColor: activeQuery === query.id ? '#FEF2F2' : 'white',
          height: '100%'
        }}
      >
        <Typography variant="overline" color="secondary.main" fontWeight="700">
          {query.service}
        </Typography>
        <Typography variant="h6" fontWeight="700" sx={{ mt: 1, mb: 1 }}>
          {query.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {query.description}
        </Typography>

        {query.sliders.length > 0 ? query.sliders.map((slider) => (
          <Box key={slider.label} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight="600" color={slider.color}>
              {slider.label}: {slider.valueLabel}
            </Typography>
            <Slider
              value={slider.value}
              min={slider.min}
              max={slider.max}
              step={slider.step}
              color={slider.sliderColor}
              onChange={(e, value) => slider.onChange(value)}
            />
          </Box>
        )) : (
          <Box sx={{ py: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No tuning slider is needed for this service.
            </Typography>
          </Box>
        )}

        <Button
          fullWidth
          variant={activeQuery === query.id ? 'contained' : 'outlined'}
          color="secondary"
          onClick={() => runQuery(query.id)}
          disableElevation
          sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, mt: 1 }}
        >
          {activeQuery === query.id ? 'Viewing This Service' : 'Open This Service'}
        </Button>
      </Paper>
    </Grid>
  );

  return (
    <Container maxWidth="xl" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      {/* Added Privacy Mode Switch to Hero Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #1A365D 0%, #00B4D8 100%)', borderRadius: '16px', padding: '40px', color: 'white', mb: 4, boxShadow: '0 10px 30px rgba(0, 180, 216, 0.2)' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Box>
            <Typography variant="h3" fontWeight="800" gutterBottom>Deep Dive Analytics</Typography>
            <Typography variant="h6" fontWeight="300" sx={{ opacity: 0.9 }}>Discover hidden insights using complex spatial bounding boxes and Window-based ranking.</Typography>
          </Box>
          <FormControlLabel
            control={<Switch color="warning" checked={privacyMode} onChange={(e) => setPrivacyMode(e.target.checked)} />}
            label={<Typography fontWeight="bold">Privacy Mode</Typography>}
            sx={{ background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '30px', mt: { xs: 2, md: 0 } }}
          />
        </Box>
      </Box>

      <Paper elevation={0} sx={{ padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', mb: 4 }}>
        <Typography variant="overline" color="textSecondary" fontWeight="700">Service Controls</Typography>
        <Divider sx={{ mb: 3, mt: 1 }} />
        <Grid container spacing={3}>
          {queryCards.map((query) => <QueryCard key={query.id} query={query} />)}
        </Grid>
      </Paper>

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