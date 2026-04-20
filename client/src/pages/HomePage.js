import { Container, Divider } from '@mui/material';
import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function HomePage() {

  const delayColumns = [
    { field: 'flight_date', headerName: 'Flight Date' },
    { field: 'origin_code', headerName: 'Airport Code' },
    { field: 'origin_city', headerName: 'City' },
    { field: 'total_delay_min', headerName: 'Total Delay (Min)' },
  ];

  const cancellationColumns = [
    { field: 'origin_code', headerName: 'Airport' },
    { field: 'origin_city', headerName: 'City' },
    { field: 'total_flights', headerName: 'Total Flights' },
    { field: 'total_cancelled', headerName: 'Cancelled Flights' },
  ];

  const coffeeColumns = [
    { field: 'name', headerName: 'Shop Name' },
    { field: 'address', headerName: 'Address' },
    { field: 'avg_rating', headerName: 'Google Rating' },
    { field: 'num_of_reviews', headerName: 'Total Reviews' },
  ];

  return (
    <Container>
      <h2>Top 50 Most Delayed Flights (2024)</h2>
      {/* FIX: Removed the ?limit=50 so LazyTable can cleanly append ?page=1 */}
      <LazyTable route={`http://${config.server_host}:${config.server_port}/flights/most_delayed`} columns={delayColumns} />

      <Divider style={{ margin: '40px 0' }} />

      <h2>Worst Airports for Cancellations</h2>
      <LazyTable route={`http://${config.server_host}:${config.server_port}/airports/cancellations`} columns={cancellationColumns} />

      <Divider style={{ margin: '40px 0' }} />

      <h2>Highest Rated Coffee Shops (National)</h2>
      <p>Because you need caffeine when your flight gets cancelled.</p>
      {/* FIX: Removed the ?limit=10 so LazyTable can cleanly append ?page=1 */}
      <LazyTable route={`http://${config.server_host}:${config.server_port}/businesses/top_coffee_shops`} columns={coffeeColumns} />

    </Container>
  );
};