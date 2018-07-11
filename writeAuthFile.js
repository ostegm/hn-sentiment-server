const fs = require('fs');

// Read environmental variable with credentials.
const keysEnvVar = process.env.GAE_CREDS;
if (!keysEnvVar) {
  throw new Error('The $CREDS environment variable was not found!');
}
// Write to a json file to be used by the Google Auth Library.
fs.writeFile('hn-sentiment-3b3b291ae079.json', keysEnvVar, 'utf8');
