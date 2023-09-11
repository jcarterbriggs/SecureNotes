const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const AWS = require('aws-sdk');
const app = express();
const port = 3000;
const { generateAuthToken } = require('./awsUtil');
const ApiError = require('./apiError');
require('dotenv').config();
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbRootPass = process.env.MYSQL_ROOT_PASSWORD;
const dbName = process.env.MYSQL_DATABASE;
const dbUser = process.env.MYSQL_USER;
const dbPass = process.env.MYSQL_PASSWORD;



//AWS.config.update({region: 'us-east-1'});

// Create RDS service object
//const rds = new AWS.RDS();

// Setup database connection
const db = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  password: dbPass,
  database: dbName
});
// setTimeout(() => {
//     db.connect((err) => {
//         if (err) {
//             console.error("Failed to connect to the database:", err);
//             process.exit(1); // Exit the application if a database connection can't be established
//         } else {
//             console.log("Connected to the database successfully.");
//         }
//     });
// }, 10000); // wait 10 seconds before connecting

//db.connect();

const maxRetries = 10;
let retries = 0;

const connectToDatabase = () => {
  db.connect((err) => {
    if (err) {
      console.error("Failed to connect to the database:", err);
      retries++;
      if (retries < maxRetries) {
        console.log(`Retrying in 5 seconds... [Attempt: ${retries}]`);
        setTimeout(connectToDatabase, 5000);
      } else {
        console.error("Max retries reached. Exiting...");
        process.exit(1);
      }
    } else {
      console.log("Connected to the database successfully.");
    }
  });
};

connectToDatabase();

app.get('/notes', (req, res) => {
  db.query('SELECT * FROM notes', (err, results) => {
    if(err) {
   	return next(new ApiError(500, 'Internal Server Error')); 
    }
	res.send(results);
  });
});

app.use(express.json());
app.use(cors());

app.post('/notes', (req, res) => {
  // Logic to create a new note
  const { title, body } = req.body;

  if (!title || !body) {
    return res.status(400).send('Both title and body are required.');
  }

  const query = 'INSERT INTO notes (title, body) VALUES (?, ?)';
  db.query(query, [title, body], (err, result) => {
    if (err) throw err;
    res.send({ success: true, message: 'Note added successfully', insertId: result.insertId });
  });
});

app.delete('/notes/:id', (req, res) => {
  // Logic to delete a note by its ID
  const noteId = req.params.id;

  const query = 'DELETE FROM notes WHERE id = ?';
  db.query(query, [noteId], (err, result) => {
    if (err) throw err;

    if (result.affectedRows === 0) {
      return res.status(404).send('Note not found.');
    }

    res.send({ success: true, message: 'Note deleted successfully' });
  });
});


// Error-handling middleware
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        res.status(err.status).send(err.message);
    } else {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});