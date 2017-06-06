const express = require('express')
const app = express()
var bodyParser = require('body-parser')

var mongoose = require("mongoose");
mongoose.connect("mongodb://mongo:27017/testdb");
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() { console.log('db connected') });

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: '172.19.0.2:9200',
  log: 'trace'
});

client.ping({
  requestTimeout: 1000
}, function (error) {
  if (error) {
    console.trace('server down!');
  } else {
    console.log('server up');
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var mongoosastic = require("mongoosastic");

var bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: { type:String, es_indexed:true },
  content: { type:String, es_indexed:true }
});
bookSchema.plugin(mongoosastic,{
  host:'172.19.0.2',
  port: 9200
});

var Book = mongoose.model("Book", bookSchema);

Book.createMapping(function(err, mapping){
  if(err){
    console.log('error creating mapping');
    //console.log(err);
  }else{
    console.log('mapping created!');
    //console.log(mapping);
  }
});

app.post('/save', function(req, res) {
  var book = new Book({
    title: req.body.title,
    author: req.body.author,
    description: req.body.description,
    content: req.body.content
  });

  book.save(function(err) {
    book.on('es-indexed', function(err,res) {
      console.log('book indexed')
    });
  });

  res.send("data saved");
})

app.get('/list', function (req, res) {

    // Book.find({}, function(err, docs) {
    //     if (!err){
    //         res.send(docs)
    //         process.exit();
    //     } else {throw err;}
    // });

    Book.search(
      {
        query_string: {
          query: "markc"
        }
      }, function(err,results) {
        console.log("results",results)
        console.log("hits",results.hits)
        res.send(results.hits)
        console.log("error",err)
      }
    );
})

app.post('/search-result', function (req, res) {
    Book.search(
      {
        query_string: {
          query: req.body.keyword
        }
      }, function(err,results) {
        console.log("results",results)
        console.log("hits",results.hits)
        res.send(results.hits)
        console.log("error",err)
      }
    );
})

app.get('/search', function (req, res) {
  const searchform = "<head><title>test</title></head><body>"
            +'<form method="post" action="/search-result">'
            +' <input type="text" placeholder="search" name="keyword"><br/>'
            +'  <input type="submit" value="search">'
            +'</form>'
            +'<a href="/">add item</a>'
            +"</body></html>"
  res.send(searchform)
})


app.get('/', function (req, res) {

  const form = "<head><title>test</title></head><body>"
            +'<form method="post" action="/save">'
            +'  <input type="text" placeholder="title" name="title"><br/>'
            +'  <input type="text" placeholder="author" name="author"><br/>'
            +'  <input type="text" placeholder="description" name="description"><br/>'
            +'  <input type="text" placeholder="content" name="content"><br/>'
            +'  <input type="submit" value="submit">'
            +'</form>'
            +'<a href="/search">search</a>'
            +"</body></html>"
  res.send(form)
})

app.listen(80,'0.0.0.0', function () {
  console.log('running on port 80!')
})
