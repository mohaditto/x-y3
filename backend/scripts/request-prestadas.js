import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/capataz/prestadas',
  method: 'GET',
  headers: { 'Accept': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => { console.error('Request error', err); });
req.end();
