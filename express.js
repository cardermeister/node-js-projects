var express 		= require('express');
var createHandler 	= require('github-webhook-handler')
var fs				= require('fs');
var SteamTotp 		= require('steam-totp');
var config 			= require('./config')
var execPHP 		= require('./express/js/phpexec.js')();
var Git 			= require('./express/js/git.js')();
var steam_oauth   	= require('steam-login');

var handler 		= createHandler({ path: '/webhook' , secret: config.gitwebhook.secret})
var app 			= express();
var work_path 		= "/home/card/node-js-projects"

var exec2shell = require('child_process').exec;
execPHP.phpFolder 	= work_path;
var work_dirs 		= config.gitwebhook.work_dirs

app.use(require('serve-favicon')(__dirname+"/express/public/favicon.ico")); 
app.use(require('express-session')({ resave: false, saveUninitialized: false, secret: 'tvoi rot naobarot' }));
app.use(steam_oauth.middleware({
	realm: 'http://wirebuild.tk:1337/', 
	verify: 'http://wirebuild.tk:1337/verify',
	apiKey: 'C9E4E47AB57681D140D9924A16196EC8'}
));


app.get('/', function(req, res) {

	res.set('Content-Type', 'text/html');
	res.write('<meta charset="utf-8">')
	res.write('<br><a href="/online">/online</a>')
	res.write('<br><a href="/online2">/online2</a>')

	if(req.user)
	{
		res.write('<br><a href="/console">/console</a>')
		res.write('<br><a href="/logout">[logout]</a>')
		res.write('<br>hello ' + req.user.username)
	}
	else
	{
		res.write('<br><a href="/authenticate"><img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/steamworks_docs/english/sits_small.png"></a>')
	}
	res.end()

	
});

app.get('/authenticate', steam_oauth.authenticate(), function(req, res) {
	res.redirect('/');
});

app.get('/verify', steam_oauth.verify(), function(req, res) {
	var date = new Date()
	fs.open(__dirname + "/express/auth.log", 'a', 0777, function( e, id ) {
		fs.write( id, date+" "+req.user.username+" "+req.user.steamid + "\n", null, 'utf8', function(){
    		fs.close(id, function(){});
		});
	});
	res.redirect('/');
	//res.send(req.user).end();
});

app.get('/logout', steam_oauth.enforceLogin('/'), function(req, res) {
	req.logout();
	res.redirect('/');
});


app.get('/online', function (req, res, next) {
	res.sendFile('express/online.html' , { root : __dirname});
});

app.get('/online2', function (req, res, next) {
	res.sendFile('express/online2.html' , { root : __dirname});
});

app.get('/online/json_data.json', function (req, res, next) {
	fs.readFile('/home/card/wirebuild/garrysmod/data/iin/logs/online.txt', (err, jdata) => {	
		res.end(jdata)
	});
});

function check_auth(req,res)
{
	if ((req.user == null) || (req.user.steamid!="76561198058802011" && req.user.steamid!="76561198005221681" && req.user.steamid!="76561198041202334")) {
		res.redirect('/');
		res.end();
		return false
	}
	return true
}

app.get('/console', function (req, res, next) {

	if(check_auth(req, res))
	{
		fs.readFile('/home/card/wirebuild/screenlog.0', (err, log) => {	
			if (err) {fs.truncate('/home/card/wirebuild/screenlog.0', 0, function(){console.log('file too big')})}
			else
			{
				res.set('Content-Type', 'text/html');
				res.write('<meta charset="utf-8">')
				res.write('<style>body{white-space: pre-wrap; font-family:"consolas"; background-color:black; color:green;}</style>')
				res.write("<plaintext>"+log)
				res.end()
			}
		});
	}
});

app.use("/public",express.static(__dirname + '/express/public'));

for (user in config.steam_secret)
{
	app.get(user,function(req,res)
	{
		console.log(req.route.path)
		var authCode = SteamTotp.getAuthCode(config.steam_secret[req.route.path]);
		res.send(authCode)
	})
}

app.post('/webhook', function (req, res) {
	handler(req, res, function (err)
	{
		res.statusCode = 404
		res.end('no such location')
	})
});

app.use('*.php',function(request,response,next) {
	execPHP.parseFile(request.originalUrl,function(phpResult) {
		response.write(phpResult);
		response.end();
	});
});

handler.on('push', function (event) {
	var rep_name = event.payload.repository.name
	if(work_dirs[rep_name])
	{
		Git.Pull(work_dirs[rep_name],event,rep_name,function(out)
		{
			fs.writeFile(config.gitwebhook.lua_data, out, (error) => {})
			exec2shell("~/con.sh echo_git_commit")
		}) 
	}
}) 	

app.listen(1337, function () {
	console.log('Node server listening on port 1337!');
}); 
