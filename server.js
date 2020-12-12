const cookieParser = require('cookie-parser');
const express = require('express');
const mongoose = require('mongoose');
const routes = require('./routes/routes')

const app = express();

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.DATABASE, {useNewUrlParser: true,useUnifiedTopology: true,useCreateIndex: true}, (err) => {
    if(!err){console.log('MongoDb Connection Succeeded.')}
    else{
        console.log('Unable to connect because of : ' + err);
    }
})

const port = process.env.PORT;


app.use('/', routes);

app.listen(port, (req, res) => {
    console.log(`server started at port ${port}`)
})