const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 4200;


app.use(express.json());

app.use(session({
  secret: 'acfebbed-a59a-4739-8fc0-2aa794d742fd',
  resave: false,
  saveUninitialized: true
}));

var auth = function(req, res, next) {
  if (req.session && req.session.authorized)
    return next();
  else
    return res.sendFile(path.join(__dirname, 'dist/web/login.html'))
};

app.post('/login', (req, res) => {
  console.log(req.session);
  if (req.body.password == "scarlett123") {
    req.session.authorized = true;
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/web/index.html'));
});

app.use('/', auth, express.static(path.join(__dirname, 'dist/web')));

app.listen(port, () => {
  console.log(`App Listening http://localhost:${port}`);
});