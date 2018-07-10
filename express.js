var express 		= require('express');
var createHandler 	= require('github-webhook-handler')
var fs				= require('fs');
var SteamTotp 		= require('steam-totp');
var config 			= require('./config')
var execPHP 		= require('./express/js/phpexec.js')();
var Git 			= require('./express/js/git.js')();

var handler 		= createHandler({ path: '/webhook' , secret: config.gitwebhook.secret})
var app 			= express();
var work_path 		= "/home/card/node-js-projects"

var exec2shell = require('child_process').exec;
execPHP.phpFolder 	= work_path;
var work_dirs 		= config.gitwebhook.work_dirs


app.get('/', function (req, res) {
	res.send("heu");
});

app.get('/online', function (req, res, next) {

fs.readFile('/home/card/wirebuild/garrysmod/data/iin/logs/online.txt', (err, jdata) => {	
	fs.readFile(__dirname + '/express/' +"online.html", (err, data) => {
		res.send("<script>var json_data='"+jdata+"'</script>"+data);
		res.end()
	});
});

});



console.log(__dirname )
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