const express = require('express')
const app = express()

var mongoose = require("mongoose");
mongoose.connect("mongodb://mongo:27017/testdb");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() { console.log('db connected') });

var mongoosastic = require("mongoosastic");

var bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: { type:String, es_indexed:true },
  content: { type:String, es_indexed:true }
});
bookSchema.plugin(mongoosastic);  
var Book = mongoose.model("Book", bookSchema);


var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: '172.19.0.2:9200',
  log: 'trace'
});

app.get('/', function (req, res) {
  res.send('checkmate')
})

app.listen(80,'0.0.0.0', function () {
  console.log('running on port 80!')
})
