var config = require('config');
var database = require('./database');
var _ = require('lodash');
const log_config = require('./logConfig');
const {Signale} = require('signale');
const log = new Signale(log_config.options);

function getUsername(current_host) {
    var username;
    if (config.force_default_username) {
        username = config.default_username;
    } else {
        username = current_host.username ? current_host.username : config.default_username;
    }
    return username;
}

function convertHostToSSHCommand(hosts_list, verbose) {
  var ssh_commands = [];
  for (var j=0; j<hosts_list.length; j++) {
    var current_host = database[config.server_collection].find({hostname: hosts_list[j]});
    if (current_host && current_host.length > 0) {
      current_host = current_host[0];
      var command = "ssh ";
      if (current_host.identity_file) {
        command += "-i " + current_host.identity_file + " ";
      }
      if (current_host.admin_server) {
        log.info("Configuring with admin server");
        command += "-tt ";
        command += getUsername(current_host);
        command += "@" + current_host.admin_server;
        command += " ssh -tt ";
      }
      command += getUsername(current_host);
      command += "@" + current_host.hostname;
      ssh_commands.push(command);
    }
  }
  return ssh_commands;
}

function createDataObject(new_server, old_server) {
  var dataToUpdate = {
    "hostname": new_server.hostname,
    "ip": new_server.ip!==undefined ? new_server.ip : old_server.ip,
    "admin_server": new_server.admin_server!==undefined ? new_server.admin_server : old_server.admin_server,
    "username": new_server.username!==undefined ? new_server.username : old_server.username,
    "identity_file": new_server.identity_file!==undefined ? new_server.identity_file : old_server.identity_file,
    "tags": new_server.tags!==undefined ? _.uniq(_.concat(new_server.tags, old_server.tags)) : old_server.tags
  };
  return dataToUpdate;
}

function updateServer(server, verbose) {
  log.info("Calling update with %s", server.hostname);
  var db_server = search({hostname: server.hostname}, verbose);
  log.info(db_server);
  if (db_server) {
    var dataToUpdate = createDataObject(server, db_server);
    log.info("Data to update: " + dataToUpdate);
    database[config.server_collection].update({hostname: server.hostname}, dataToUpdate);
    return true;
  } else {
    return false;
  }
}

function search(query, verbose) {
  if (query.hostname) {
    log.info("Searching only using the Hostname 'cause it is unique into the database'");
    return database[config.server_collection].findOne({"hostname": query.hostname});
  } else {
    //Searching using tags
    var hosts_list = [];
    if (query.tags && query.tags.length > 0) {
      log.info("Searching with " + query.tags.length + " tags" );
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
      return convertHostToSSHCommand(hosts_list, verbose);
    } else {
      return hosts_list;
    }
  }
}

module.exports.convertHostToSSHCommand = convertHostToSSHCommand;
module.exports.createDataObject = createDataObject;
module.exports.updateServer = updateServer;
module.exports.search = search;
