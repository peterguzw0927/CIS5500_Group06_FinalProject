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

    const QueryButton = ({ id, label }) => (
        <Grid item>
            <Button
                variant={activeQuery === id ? 'contained' : 'outlined'} color="primary"
                onClick={() => runQuery(id)} disableElevation
                sx={{ borderRadius: '24px', textTransform: 'none', fontWeight: 600, px: 3 }}
            >
                {label}
            </Button>
        </Grid>
    );

    return (
        <Container maxWidth="xl" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #047857 0%, #10B981 100%)', borderRadius: '16px', padding: '40px', color: 'white', mb: 4, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}>
                <Typography variant="h3" fontWeight="800" gutterBottom>Standard Travel Analytics</Typography>
                <Typography variant="h6" fontWeight="300" sx={{ opacity: 0.9 }}>Explore our 6 core queries summarizing national flight performance and business distribution.</Typography>
            </Box>

            <Paper elevation={0} sx={{ padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', mb: 4, backgroundColor: '#F8FAFC' }}>
                <Typography variant="overline" color="textSecondary" fontWeight="700">Dynamic Tuning</Typography>
                <Divider sx={{ mb: 3, mt: 1 }} />
                <Grid container spacing={5}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight="600" color="primary.main">Min Flight Delay: {minDelay}m</Typography>
                        <Slider value={minDelay} min={0} max={180} step={10} onChange={(e, val) => setMinDelay(val)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2" fontWeight="600" color="primary.main">Min Coffee Shop Reviews: {minReviews}</Typography>
                        <Slider value={minReviews} min={100} max={2000} step={100} onChange={(e, val) => setMinReviews(val)} />
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2} sx={{ mb: 4 }}>
                <QueryButton id="most_delayed" label="Most Delayed" />
                <QueryButton id="cancellations" label="Cancellations" />
                <QueryButton id="state_reliability" label="State Reliability" />
                <QueryButton id="category_distribution" label="Business Categories" />
                <QueryButton id="top_coffee_shops" label="Top Coffee Shops" />
                <QueryButton id="weekend_24hr" label="24/7 Weekend Spots" />
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