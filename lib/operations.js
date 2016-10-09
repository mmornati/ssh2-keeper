var database = require('./database');
var utils = require('./utils');
var config = require('config');
var _ = require('lodash');

const allowed_operations = ['ADD', 'SEARCH', 'DELETE'];

function add(server, verbose) {
  if (verbose) {
    console.log(server);
  }
  var db_server = search({hostname: server.hostname}, verbose);
  if (verbose) {
    console.log(db_server);
  }
  if (db_server && db_server.length>0) {
    db_server=db_server[0];
    console.log("Server already present into DB. Updating information if needed...");
    var dataToUpdate = {
      "ip": server.ip!==undefined ? server.ip : db_server.ip,
      "admin_server": server.admin_server!==undefined ? server.admin_server : db_server.admin_server,
      "username": server.username!==undefined ? server.username : db_server.username,
      "tags": server.tags!==undefined ? _.uniq(_.concat(server.tags, db_server.tags)) : db_server.tags
    };
    if (verbose) {
      console.log("Data to update: ");
      console.log(dataToUpdate);
    }
    database[config.server_collection].update({hostname: server.hostname}, dataToUpdate);
  } else {
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
  if (query.hostname) {
    if (verbose) {
      console.log("Searching only using the Hostname 'cause it is unique into the database'");
    }
    return database[config.server_collection].find({"hostname": query.hostname});
  } else {
    //Searching using tags
    var hosts_list = [];
    if (query.tags && query.tags.length > 0) {
      if (verbose) {
        console.log("Searching with " + query.tags.length + " tags" );
      }
      for (var i=0; i<query.tags.length; i++) {
        var hosts = database[config.tag_collection].find({"tag": query.tags[i]});
        //Supposing only 1 tag
        var hostnames = hosts[0] ? hosts[0].hostnames : [];
        if (i > 0) {
          hosts_list = _.intersection(hosts_list, hostnames);
        } else {
          hosts_list = hostnames;
        }
      }
    }
    if (config.show_ssh_command) {
      return utils.convertHostToSSHCommand(hosts_list, verbose);
    } else {
      return hosts_list;
    }
  }
}

module.exports.allowed_operations = allowed_operations;
module.exports.database = database;
module.exports.add = add;
module.exports.search = search;
