 var fs = require('fs'),
     nconf = require('nconf'),
     mongoose = require('mongoose'),
     AssociationMiner = require(__dirname + "/associationMiner"),
     express = require('express'),
     Q = require('Q'),
     app = express();

 app.use(express.static(__dirname));


 app.get('/getAssociationRules/:databaseName/:supportMin/:confidenceMin', function(req, res) {
     var database = req.params.databaseName;
     var supportMin = req.params.supportMin;
     var confidenceMin = req.params.confidenceMin;

     getAssociationRules(databases[database], supportMin, confidenceMin)
         .then(function(rules) {
             res.send(rules);
         })
 });

 app.get('/loadDatabase/:databaseName', function(req, res) {
     var databaseName = req.params.databaseName;
     var database = databases[databaseName];
     database.find(function(err, docs) {
         res.send(docs);
         res.end();
     })
 });

 app.listen(44544);

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

 var databases = {
     0: Transaction = mongoose.model('Transaction', TransactionSchema),
     1: Transaction = mongoose.model('Transaction_1', TransactionSchema),
     2: Transaction = mongoose.model('Transaction_2', TransactionSchema),
     3: Transaction = mongoose.model('Transaction_3', TransactionSchema),
     4: Transaction = mongoose.model('Transaction_4', TransactionSchema),
     5: Transaction = mongoose.model('Transaction_5', TransactionSchema)
 }

 var getAssociationRules = function(database, supportMin, confidenceMin) {
     var deferred = Q.defer();

     var miner = new AssociationMiner(database);
     miner.mine(supportMin, confidenceMin, function(rules) {
         deferred.resolve(rules);
     });

     return deferred.promise;
 }
