var chai = require('chai');
var chaiHttp = require('chai-http');
var server = require('../server');
var should = chai.should();

chai.use(chaiHttp);

describe('Jobs', function() {
  it('should list all jobs on /jobs GET');
  it('should list a single job on /jobs/<id> GET');
  it('should add a single job on /jobs POST');
});

it('should list all jobs on /jobs GET', function(done) {
  chai.request(server)
    .get('/jobs')
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
});

it('should list a single job on /jobs/<id> GET', function(done) {
  var jobId = 12;
  chai.request(server)
    .get('/jobs/'+jobId)
    .end(function(err, res){
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('content');
      res.body._id.should.equal(data.id);
      done();
    });
});

it('should add a single job on /jobs POST', function(done) {
  chai.request(server)
    .post('/jobs')
    .send({'url': 'http://www.google.com'})
    .end(function(err, res){
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      done();
    });
});