var http = require('http')
var createHandler = require('github-webhook-handler')
var config = require('./config')

var handler = createHandler({ path: '/webhook' , secret: config.gitwebhook.secret})
const simpleGit = require('simple-git')()

var exec2shell = require('child_process').exec;

var fs = require('fs');

http.createServer(function (req, res) {

	var vpath = req.url.split('?').shift()
	
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

function GitPull(workdir,event)
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
	.exec(() => console.log("git stash apply"))
}
 
handler.on('push', function (event) {
	
	var workdir = event.payload.repository.name
	
	if(work_dirs[workdir])
	{
		GitPull(work_dirs[workdir],event)
	}
	
}) 	