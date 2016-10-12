var express = require('express');
var kue = require('kue');
var http = require('http');
var app = express();
var mongodb = require('mongodb');
var sanitizeHtml = require('sanitize-html');
var redis = require('redis');
var url = require('url');

// db configs
var REDIS_URL = process.env.REDISTOGO_URL || 'redis://localhost:6379';
var MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost';
var JOBS_COLLECTION = 'jobs';

// initialize redis connection for kue
kue.redis.createClient = function () {
  var redisUrl = url.parse(REDIS_URL);
  var client = redis.createClient(redisUrl.port, redisUrl.hostname);
  if (redisUrl.auth) {
    client.auth(redisUrl.auth.split(':')[1]);
  }
  return client;
};

var db;
mongodb.MongoClient.connect(MONGO_URL, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  db = database;
});

var queue = kue.createQueue({});

queue.on('ready', () => {
  console.info('Queue is ready.');
});

queue.on('error', (err) => {
  console.error('There was an error in the main queue.');
  console.error(err);
  console.error(err.stack);
});

queue.process('crawl', 5, function (job, done) {
  var url = job.data.url.replace(/.*?:\/\//g, "");
  console.log("Crawling job id", job.id);

  var options = {
    host: url,
    port: 80,
    path: '/index.html'
  };

  http.get(options, function (res) {
    res.on('data', function (body) {
      var newJob = {
        url: url,
        jobId: job.id,
        scrapeDate: new Date(),
        statusCode: res.statusCode
      };

      // TODO: needs a lot more html sanitization
      if (body) {
        var html = sanitizeHtml(body, {
          allowedTags: false
        });
        newJob.body = html;
      }

      // store html content in body
      db.collection(JOBS_COLLECTION).insertOne(newJob, function (err, doc) {
        done();
      });

    });
  });
});

kue.app.listen(3000);
app.use(kue.app);
