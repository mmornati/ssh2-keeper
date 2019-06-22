#!/usr/bin/env node
var path = require('path');
//Overriding configuration folder to be always the fullpath of the scripts
process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config');
var config = require('config');
var utils = require('./lib/utils');

var stdio = require('stdio');
var op = require('./lib/operations');
var _ = require('lodash');
var ncp = require("copy-paste");

var options = stdio.getopt({
   'verbose': {key: 'v', description: 'Show verbose log', args: 1 },
   'tag': {key: 't', multiple: true, description: 'Tag(s) to allow you to find server'},
   'hostname': {key: 'h', args: 1, description: 'Hostname of your server'},
   'admin_server': {key: 'a', args: 1, description: 'If you need to connect to an Admin server to reach your target. Ex: ssh -tt pi@192.168.0.101 ssh -tt pi2@192.168.0.102'},
   'ip': {key: 'i', args: 1, description: 'Server IP address.'},
   'identity_file': {key: 'f', args: 1, description: 'Identity File'},
   'username': {key: 'u', args:1, description: 'Username to connect to your server. If empty the one in configuration file be used'},
   'operation': {key: 'o', args: 1, description: 'One of ADD, SEARCH, UPDATE or REMOVE'}
});

//The simplify the everyday usage:
//If command contains only arguments 1: command then hostname|tags tags
//Using add the second parameter must be the hostname
//Using search the second parameter will be a tag by default
if (options.args && options.args.length > 0) {
  if (options.verbose) {
    console.log("Overriding parameters...");
  }
  var args = options.args;
  options.operation = args[0];
  if (args[0] && args[0].toUpperCase() === "ADD") {
    options.hostname = args[1];
    options.tag = args.slice(2);
  } else {
    options.tag = args.slice(1);
  }
}

if (!options.args && !options.operation) {
  throw new Error("Operation needed to execute this command. Try using --help");
}

var tags = _.concat([], options.tag ? options.tag : []);

var data = utils.createDataObject(options, {'tags': tags});

if (options.verbose) {
  console.log(data);
}

var operation = options.operation.toUpperCase();

switch (operation) {
  case (operation.match(/^ADD/) || {}).input:
    op.add(data, options.verbose);
    break;
  case (operation.match(/^UPDATE/) || {}).input:
    op.update(data, options.verbose);
    break;
  case (operation.match(/^REMOVE/) || {}).input:
    op.remove(data, options.verbose);
    break;
  case (operation.match(/^SEARCH/) || {}).input:
    var result = op.search(data, options.verbose);
    if (Array.isArray(result)) {
      for (var i=0; i<result.length; i++) {
        console.log(result[i]);
      }
      if (result.length === 1) {
        ncp.copy(result[0], function () {
          console.log("Added to clipboard");
        });
      }
    } else {
      console.log(result);
    }
    break;
  default:
    console.log("Invalid operations. One of " + op.allowed_operations.toString() + " is required");
}
