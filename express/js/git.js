const simpleGit = require('simple-git')()

class Git {

	Pull(workdir,event,rep_name,callback)
    {
	    console.log("git pull ("+workdir+")")
	    simpleGit.cwd(workdir)
	    .stash()
	    .exec(() => console.log("git stash"))
	    .pull('origin','master',(err, update) => {
        
	    		//fs.writeFile(config.gitwebhook.lua_data, JSON.stringify(Object.assign(event,update)), (error) => {})
                //exec2shell("~/con.sh echo_git_commit")
                callback(JSON.stringify(Object.assign(event,update)))
        
	    })
	    .stash("apply")
	    .exec(() => {
	    	console.log("git stash apply")
	    })
    }
}
module.exports = function() {
	return new Git();
};