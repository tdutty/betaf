const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

const hostname = "127.0.0.1"
const port = "3000"


mongoose.connect('mongodb://localhost:27017/api', {useNewUrlParser: true});

let db = mongoose.connection;

db.once('open', (dbOpen) => {
  console.log("mongodb connected")
});


app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.send(200);
    } else {
        return next();
    }
});

app.use(bodyParser.json());


app.listen(port,hostname, function () {
    console.log('app listening at port', port);
});


app.get('/something', function(req, res) { 
    db.collection('').find({}).limit(1).toArray(function(result) {
        res.end(result)
    })
})