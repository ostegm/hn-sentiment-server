const fs = require('fs');

// Read environmental variable with credentials.
const keysEnvVar = process.env.GAE_CREDS;
if (!keysEnvVar) {
  throw new Error('The $CREDS environment variable was not found!');
}
const keys = JSON.parse(keysEnvVar);
fs.writeFile('hn-sentiment-3b3b291ae079.json', keysEnvVar, 'utf8');