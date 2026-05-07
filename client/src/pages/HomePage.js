import { useEffect, useState } from 'react';
import { Button, Container, Grid, Slider, Typography, Divider, Box, Paper, Alert, Fade } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
const config = require('../config.json');

export default function HomePage() {
    const [pageSize, setPageSize] = useState(10);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Interactive Variables for Simple Queries
    const [minDelay, setMinDelay] = useState(30);
    const [minReviews, setMinReviews] = useState(500);

    const [activeQuery, setActiveQuery] = useState('most_delayed');

    const queryGroups = [
        {
            title: 'Flight Services',
            queries: [
                {
                    id: 'most_delayed',
                    label: 'Most Delayed',
                    description: 'Track airports with the heaviest delay exposure.',
                    slider: {
                        label: 'Min Flight Delay',
                        valueLabel: `${minDelay}m`,
                        value: minDelay,
                        min: 0,
                        max: 180,
                        step: 10,
                        onChange: (value) => setMinDelay(value)
                    }
                },
                {
                    id: 'cancellations',
                    label: 'Cancellations',
                    description: 'Review airports with the highest cancellation counts.'
                },
                {
                    id: 'state_reliability',
                    label: 'State Reliability',
                    description: 'Compare state-level average delay stability.'
                }
            ]
        },
        {
            title: 'Business Services',
            queries: [
                {
                    id: 'category_distribution',
                    label: 'Business Categories',
                    description: 'See how businesses are distributed by category.'
                },
                {
                    id: 'top_coffee_shops',
                    label: 'Top Coffee Shops',
                    description: 'Filter highly reviewed coffee shops across the dataset.',
                    slider: {
                        label: 'Min Coffee Shop Reviews',
                        valueLabel: `${minReviews}`,
                        value: minReviews,
                        min: 100,
                        max: 2000,
                        step: 100,
                        onChange: (value) => setMinReviews(value)
                    }
                },
                {
                    id: 'weekend_24hr',
                    label: '24/7 Weekend Spots',
                    description: 'Find businesses open all weekend without interruption.'
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
        if (activeQuery === 'most_delayed') return [
            { field: 'flight_date', headerName: 'Date', width: 120 },
            { field: 'origin_code', headerName: 'Airport', width: 120 },
            { field: 'weather_delay_min', headerName: 'Weather Delay (m)', width: 160 },
            { field: 'late_aircraft_delay_min', headerName: 'Late Aircraft Delay (m)', width: 200 },
            { field: 'total_delay_min', headerName: 'Total Delay (m)', width: 160 },
        ];
        if (activeQuery === 'cancellations') return [
            { field: 'origin_code', headerName: 'Airport Code', width: 150 },
            { field: 'total_flights', headerName: 'Total Flights', width: 200 },
            { field: 'total_cancelled', headerName: 'Cancelled Flights', width: 200 },
        ];
        if (activeQuery === 'category_distribution') return [
            { field: 'category_name', headerName: 'Business Category', flex: 1 },
            { field: 'num_businesses', headerName: 'Total Businesses', width: 200 },
        ];
        if (activeQuery === 'top_coffee_shops') return [
            { field: 'name', headerName: 'Shop Name', width: 250 },
            { field: 'address', headerName: 'Address', flex: 1 },
            { field: 'avg_rating', headerName: 'Rating', width: 120 },
            { field: 'num_of_reviews', headerName: 'Reviews', width: 120 },
        ];
        if (activeQuery === 'weekend_24hr') return [
            { field: 'name', headerName: 'Business Name', width: 250 },
            { field: 'address', headerName: 'Address', flex: 1 },
            { field: 'hours_text', headerName: 'Hours', width: 250 },
        ];
        if (activeQuery === 'state_reliability') return [
            { field: 'origin_state', headerName: 'State Code', width: 150 },
            { field: 'avg_weather_delay', headerName: 'Avg Weather Delay (m)', width: 250 },
            { field: 'avg_late_delay', headerName: 'Avg Late Delay (m)', width: 250 },
        ];
        return [];
    };

    const QueryCard = ({ query }) => (
        <Grid item xs={12} md={4}>
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: activeQuery === query.id ? '2px solid #2563EB' : '1px solid #CBD5E1',
                    backgroundColor: activeQuery === query.id ? '#EFF6FF' : 'white',
                    height: '100%'
                }}
            >
                <Typography variant="overline" color="primary.main" fontWeight="700">
                    {query.id.startsWith('business') || ['category_distribution', 'top_coffee_shops', 'weekend_24hr'].includes(query.id) ? 'Business Query' : 'Flight Query'}
                </Typography>
                <Typography variant="h6" fontWeight="700" sx={{ mt: 1, mb: 1 }}>
                    {query.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42, mb: 2 }}>
                    {query.description}
                </Typography>

                {query.slider ? (
                    <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle2" fontWeight="600" color="primary.main">
                            {query.slider.label}: {query.slider.valueLabel}
                        </Typography>
                        <Slider
                            value={query.slider.value}
                            min={query.slider.min}
                            max={query.slider.max}
                            step={query.slider.step}
                            onChange={(e, value) => query.slider.onChange(value)}
                        />
                    </Box>
                ) : (
                    <Box sx={{ mb: 2.5, py: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            No tuning slider is needed for this service.
                        </Typography>
                    </Box>
                )}

                <Button
                    fullWidth
                    variant={activeQuery === query.id ? 'contained' : 'outlined'}
                    color="primary"
                    onClick={() => runQuery(query.id)}
                    disableElevation
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
                >
                    {activeQuery === query.id ? 'Viewing This Service' : 'Open This Service'}
                </Button>
            </Paper>
        </Grid>
    );

    return (
        <Container maxWidth="xl" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #047857 0%, #10B981 100%)', borderRadius: '16px', padding: '40px', color: 'white', mb: 4, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}>
                <Typography variant="h3" fontWeight="800" gutterBottom>Standard Travel Analytics</Typography>
                <Typography variant="h6" fontWeight="300" sx={{ opacity: 0.9 }}>Explore our 6 core queries summarizing national flight performance and business distribution.</Typography>
            </Box>

            {queryGroups.map((group) => (
                <Paper key={group.title} elevation={0} sx={{ padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', mb: 4, backgroundColor: '#F8FAFC' }}>
                    <Typography variant="overline" color="textSecondary" fontWeight="700">{group.title}</Typography>
                    <Divider sx={{ mb: 3, mt: 1 }} />
                    <Grid container spacing={3}>
                        {group.queries.map((query) => <QueryCard key={query.id} query={query} />)}
                    </Grid>
                </Paper>
            ))}

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
