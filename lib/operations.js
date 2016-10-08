var database = require('./database');
var config = require('config');
var _ = require('lodash');

const allowed_operations = ['ADD', 'SEARCH', 'DELETE'];

function add(server, verbose) {
  if (verbose) {
    console.log(server);
  }
  var db_server = search({hostname: server.hostname});
  if (verbose) {
    console.log(db_server);
  }
  if (db_server && db_server.length>0) {
    console.log("Server already present into DB.");
  } else {
    console.log("Saving...");
    database[config.server_collection].save(server);
  }
  if (server.tags && server.tags.length > 0) {
      for (var i = 0; i < server.tags.length; i++) {
        var db_tag = database[config.tag_collection].find({tag: server.tags[i]});
        if (db_tag && db_tag.length>0) {
          //supposing tag unique into collection
          db_tag[0].hostnames.push(server.hostname);
          database[config.tag_collection].update({tag: server.tags[i]}, {hostnames: _.uniq(db_tag[0].hostnames)});
        } else {
          database[config.tag_collection].save({tag: server.tags[i], hostnames: [server.hostname]});
        }
      }
  }
}

function search(query, verbose) {
  if (query.hostname) {
    return database[config.server_collection].find(query);
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
      var ssh_commands = [];
      for (var j=0; j<hosts_list.length; j++) {
        var current_host = database[config.server_collection].find({hostname: hosts_list[j]});
        current_host = current_host[0];
        var command = "ssh ";
        if (current_host.admin_server) {
          if (verbose) {
            console.log("Configuring with admin server");
          }
          command += "-tt ";
          command += current_host.username ? current_host.username : config.default_username;
          command += "@" + current_host.admin_server;
          command += " -tt ";
        }
        command += current_host.username ? current_host.username : config.default_username;
        command += "@" + current_host.hostname;
        ssh_commands.push(command);
      }
      return ssh_commands;
    } else {
      return hosts_list;
    }
  }
}

module.exports.allowed_operations = allowed_operations;
module.exports.database = database;
module.exports.add = add;
module.exports.search = search;
