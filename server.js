 var fs = require('fs'),
     nconf = require('nconf');

 var config = nconf.file({
     file: 'config.json'
 });

 var url = config.get("database:url");
 var username = config.get("database:username");
 var password = config.get("database:password");

 console.log(url, username, password);
