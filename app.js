"use strict"

const
  Router = require('koa-router'),
  passport = require('./auth'),
  session = require('koa-sess'),
  redisStore = require('koa-redis'),

  koa = require('koa'),
  app = koa();


//Middleware: request logger
function *reqlogger(next){
  console.log('%s - %s %s',new Date().toISOString(), this.req.method, this.req.url);
  yield next;
}
app.use(reqlogger);

//Initialize session
app.keys=['koa-tutorial'];
app.use(session({
  cookie: {maxAge: 1000 * 60 * 5},
  store : redisStore()
}));

//Initialize passport with session
app.use(passport.initialize());
app.use(passport.session());

app.use(Router(app));

app.get('/', function *(){
  console.log('Express-style example');
  this.body = "This is root page ('/')";
});



const publicRouter = new Router();

//Configure /auth/github & /auth/github/callback
publicRouter.get('/auth/github', passport.authenticate('github', {scope: ['user','repo']}));
publicRouter.get('/auth/github/callback',
  passport.authenticate('github', {successReturnToOrRedirect: '/', failureRedirect: '/'})
);


app.use(publicRouter.middleware());



//Secures routes
const securedRouter = new Router();

//Middleware: authed
function *authed(next){
  if (this.req.isAuthenticated()){
    yield next;
  } else {
    //Set redirect path in session
    this.session.returnTo = this.session.returnTo || this.req.url;
    this.redirect('/auth/github');
  }
}

securedRouter.get('/app', authed, function *(){
  this.body = 'Secured Zone: koa-tutorial\n' + JSON.stringify(this.req.user, null, '\t');
});

securedRouter.get('/app2', authed, function *(){
  this.body = 'Secured Zone: koa-tutorial APP2\n'
});

app.use(securedRouter.middleware());

app.use(function *(){
  this.body = 'Hello World';
});

app.listen(3000);
