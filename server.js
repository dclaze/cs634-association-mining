 var fs = require('fs'),
     nconf = require('nconf'),
     mongoose = require('mongoose'),
     AssociationMiner = require(__dirname + "/associationMiner");

 var database = nconf.file({
     file: 'database.json'
 });

 var url = database.get("url"),
     username = database.get("username"),
     password = database.get("password"),
     defaultDatabase = database.get("defaultDatabase");

 var mongoUrl = ['mongodb://', username, ':', password, '@', url, '/', defaultDatabase].join("");
 mongoose.connect(mongoUrl, function(err) {
     if (err) throw err;

     mine();
 });

 var Schema = mongoose.Schema,
     ObjectId = Schema.ObjectId;

 var ProductSchema = new Schema({
     id: ObjectId,
     name: String
 });
 var Product = mongoose.model('Product', ProductSchema);

 var TransactionSchema = new Schema({
     products: [ProductSchema],
     date: Date
 });

 var Transaction = mongoose.model('Transaction', TransactionSchema);

 var mine = function() {
     var miner = new AssociationMiner(Transaction);
     var supportMin = .2;
     var confidenceMin = .5;
     miner.mine(supportMin, confidenceMin, function(rules) {
         var rulesAsString = rules.map(function(rule) {
             return [rule.left, "->", rule.right, "[", rule.support.toFixed(2) * 100, "%", ",", rule.confidence * 100, "%", "]"].join(" ");
         })
         console.log(rulesAsString)
     });
 }
