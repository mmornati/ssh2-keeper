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

  it('test override with default username', function (done) {
    config.force_default_username = true;
    var result = op.search({"tags":["jenkins", "slave01"]}, true);
    expect(result.length).to.equal(1);
    expect(result[0]).to.equal("ssh marco@server32.mornati.net");
    done();
  });

  it('search servers with identity files using tags', function (done) {
    config.force_default_username = true;
    var result = op.search({"tags":["www"]}, true);
    expect(result.length).to.equal(10);
    expect(result[0]).to.equal("ssh -i /Users/mmornati/.ssh/marco_rsa marco@server1.mornati.net");
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
    updateServerStub = sinon.spy(op.database[config.server_collection], 'update');
    updateTagsStub = sinon.spy(op.database[config.tag_collection], 'update');
    saveTagsStub = sinon.spy(op.database[config.tag_collection], 'save');
  });

  it('test add one server', function (done) {
    op.add({
      'hostname': "test1.mornati.net",
      'tags': ["server1", "nodejs"],
      'ip': '192.168.0.2'
    }, true);
    sinon.assert.calledOnce(saveServerStub);
    sinon.assert.calledTwice(saveTagsStub);
    done();
  });

  it('test add already present server', function (done) {

    var testcase = {
      'hostname': "test1.mornati.net",
      'tags': ["server2", "nodejs"],
      'ip': '192.168.0.1'
    };

    op.add(testcase, true);
    sinon.assert.callCount(saveServerStub, 0);
    sinon.assert.calledOnce(updateTagsStub);
    sinon.assert.calledOnce(saveTagsStub);
    var response = op.search({"tags": ["server2"]}, true);
    expect(response.length).to.equal(1);
    expect(response[0]).to.equal("ssh marco@test1.mornati.net");
    done();
  });

  it('test provided username', function (done) {

    var testcase = {
      'hostname': "test2.mornati.net",
      'tags': ["nodejs", "test2"],
      'username': 'marco',
      'ip': '192.168.0.2'
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
      'username': 'marco',
      'ip': '192.168.0.3'
    };

    op.add(testcase, true);
    sinon.assert.calledOnce(saveServerStub);
    sinon.assert.calledOnce(saveTagsStub);
    var response = op.search({"tags": ["test3"]}, true);
    expect(response[0]).to.equal("ssh -tt marco@admin.mornati.net ssh -tt marco@test3.mornati.net");
    done();
  });

  afterEach(function() {
    saveServerStub.restore();
    updateServerStub.restore();
    updateTagsStub.restore();
    saveTagsStub.restore();
  });

  after(function () {
    op.database[config.tag_collection].remove();
    op.database[config.server_collection].remove();
  });
});


describe('Database Update', function () {
  before(function () {
    //config.db_path = TEST_DB;
    config.server_collection = "servers_test";
    config.tag_collection = "tags_test";
    op.database = db.connect(config.db_path, [config.server_collection, config.tag_collection]);
    op.add({
      'hostname': "test1.mornati.net",
      'tags': ["server1", "nodejs"],
      'ip': '192.168.0.1'
    }, true);
    op.add({
      'hostname': "test2.mornati.net",
      'tags': ["server2", "nodejs"],
      'ip': '192.168.0.2'
    }, true);
  });

  beforeEach(function () {
    saveServerStub = sinon.spy(op.database[config.server_collection], 'save');
    updateServerStub = sinon.spy(op.database[config.server_collection], 'update');
    updateTagsStub = sinon.spy(op.database[config.tag_collection], 'update');
    saveTagsStub = sinon.spy(op.database[config.tag_collection], 'save');
  });

  it('update an existing server', function (done) {
    var testcase = {
      'hostname': "test1.mornati.net",
      'identity_file': "~/.ssh/myid_rsa",
      'username': 'marco'
    };

    op.update(testcase, true);
    sinon.assert.calledOnce(updateServerStub);
    sinon.assert.callCount(saveTagsStub, 0);
    var response = op.search({"hostname": "test1.mornati.net"}, true);
    expect(response.identity_file).to.equal('~/.ssh/myid_rsa');
    expect(response.ip).to.equal('192.168.0.1');
    console.log(response);
    done();
  });

  it('update un unexisting server', function (done) {
    var testcase = {
      'hostname': "unexisting.mornati.net",
      'identity_file': "~/.ssh/myid_rsa",
      'username': 'marco'
    };

    op.update(testcase, true);
    sinon.assert.callCount(updateServerStub, 0);
    sinon.assert.callCount(saveServerStub, 0);
    sinon.assert.callCount(saveTagsStub, 0);
    done();
  });

  it('update multiple servers using tags', function (done) {
    var testcase = {
      'tags': ["nodejs"],
      'identity_file': "~/.ssh/myid_rsa",
      'username': 'marco'
    };

    op.update(testcase, true);
    sinon.assert.calledTwice(updateServerStub);
    sinon.assert.callCount(saveServerStub, 0);
    sinon.assert.callCount(saveTagsStub, 0);
    var response = op.search({"hostname": "test2.mornati.net"}, true);
    expect(response.identity_file).to.equal('~/.ssh/myid_rsa');
    expect(response.username).to.equal('marco');
    expect(response.ip).to.equal('192.168.0.2');

    var response2 = op.search({"hostname": "test1.mornati.net"}, true);
    expect(response2.identity_file).to.equal('~/.ssh/myid_rsa');
    expect(response2.username).to.equal('marco');
    expect(response2.ip).to.equal('192.168.0.1');
    done();
  });

  afterEach(function() {
    saveServerStub.restore();
    updateServerStub.restore();
    updateTagsStub.restore();
    saveTagsStub.restore();
  });

  after(function () {
    op.database[config.tag_collection].remove();
    op.database[config.server_collection].remove();
  });
});


describe('Database Remove', function () {
  before(function () {
    //config.db_path = TEST_DB;
    config.server_collection = "servers_test";
    config.tag_collection = "tags_test";
    op.database = db.connect(config.db_path, [config.server_collection, config.tag_collection]);
    op.add({
      'hostname': "test1.mornati.net",
      'tags': ["server1", "nodejs"],
      'ip': '192.168.0.1'
    }, true);
    op.add({
      'hostname': "test2.mornati.net",
      'tags': ["server2", "nodejs"],
      'ip': '192.168.0.2'
    }, true);
    op.add({
      'hostname': "test3.mornati.net",
      'tags': ["server3"],
      'ip': '192.168.0.2'
    }, true);
  });

  beforeEach(function () {
    saveServerStub = sinon.spy(op.database[config.server_collection], 'save');
    updateServerStub = sinon.spy(op.database[config.server_collection], 'update');
    updateTagsStub = sinon.spy(op.database[config.tag_collection], 'update');
    saveTagsStub = sinon.spy(op.database[config.tag_collection], 'save');
    removeTagsStub = sinon.spy(op.database[config.tag_collection], 'remove');
    removeServerStub = sinon.spy(op.database[config.server_collection], 'remove');
  });

  it('remove a single server and removing a single server tag', function (done) {
    op.remove({'hostname': 'test3.mornati.net'}, true);
    sinon.assert.calledOnce(removeServerStub);
    sinon.assert.calledOnce(removeTagsStub);
    var response = op.search({"hostname": "test3.mornati.net"}, true);
    expect(response).to.equal(undefined);
    var response2 = op.search({"tags": ["server3"]}, true);
    expect(response2.length).to.equal(0);
    done();
  });

  it('remove single tag', function (done) {
    op.remove({'tags': ['nodejs']}, true);
    sinon.assert.calledOnce(removeTagsStub);
    sinon.assert.calledTwice(updateServerStub);
    sinon.assert.callCount(removeServerStub, 0);
    var response = op.search({"hostname": "test2.mornati.net"}, true);
    expect(response.tags.length).to.equal(1);
    var response2 = op.search({"hostname": "test1.mornati.net"}, true);
    expect(response2.tags.length).to.equal(1);
    done();
  });

  afterEach(function() {
    saveServerStub.restore();
    updateServerStub.restore();
    updateTagsStub.restore();
    saveTagsStub.restore();
    removeTagsStub.restore();
    removeServerStub.restore();
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
