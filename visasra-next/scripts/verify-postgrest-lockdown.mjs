import https from 'https';

const SUPABASE_URL = "https://xdjqsoveqzmrrbooxkpn.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkanFzb3ZlcXptcnJib294a3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxOTM2NDQsImV4cCI6MjEwNzc2OTY0NH0._aAFA3VVRu2dg43UBQidYctYIoOcmuoGVqurRYKhFrI";

const endpoints = [
  '/rest/v1/User',
  '/rest/v1/Worker',
  '/rest/v1/Admin',
  '/rest/v1/OtpVerification',
  '/rest/v1/Order'
];

async function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, SUPABASE_URL);
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint,
          status: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        endpoint,
        status: 'ERROR',
        body: err.message
      });
    });

    req.end();
  });
}

async function run() {
  console.log('Testing PostgREST anonymous API lockdown...');
  for (const ep of endpoints) {
    const res = await checkEndpoint(ep);
    console.log(`Endpoint: ${res.endpoint} -> Status: ${res.status}`);
    console.log(`Response: ${res.body.slice(0, 200)}...`);
  }
}

run();
