import { getFinancialSummary } from './server/db';

const startDate = new Date('2024-06-01T00:00:00.000Z');
const endDate = new Date('2025-05-31T23:59:59.999Z');

console.log('Testing with dates:', { startDate, endDate });

getFinancialSummary(startDate, endDate).then(result => {
  console.log('Result:', result);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
