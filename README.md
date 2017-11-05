[![Build Status](https://travis-ci.org/mmornati/ssh2-keeper.svg?branch=master)](https://travis-ci.org/mmornati/ssh2-keeper) [![Code Climate](https://codeclimate.com/github/mmornati/ssh2-keeper/badges/gpa.svg)](https://codeclimate.com/github/mmornati/ssh2-keeper) [![Test Coverage](https://codeclimate.com/github/mmornati/ssh2-keeper/badges/coverage.svg)](https://codeclimate.com/github/mmornati/ssh2-keeper/coverage) [![Issue Count](https://codeclimate.com/github/mmornati/ssh2-keeper/badges/issue_count.svg)](https://codeclimate.com/github/mmornati/ssh2-keeper)

# ssh2-keeper

[![Greenkeeper badge](https://badges.greenkeeper.io/mmornati/ssh2-keeper.svg)](https://greenkeeper.io/)
Store servers with tags, simple search to use as SSH2 connections

## Why this project?
Using an OSx (or Linux) environment, when you need to manage lot of servers it could be difficult to remember all the hostnames or ip addresses.
On the Windows system I used to use mRemote, but I didn't find anything similar on OSx/Linux.
That's the idea to create a simple CLI program allowing to store all the connection information using tags (like mRemote does).

## How to install the project
It's a NodeJS project and actually it is not available on the npm repository. So, the better way is downloading sources from github and install globally from sources:

```bash
git clone https://github.com/mmornati/ssh2-keeper.git
cd ssk-keeper
npm install -g .
```
![Installation Image](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476013263/Schermata_2016-10-09_alle_11.53.41_z3kuzt.png)

The ssh2-keeper is now available as `sk` command on your system.

## Configuration

After the global installation the configuration folder is into the global node modules installation folder.
You can check which one is on your system using:

```bash
npm root -g
```

![Node Modules Folder](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476016292/Schermata_2016-10-09_alle_14.24.12_cc43h3.png)

On my system for example, the global folder is */usr/local/lib/node_modules* which means, after the ssh2-keeper installation, the configuration folder will be `/usr/local/lib/node_modules/ssh2-keeper/config`.
Inside this latest one you will find a *default.json* file and you must configure the database folder.

```json
{
  "db_path": "/Users/mmornati/ssh2-keeper",
  "server_collection": "servers",
  "tag_collection": "tags",
  "default_username": "mmornati",
  "show_ssh_command": true
}
```

## Usage

If you globally installed the module, using `sk --help` allow you to retrieve the script documentation.

```bash
Successfully connected to : ./db
USAGE: node sk [OPTION1] [OPTION2]... arg1 arg2...
The following options are supported:
  -v, --verbose <ARG1>       	Show verbose log
  -t, --tag <ARG1>           	Tag(s) to allow you to find server (multiple)
  -h, --hostname <ARG1>      	Hostname of your server
  -a, --admin_server <ARG1>  	If you need to connect to an Admin server to reach your target. Ex: ssh -tt pi@192.168.0.101 ssh -tt pi2@192.168.0.102
  -i, --ip <ARG1>            	Server IP address.
  -f, --identity_file <ARG1> 	Identity File
  -u, --username <ARG1>      	Username to connect to your server. If empty the one in configuration file be used
  -o, --operation <ARG1>     	One of ADD, SEARCH, UPDATE or REMOVE
```

### Add a new server

```bash
sk -o add -h server35.mornati.net -i 192.168.100.35 -t jenkins -t slave -t slave04 -t integration
```

This will add a server (if the hostname it is not already present with the same hostname) with the provided parameters and tags.

### Update using add

With a line like the previous one we've seen, you can also update server parameters:

```bash
sk -o add -h server35.mornati.net -i 192.168.100.39
```

In this way, for example, if the server was already present into database, you will update the IP address. All others information already present into database will be kept.
In the same way you can add a new tag to the server

```bash
sk -o add -h server35.mornati.net -t mypersonalserver
```

will add a new tag to the server (if not already present).

![Update Tags](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476013245/update_tags_hsot6u.gif)

### Update

Using the **Update** operation you can update a single server, using the hostname, or update all the servers related to a tag.

```bash
~ sk -o update -h server20.mornati.net -u marco -f ~/.ssh/test_rsa
```

Using a tag, like in the followind example:

```bash
~ sk -o update -t www -u mmornati -f ~/.ssh/test2_rsa
```

It will search foll all the servers tagged with *www* and set to anyone **mmornati** as username and **~/.ssh/test2_rsa** as identity file.

This command will update the *server20.mornati.net* putting **marco** as username and **~/.ssh/test_rsa** as identity file

### Search

The most used function will surely be the search one. You can search a server using the hostname, which will provide you the list of data known about the server:

```bash
~ sk -o search -h server20.mornati.net
Successfully connected to : ./db
{ hostname: 'server20.mornati.net',
  ip: '192.168.100.20',
  tags: [ 'www', 'front', 'front02', 'preprod', 'france' ],
  _id: '15404e5a1b134cb289ffae0cc89968ca' }
Added to clipboard
```

![Search by Hostname](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476013227/search_by_hostname_sr1ucu.gif)

Or you can search using tags: it will return you the intersection between all provided tags.

```bash
~ sk -o search -t prod -t front -t italy
Successfully connected to : ./db
ssh mmornati@server1.mornati.net
ssh mmornati@server2.mornati.net
```

It will return you all the 'front' and 'prod' servers for 'italy' (servers must have the 3 tags to be into the list).
When the list gives you a single result, the ssh command will be directly in your clipboard: with a simple **CTRL+V** you can use it! :)

#### Search improved

As I said before, this one is the most used function, I created an 'undocumented' function allowing you to search in this way:

```bash
~ sk search prod front01 italy
Successfully connected to : ./db
ssh mmornati@server1.mornati.net
Added to clipboard
```

So, without providing the option name. In this case:

* the first argument is the operation (SEARCH, ADD)
* if it is SEARCH from the second arguments all others will be consider as tags
* if it is ADD the second argument is the hostname and all others are tags

![Search Prod Italy](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476013226/search_italy_prod_ax8tdi.gif)

![Search by Steps](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476013230/search_by_steps_aeobkw.gif)

## Tips
To initialize my work environment database I used 'spreadsheet' (yes, it is amazing, but it was quick!).

![Spreadsheet](https://res.cloudinary.com/blog-mornati-net/image/upload/v1476017695/Schermata_2016-10-09_alle_14.54.11_ancb8b.png)

I just copied hostnames and IPs I had on another document, and then, using the spreadsheet's CONCATENATE function I was able to generate the list of 'ADD' commands.

## Server with proxy

If you are using an admin server between you PC and the target server (for example on the configuration environment) you can store this information into the database (*admin_server*) and the ssh command sent by the ssh2-keeper will be ready to use.

```bash
sk search preprod france front02
Successfully connected to : ./db
ssh -tt mmornati@adm01.mornati.net ssh -tt mmornati@server20.mornati.net
Added to clipboard
```

## Next Steps

* What you need to improve it :)
