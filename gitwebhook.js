var http = require('http')
var createHandler = require('github-webhook-handler')
var config = require('./config')

var handler = createHandler({ path: '/webhook' , secret: config.gitwebhook.secret})
const simpleGit = require('simple-git')()

var exec2shell = require('child_process').exec;
var SteamTotp = require('steam-totp');


var fs = require('fs');
var sharedSecret = config.steam_secret;
var lgbt = [
	"#d40606",
	"#ee9c00",
	"#e3ff00",
	"#06bf00",
	"#001a98",
]

http.createServer(function (req, res) {

	var vpath = req.url
	console.log(vpath)
	if (sharedSecret[vpath])
	{
		var authCode = SteamTotp.getAuthCode(sharedSecret[vpath]);
		console.log(authCode)
		var sout = "<font size='72' face='comic sans ms'>"
		for (i = 0; i < authCode.length; i++) {
			sout+='<font color="'+lgbt[i]+'">'+authCode[i]+'</font>'
		}
		sout+="</font>"
		res.end(sout)
	}

	handler(req, res, function (err)
	{
		res.statusCode = 404
		res.end('no such location')
	})
	
}).listen(1337)

handler.on('error', function (err) {
  	console.error('Error:', err.message)
})

var work_dirs = config.gitwebhook.work_dirs

function GitPull(workdir,event,rep_name)
{
	console.log("git pull ("+workdir+")")
	simpleGit.cwd(workdir)
	.stash()
	.exec(() => console.log("git stash"))
	.pull('origin','master',(err, update) => {
	
			fs.writeFile(config.gitwebhook.lua_data, JSON.stringify(Object.assign(event,update)), (error) => {})
			exec2shell("~/con.sh echo_git_commit")
	
	})
	.stash("apply")
	.exec(() => {
		console.log("git stash apply")
		//if(rep_name=="node-js-projects")exec2shell("forever restartall")
	})
}
 
handler.on('push', function (event) {
	
	var rep_name = event.payload.repository.name
	
	if(work_dirs[rep_name])
	{
		GitPull(work_dirs[rep_name],event,rep_name) 
	}
	
}) 	