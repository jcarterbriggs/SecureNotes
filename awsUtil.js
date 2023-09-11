const AWS = require('aws-sdk');

// Set the AWS Region (e.g., "us-east-1")
AWS.config.update({region: 'YOUR_REGION'});

// Create RDS service object
const rds = new AWS.RDS();

function generateAuthToken() {
    // Construct the endpoint of your database
    const hostname = 'securenotes-db1.cmkglsnunoo6.us-east-1.rds.amazonaws.com';
    const port = 3306; // or your DB's port
    const username = 'DBAdmin';

    // Generate the token
    const token = rds.getAuthToken({
        hostname: hostname,
        port: port,
        username: username
    });

    return token;
}
module.exports = {
  generateAuthToken
};