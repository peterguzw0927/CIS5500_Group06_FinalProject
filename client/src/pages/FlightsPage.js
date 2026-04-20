import { useEffect, useState } from 'react';
import { Button, Container, Grid, Slider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
const config = require('../config.json');

export default function FlightsPage() {
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState([]);

  // State for the custom delay filter
  const [minDelay, setMinDelay] = useState(60);

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = () => {
    // Calling Complex Query 7: The Stranded Traveler's Guide
    fetch(`http://${config.server_host}:${config.server_port}/airports/stranded_guide?min_delay=${minDelay}`)
      .then(res => res.json())
      .then(resJson => {
        // DataGrid expects an array of objects with a unique 'id' field.
        // We use the array index as the ID since our SQL didn't return a primary key.
        const airportsWithId = resJson.map((airport, index) => ({ id: index, ...airport }));
        setData(airportsWithId);
      })
      .catch(err => alert("Error fetching data. Is your server running?"));
  }

  // Define the columns based on Query 7's output
  const columns = [
    { field: 'airport', headerName: 'Airport', width: 250 },
    { field: 'city', headerName: 'City', width: 150 },
    { field: 'state', headerName: 'State', width: 100 },
    { field: 'avg_weather_delay', headerName: 'Avg Delay (mins)', width: 150 },
    { field: 'nearby_excellent_hotels', headerName: '4+ Star Hotels Nearby', width: 200 },
  ]

  return (
    <Container>
      <h2>The Stranded Traveler's Airport Guide</h2>
      <p>Find high-risk airports where average weather delays are severe, but local top-tier hotel availability is dangerously low (&lt; 5 hotels).</p>

      <Grid container spacing={6} style={{ marginBottom: '20px' }}>
        <Grid item xs={6}>
          <p>Minimum Average Weather Delay (minutes)</p>
          <Slider
            value={minDelay}
            min={30}
            max={180}
            step={10}
            onChange={(e, newValue) => setMinDelay(newValue)}
            valueLabelDisplay='auto'
          />
        </Grid>
      </Grid>

      <Button variant="contained" onClick={() => search()} style={{ marginBottom: '30px' }}>
        Update Search
      </Button>

      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={pageSize}
          rowsPerPageOptions={[5, 10, 25]}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        />
      </div>
    </Container>
  );
}