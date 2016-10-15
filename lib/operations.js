var database = require('./database');
var utils = require('./utils');
var config = require('config');
var _ = require('lodash');

const allowed_operations = ['ADD', 'SEARCH', 'DELETE', 'UPDATE'];

function add(server, verbose) {
  if (!utils.updateServer(server, verbose)) {
    console.log("Saving...");
    database[config.server_collection].save(server);
  }
  if (verbose) {
    console.log("Checking tags: " + server.tags);
  }
  if (server.tags && server.tags.length > 0) {
      for (var i = 0; i < server.tags.length; i++) {
        var db_tag = database[config.tag_collection].find({tag: server.tags[i]});
        if (db_tag && db_tag.length>0) {
          if (verbose) {
            console.log("Tag " + server.tags[i] + " already present. Updating it.");
          }
          //supposing tag unique into collection
          db_tag[0].hostnames.push(server.hostname);
          database[config.tag_collection].update({tag: server.tags[i]}, {hostnames: _.uniq(db_tag[0].hostnames)});
        } else {
          if (verbose) {
            console.log("Saving new TAG " + server.tags[i]);
          }
          database[config.tag_collection].save({tag: server.tags[i], hostnames: [server.hostname]});
        }
      }
  }
}

function search(query, verbose) {
  return utils.search(query, verbose);
}

function update(server, verbose) {
  if (server.hostname && !utils.updateServer(server, verbose)) {
    console.error("Server %s is not present into DB", server.hostname);
  }

  if (server.tags && server.tags.length > 0) {
      for (var i = 0; i < server.tags.length; i++) {
        var db_tag = database[config.tag_collection].find({tag: server.tags[i]});
        if (db_tag && db_tag.length>0) {
          console.log("Tag %s found. Updating all servers linked to it: %s", db_tag[0].tag, db_tag[0].hostnames);
          for (var j = 0; j < db_tag[0].hostnames.length; j++) {
            server.hostname = db_tag[0].hostnames[j];
            if (server.hostname && !utils.updateServer(server, verbose)) {
              console.error("Error updating the server %s", db_tag[0].hostnames[j]);
            }
          }
        } else {
          console.error("Tag %s not found", db_tag);
        }
      }
  }
}

function removeHostFromTag(tag, hostname) {
  return tag.hostnames.filter(item => item !== hostname);
}

function removeTagFromHost(host, tagname) {
  return host.tags.filter(item => item !== tagname);
}

function remove(query, verbose) {
  if (query.hostname) {
    if (verbose) {
      console.log("Removing %s server", query.hostname);
    }
    var server = utils.search(query, verbose);
    if (verbose) {
      console.log("Removing host from all related tags %s", server.tags);
    }
    for (var i = 0; i<server.tags.length; i++) {
      var current_tag = database[config.tag_collection].find({tag: server.tags[i]});
      if (verbose) {
        console.log(current_tag[0]);
      }
      current_tag.hostnames = removeHostFromTag(current_tag[0], query.hostname);
      if (current_tag.hostnames && current_tag.hostnames > 0) {
        database[config.tag_collection].update({'tag': current_tag.tag}, current_tag);
      } else {
        console.log("Removing empty tag %s", server.tags[i]);
        database[config.tag_collection].remove(current_tag);
      }
    }
    database[config.server_collection].remove({'hostname': query.hostname}, true);
  } else if (query.tags && query.tags.length > 0) {
    if (verbose) {
      console.log("Removing %s tag, without removing related servers", query.tags);
    }
    for (var j = 0; j < query.tags.length; j++) {
      var tag = database[config.tag_collection].findOne({'tag': query.tags[j]});
      if (tag) {
        for (var k = 0; k < tag.hostnames.length; k++) {
          var db_host = database[config.server_collection].findOne({'hostname': tag.hostnames[k]});
          if (verbose) {
            console.log(db_host);
          }
          db_host.tags = removeTagFromHost(db_host, tag.tag);
          if (verbose) {
            console.log(db_host);
          }
          var updated = database[config.server_collection].update({'hostname': db_host.hostname}, db_host);
          if (verbose) {
            console.log("Updated: %j", updated);
          }
        }
        database[config.tag_collection].remove({"tag": query.tags[j]});
      }
    }
  } else {
    console.error("Missing hostname or tag to remove");
  }
}

module.exports.allowed_operations = allowed_operations;
module.exports.database = database;
module.exports.add = add;
module.exports.search = search;
module.exports.update = update;
module.exports.remove = remove;
