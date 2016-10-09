var config = require('config');
var database = require('./database');

function convertHostToSSHCommand(hosts_list, verbose) {
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
      command += " ssh -tt ";
    }
    command += current_host.username ? current_host.username : config.default_username;
    command += "@" + current_host.hostname;
    ssh_commands.push(command);
  }
  return ssh_commands;
}

module.exports.convertHostToSSHCommand = convertHostToSSHCommand;
