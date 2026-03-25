/**
 * GA4 Funnel Analysis Script
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a new project or select an existing one.
 * 3. Enable the "Google Analytics Data API".
 * 4. Go to "IAM & Admin" > "Service Accounts".
 * 5. Create a Service Account and download the JSON key.
 * 6. In Google Analytics (https://analytics.google.com/), go to Admin > Property Settings > Property Access Management.
 * 7. Add the service account email (from the JSON key) with the "Viewer" role.
 * 8. Set the following environment variables:
 *    - GA4_PROPERTY_ID: Your GA4 Property ID (found in Admin > Property Settings).
 *    - GA4_SERVICE_ACCOUNT_KEY: The contents of your service account JSON key (base64 encoded recommended).
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');

// Load env vars
const propertyId = process.env.VITE_GA4_PROPERTY_ID || process.env.GA4_PROPERTY_ID;
const serviceAccountKeyBase64 = process.env.VITE_GA4_SERVICE_ACCOUNT_KEY || process.env.GA4_SERVICE_ACCOUNT_KEY;

if (!propertyId || !serviceAccountKeyBase64) {
  console.log('Error: GA4_PROPERTY_ID and GA4_SERVICE_ACCOUNT_KEY environment variables are required.');
  console.log('\nRun with:');
  console.log('GA4_PROPERTY_ID=your_id GA4_SERVICE_ACCOUNT_KEY=$(cat key.json | base64) node scripts/ga4-funnel.js');
  process.exit(1);
}

let credentials;
try {
  // Try to parse as JSON first, if not, try base64
  let keyContent = serviceAccountKeyBase64;
  if (!keyContent.startsWith('{')) {
    keyContent = Buffer.from(keyContent, 'base64').toString('utf8');
  }
  credentials = JSON.parse(keyContent);
} catch (e) {
  console.log('Error parsing service account key. Ensure it is a valid JSON string or a base64 encoded JSON string.');
  process.exit(1);
}

const analyticsDataClient = new BetaAnalyticsDataClient({ credentials });

async function runFunnelReport() {
  console.log(`Pulling GA4 Funnel Data for Property: ${propertyId} (Last 30 days)\n`);

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: {
            values: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase']
          }
        }
      }
    });

    const counts = {
      view_item: 0,
      add_to_cart: 0,
      begin_checkout: 0,
      purchase: 0
    };

    if (response.rows) {
      response.rows.forEach(row => {
        const eventName = row.dimensionValues[0].value;
        const count = parseInt(row.metricValues[0].value, 10);
        counts[eventName] = count;
      });
    }

    const steps = [
      { label: 'Product Views', key: 'view_item' },
      { label: 'Added to Cart', key: 'add_to_cart' },
      { label: 'Began Checkout', key: 'begin_checkout' },
      { label: 'Purchased', key: 'purchase' }
    ];

    const reportTable = steps.map((step, index) => {
      const count = counts[step.key] || 0;
      const prevCount = index > 0 ? (counts[steps[index - 1].key] || 0) : null;
      const dropoff = prevCount && prevCount > 0 ? `${(((prevCount - count) / prevCount) * 100).toFixed(1)}%` : (index === 0 ? '-' : '100%');
      const firstCount = counts[steps[0].key] || 0;
      const conversion = firstCount > 0 ? `${((count / firstCount) * 100).toFixed(1)}%` : (index === 0 ? '100%' : '0%');

      return {
        'Funnel Step': step.label,
        'Event Count': count,
        'Drop-off': dropoff,
        'Conversion (Overall)': conversion
      };
    });

    console.table(reportTable);

    const firstCount = counts[steps[0].key] || 0;
    const finalConversion = firstCount > 0 ? ((counts.purchase / firstCount) * 100).toFixed(2) : '0.00';
    console.log(`\nOverall Funnel Conversion Rate: ${finalConversion}%`);

  } catch (err) {
    console.log('Error running report:', err.message);
  }
}

runFunnelReport();
