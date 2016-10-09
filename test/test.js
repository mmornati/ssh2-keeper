var chai = require('chai');
var expect = chai.expect;
var config = require('config');
var sinon = require('sinon');
var db = require('diskdb');
var op = require('../lib/operations');
var path = require('path');

const TEST_DB = path.join(__dirname, "db");

describe('Database Search', function () {
  before(function () {
    config.db_path = TEST_DB;
    config.server_collection = "servers";
    config.tag_collection = "tags";
    console.log(config);
    op.database = db.connect(config.db_path, [config.server_collection, config.tag_collection]);
  });

  it('should return 12 prod servers', function (done) {
    var result = op.search({"tags":["prod"]}, true);
    expect(result.length).to.equal(12);
    done();
  });

  it('should return 6 prod servers italy', function (done) {
    var result = op.search({"tags":["prod", "italy"]}, true);
    expect(result.length).to.equal(6);
    done();
  });

  it('should return 2 front prod servers italy', function (done) {
    var result = op.search({"tags":["prod", "italy", "front"]}, true);
    expect(result.length).to.equal(2);
    done();
  });

  it('should return 1 front01 prod servers italy', function (done) {
    var result = op.search({"tags":["prod", "italy", "front01"]}, true);
    expect(result.length).to.equal(1);
    done();
  });

  it('should return 5 mongo01', function (done) {
    var result = op.search({"tags":["mongo01"]}, true);
    expect(result.length).to.equal(5);
    done();
  });

  it('should return 6 jenkins slave', function (done) {
    var result = op.search({"tags":["jenkins", "slave"]}, true);
    expect(result.length).to.equal(6);
    done();
  });

  after(function () {

  });
});

describe('Database Add', function () {
  before(function () {
    //config.db_path = TEST_DB;
    config.server_collection = "servers_test";
    config.tag_collection = "tags_test";
    op.database = db.connect(config.db_path, [config.server_collection, config.tag_collection]);
  });

  beforeEach(function () {
    saveServerStub = sinon.spy(op.database[config.server_collection], 'save');
    updateTagsStub = sinon.spy(op.database[config.tag_collection], 'update');
    saveTagsStub = sinon.spy(op.database[config.tag_collection], 'save');
  });

  it('test add one server', function (done) {
    op.add({
      'hostname': "test1.mornati.net",
      'tags': ["server1", "nodejs"]
    }, true);
    sinon.assert.calledOnce(saveServerStub);
    sinon.assert.calledTwice(saveTagsStub);
    done();
  });

  it('test add already present server', function (done) {

    var testcase = {
      'hostname': "test1.mornati.net",
      'tags': ["server2", "nodejs"]
    };

    op.add(testcase, true);
    sinon.assert.callCount(saveServerStub, 0);
    sinon.assert.calledOnce(updateTagsStub);
    sinon.assert.calledOnce(saveTagsStub);
    var response = op.search({"tags": ["server2"]}, true);
    expect(response.length).to.equal(1);
    expect(response[0]).to.equal("ssh mmornati@test1.mornati.net");
    done();
  });

  it('test provided username', function (done) {

    var testcase = {
      'hostname': "test2.mornati.net",
      'tags': ["nodejs", "test2"],
      'username': 'marco'
    };

    op.add(testcase, true);
    sinon.assert.calledOnce(saveServerStub);
    sinon.assert.calledOnce(saveTagsStub);
    sinon.assert.calledOnce(updateTagsStub);
    var response = op.search({"tags": ["nodejs"]}, true);
    expect(response.length).to.equal(2);
    var response2 = op.search({"tags": ["test2"]}, true);
    expect(response2[0]).to.equal("ssh marco@test2.mornati.net");
    done();
  });

  it('test with admin server', function (done) {

    var testcase = {
      'hostname': "test3.mornati.net",
      'admin_server': "admin.mornati.net",
      'tags': ["test3"],
      'username': 'marco'
    };

    op.add(testcase, true);
    sinon.assert.calledOnce(saveServerStub);
    sinon.assert.calledOnce(saveTagsStub);
    var response = op.search({"tags": ["test3"]}, true);
    expect(response[0]).to.equal("ssh -tt marco@admin.mornati.net -tt marco@test3.mornati.net");
    done();
  });

  afterEach(function() {
    saveServerStub.restore();
    updateTagsStub.restore();
    saveTagsStub.restore();
  });

  after(function () {
    op.database[config.tag_collection].remove();
    op.database[config.server_collection].remove();
  });
});


require('mocha-jshint')({
    git: {
        modified: true,
        commits: 2,
        exec: {
            maxBuffer: 20*1024*1024
        }
    },
    pretty: true,
    paths: [
        'index.js',
        'test/*.js',
        'lib/*.js'
    ]
});
