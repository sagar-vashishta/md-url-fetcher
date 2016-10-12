var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var kue = require('kue');
var redis = require('redis');
var url = require('url');
var validator = require('validator');

var JOBS_COLLECTION = 'jobs';

var REDIS_URL = process.env.REDISTOGO_URL || 'redis://localhost:6379';
var MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost';

// redis connection for kue
kue.redis.createClient = function () {
  var redisUrl = url.parse(REDIS_URL);
  var client = redis.createClient(redisUrl.port, redisUrl.hostname);
  if (redisUrl.auth) {
    client.auth(redisUrl.auth.split(':')[1]);
  }
  return client;
};

var queue = kue.createQueue();

// web server setup
var app = express();
app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());

var db;
mongodb.MongoClient.connect(MONGO_URL, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  db = database;
  console.log('Database connection ready');

  // initialize app
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log('Listening on port:', port);
  });
});

// generic error handler
function handleError(res, reason, message, code) {
  console.log('ERROR: ' + reason);
  res.status(code || 500).send({
    'error': message
  });
}

// quick url validation
function isValidUrl(url) {
  var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return regexp.test(url);
}

/*  /jobs
 *  GET: finds all jobs
 *  POST: creates a new job
 */
app.get('/jobs', function (req, res) {
  db.collection(JOBS_COLLECTION).find({}).toArray(function (err, docs) {
    if (err) {
      handleError(res, err.message, 'Failed to get jobs.');
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post('/jobs', function (req, res) {
  if (!req.body.url || !isValidUrl(req.body.url)) {
    handleError(res, 'Invalid user input', 'Please provide a valid url.', 400);
  } else {
    var job = queue.create('crawl', {
        url: req.body.url
    })
    .save(function (err) {
      if (err) {
        handleError(res, err.message, 'Failed to create new job.');
      } else {
        res.status(201).json({'jobId': job.id});
      }
    });
  }
});

/*  /jobs/:id
 *  GET: job by id
 */
app.get('/jobs/:id', function (req, res) {
  if (!req.params.id || isNaN(req.params.id)) {
    handleError(res, 'Invalid user input', 'Please enter a valid job id.', 400);
  } else {
    // retrieve job status from kue
    kue.Job.get(req.params.id, function (err, job) {
      if (!job) {
        handleError(res, err.message, 'Unable to locate job.', 500);
      } else {
        if (job._state === 'complete') {
          // retrieve job results from mongo if complete
          db.collection(JOBS_COLLECTION).findOne({
            jobId: req.params.id
          }, function (err, doc) {
            if (err) {
              handleError(res, err.message, 'Unable to retrieve job results.');
            } else {
              res.status(200).json(doc.body);
            }
          });
        } else {
          res.status(200).json('Job is not yet complete. State: ' + job._state);
        }
      }
    });
  }
});

module.exports = app;
