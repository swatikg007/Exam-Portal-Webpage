const express = require('express');
const app = express();
const routes = require('./routes.js');
const path = require('path');
require('dotenv').config();
app.use(express.static("public"));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.get('/', routes);
app.post('/register', routes);
app.get('/login', routes);
app.post('/login', routes);
app.get('/success', routes);
app.get('/logout', routes);
app.get('/examcenter', routes);
app.post('/addmsg', routes);
app.get('/upload',routes);
app.post('/add_question',routes);
app.get('/exam_form',routes);
app.post('/exam_form',routes);
app.get('/exam_page',routes);
app.post('/exam_page',routes);
app.post('/dashboard',routes);
app.get('/result',routes);
app.get('/forbidden',routes);
app.get('/dashboard',routes);
app.get('/answerKey',routes);
app.get('/ourteam',routes);

const PORT = 3000;
app.listen(process.env.PORT || 3000, () => console.log("Server Stated At Port", PORT));
