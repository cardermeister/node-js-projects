const net = require('net');

const Discord = require("discord.js");
const client = new Discord.Client();

//var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');

var config = require('./config')
var SteamID = require('steamid');

var authorized_role = "gmod auth"


client.login(config.discord.token);
//client.login("MzkwNTE3Mjk2MTkzMzM5Mzky.DRLRMw.CdKKLbdU2tbVGTmRUNV7LmizLf0"); //pornersin user blyat ne pomny email

//https://discordapp.com/api/oauth2/authorize?client_id=377890604199313408&scope=bot&permissions=0

client.on('ready', () => {
	console.log(`Logged in as ${client.user.username}!`);
});

//["251763595262558208"]: "Card",

var cmds = {}
var _role = 
{
	Devs: ["dev"],
	Admins: ["dev","admin"],
	Coders: ["dev","coders","admin"],
	Authorized: ["dev","admin","coders",authorized_role],
}
//concat for custom ids

function add_cmd(cmd,func,role){cmds[cmd] = {func: func, role: role}}
function call_cmd(cmd,line,msg)
{
	if(cmds[cmd])
	{
		if( !cmds[cmd].role || msg.member.roles.some(r=>cmds[cmd].role.includes(r.name)) || cmds[cmd].role.includes(msg.author.id) )
		{
			console.log("run",msg.author.id)
			cmds[cmd].func(line,msg)
		}
	}
}

var auth_member_ids = {}

function lua_to_js_members(obj,tokenfix,discordid)
{
	var newobj = {}
	for (key in obj) {
		var newkey = obj[key]
		if(tokenfix && tokenfix && newkey==tokenfix)newkey=discordid
		newobj[newkey] = key;
	}
	return newobj
}

fs.readFile(config.discord.discord_auth, function(err, data)
{
	obj = JSON.parse(data)
	auth_member_ids = lua_to_js_members(obj)
})


var regex_token =new RegExp(/^KEY-\d+-END$/g);

add_cmd("auth",function(token,msg)
{
	token = token.trim()
	
	var author__id = msg.author.id

	if ( auth_member_ids[author__id] )
	{
		msg.reply("already linked to steamid "+auth_member_ids[author__id])
		if(!msg.member.roles.some(r=>r.name==authorized_role))
		{
			let role = msg.guild.roles.find("name", authorized_role);
			msg.member.addRole(role)
		}
		
		return
	}
	
	if (!regex_token.test(token) || token.length<5)
	{
		msg.reply("this is not valid token!")
		return
	}

	exec("~/con.sh 'discord-auth-key \""+token+"\" \""+author__id+"\"'")
	
	fs.readFile(config.discord.discord_auth, function(err, data)
	{
		obj = JSON.parse(data)
		
		auth_member_ids = lua_to_js_members(obj,token,author__id)
		
		console.log(auth_member_ids)
		
		if ( auth_member_ids[author__id] )
		{
			let role = msg.guild.roles.find("name", authorized_role);
			msg.member.addRole(role)
			msg.reply("successfully linked own account to steamid "+auth_member_ids[author__id])
		}
	})

	
})

add_cmd("setgame",function(line,msg)
{
	client.user.setGame(line)
},_role.Devs)

add_cmd("status",function(line,msg)
{
	discord_lua("discord.status()",msg,false)
})

add_cmd("users",function(line,msg)
{
	var fields = []
	
	for (key in auth_member_ids)
	{
		
		if ( regex_token.test(key) )continue
		var sid = new SteamID(auth_member_ids[key]);
		var uname = ""
		
		try{uname = msg.guild.members.find('id',key).user.username}catch(e){uname = e; continue}
		
		fields.push(
		{
			name: uname+" <"+key+">",
			value: "["+auth_member_ids[key]+"](http://steamcommunity.com/profiles/"+sid+")",
		})
	}
	msg.channel.send({embed: {fields:fields,}})
},_role.Authorized)

add_cmd("restart",function(line,msg)
{
	exec("~/sb.sh restart", function(error, stdout, stderr){
		if (!error){
			msg.reply("SUCCESS: Restarting server...")
		}
		else
		{
			msg.reply(String(error))
		}
	})
},_role.Admins)

add_cmd("l",function(line,msg)
{	
	discord_lua(line,msg,false)
},_role.Devs)

add_cmd("lm",function(line,msg)
{	
	msg.author.createDM().then(function(channel)
	{
		discord_lua(line,msg,channel.id)
	})
},_role.Devs)

add_cmd("say",function(line,msg)
{
	line = "Say[["+line+"]]"
	discord_lua(line,msg,false)
},_role.Devs)

add_cmd("print",function(line,msg)
{
	line = "print("+line+")"
	discord_lua(line,msg,false)
},_role.Devs)

cmds.p = cmds.print
 
add_cmd("table",function(line,msg)
{
	line = "PrintTable("+line+")"
	discord_lua(line,msg,false)
},_role.Devs)


add_cmd("src",function(line,msg)
{
	line = "print(GetFunctionSource("+line+"))"
	discord_lua(line,msg,false)
},_role.Devs)

add_cmd("fever",function(line,msg)
{
	var args = line.split(' ',3)
	if (line=="logs")
	{
		exec("~/node-js-projects/fever logs", function(error, stdout, stderr){
			msg.reply(String(stdout).replace(/\W\[\d\dm/g,"").replace(/\/home\/card\/node-js-projects/g,""))
		})
	}
	else if (args[0]=="logs" && args[1])
	{
		console.log('get logs int')
		exec("~/node-js-projects/fever logs "+parseInt(args[1],10)+" | tail -n "+parseInt(args[2],10), function(error, stdout, stderr){
			msg.reply(String(stdout).replace(/\W\[\d\dm/gm,"").replace(/\/home\/card\/node-js-projects/gm,""))
		})
		/// fever logs 2 | tail -n 30
	}
	else
	{
		exec("~/node-js-projects/fever "+line, function(error, stdout, stderr){
			msg.reply(String(stdout).replace(/\W\[\d\dm/gm,"").replace(/\/home\/card\/node-js-projects/gm,""))
		})
	}
},["251763595262558208"])
 

add_cmd("idle",function(line,msg)
{
	if (line=="start")
	{
		line = "idlestart"
	}
	else if(line=="stop")
	{
		line = "idlestop"
	}
	else
	{
		return 
	}
	exec("~/node-js-projects/fever "+line, function(error, stdout, stderr){
			msg.reply(String(stdout).replace(/\W\[\d\dm/g,""))
	})
},["251763595262558208"])

add_cmd("connect",function(line,msg)
{
	msg.channel.send({embed: {
		color: 254174,
		title: "wirebuild",
		description: "steam://connect/195.2.252.214:27015",
	}})
	//msg.reply("steam://connect/195.2.252.214:27015 <- Click to connect")
})


add_cmd("help",function(line,msg)
{
	var cmdadada = ""
	
	for (key in cmds){
		cmdadada+="• "+key
		if (cmds[key].role) cmdadada+=" ("+cmds[key].role+")"
		cmdadada+="\n"
	}
	
	const embed = new Discord.RichEmbed()
	.setTitle('Помощь')
	.setDescription("")
	.setColor(0x00AE86)
	.addField(":dog: Commands", cmdadada, false)
	msg.channel.send({embed});
})
  
add_cmd("clear",function(line,msg)
{
	let deleteStuff = () => {
	let count = 0;
	msg.channel.fetchMessages({limit: 100})
	.then(messages => {
		let messagesArr = messages.array();
		let messageCount = messagesArr.length;
	
		for(let i = 0; i < messageCount; i++) {
		messagesArr[i].delete()
			.then(function() {
			count = count + 1;
			if(count >= 100) {
				deleteStuff();
			}
			})
			.catch(function() {
			count = count + 1;
			if(count >= 100) {
				deleteStuff();
			}
			})
		}
	})
	.catch(function(err) {
		console.log('error thrown');
		console.log(err);
	});
	};
	deleteStuff();
},_role.Devs)


add_cmd("ee",function(line,msg)
{
	
	const collector = msg.createReactionCollector((reaction, user) => 
		true
	).on("collect", reaction => {
		const chosen = reaction.emoji.name;
		console.log(chosen)
		//collector.stop();
	});
	
	//msg.author.username = "gei"
	msg.author.createDM().then(function(channel)
	{
		channel.send(channel.id)
	})
	
	
},_role.Devs)

add_cmd("l0k",function(line,msg)
{
	var sendtext = "```"
    fs.readFile('lua_run.log', 'utf8', (err, data) => {
  		if (err) throw err;
  		var lines = data.split('\n');
  		for(var linef = lines.length-line-1; linef < lines.length; linef++){
      		sendtext+=lines[linef]+"\n"
    	}
    	sendtext+="```"

    	msg.author.createDM().then(function(channel)
		{
			channel.send(sendtext)
		})
	});
	
	
},["251763595262558208","324890460185165834"])

var lamp_ip = "1.1.1.1"

fs.readFile("card.ip","utf8", function(err, data)
{
	if (!err)
	{
		lamp_ip = data;
	}
})

add_cmd("setip",function(line,msg)
{
	lamp_ip = line
	fs.writeFile('card.ip', lamp_ip);
	msg.reply("Success!")
	msg.delete()
},["251763595262558208"])

function yee_do(cmd)
{
	const yeelight_client = net.createConnection({host: lamp_ip, port: 55443}, () => {
		yeelight_client.write(cmd+'\r\n');
		yeelight_client.end()
	});
}

function ye_rgb(r,g,b)
{
	return (r*65536)+(g*256)+b
}

function yee_do_menu(msg)
{
	msg.channel.send("YEELIGHT CONTROL PANEL").then(function(menu)
	{
		menu.react('🔄').then(
		menu.react('🌞').then(
		menu.react('📕').then(
		menu.react('📗').then(
		menu.react('📘').then(
		menu.react('🍆').then(
		menu.react('🌚') ))))))
		const collector = menu.createReactionCollector((reaction, user) => 
			user.id === msg.author.id &&
			(reaction.emoji.name === "🌞" ||
			reaction.emoji.name === "🌚" ||
			reaction.emoji.name === "📗" ||
			reaction.emoji.name === "📕" ||
			reaction.emoji.name === "📘" ||
			reaction.emoji.name === "🍆" ||
			reaction.emoji.name === "🔄")
		).once("collect", reaction => {
			const chosen = reaction.emoji.name;
			if(chosen === "🌞"){
				yee_do('{"id":1,"method":"set_power","params":["on", "smooth", 500]}')
				yee_do('{"id":2,"method":"set_bright","params":[100, "smooth", 500]}')
			}else if(chosen === "🌚"){
				yee_do('{"id":1,"method":"set_power","params":["on", "smooth", 500]}')
				yee_do('{"id":2,"method":"set_bright","params":[10, "smooth", 500]}')
			}else if(chosen === "🔄"){
				yee_do('{"id":1,"method":"toggle","params":[]}')
			}else if(chosen === "📕"){
				yee_do('{"id":1,"method":"set_power","params":["on", "smooth", 500]}')
				yee_do('{"id":2,"method":"set_rgb","params":['+ye_rgb(255,0,0)+', "smooth", 500]}')
			}else if(chosen === "📗"){
				yee_do('{"id":1,"method":"set_power","params":["on", "smooth", 500]}')
				yee_do('{"id":2,"method":"set_rgb","params":['+ye_rgb(0,255,0)+', "smooth", 500]}')
			}else if(chosen === "📘"){
				yee_do('{"id":1,"method":"set_power","params":["on", "smooth", 500]}')
				yee_do('{"id":2,"method":"set_rgb","params":['+ye_rgb(0,0,255)+', "smooth", 500]}')
			}else if(chosen === "🍆"){
				yee_do('{"id":1,"method":"set_power","params":["on", "smooth", 500]}')
				yee_do('{"id":2,"method":"set_rgb","params":['+ye_rgb(90, 0, 157)+', "smooth", 500]}')
			}else{
				
			}
			
			console.log(chosen)
			yee_do_menu(msg)
			menu.delete()
			collector.stop();

		});
		
	})
}
//🔄
//📕red
//📗green
//📘blue
//🍆purple

/*

EventEmitter.prototype.madOn = function(eventName, listener, {timeout = void 0, times = void 0}) {
    this.on(eventName, listener);
   
    if(Number.isInteger(timeout) === true) {
        setTimeout(() => {
            this.removeListener(eventName, listener);
        }, timeout);
    }
 
    let counter = 0;
 
    if(Number.isInteger(times) === true) {
        const counterFunc = () => {
            ++counter;
 
            if(counter === times)
                this.removeListener(eventName, listener);
        };
 
        this.on(eventName, counterFunc);
    }
}

*/


add_cmd("menu",function(line,msg)
{
		yee_do_menu(msg)
},["251763595262558208"])


function discord_lua(luacode,msg,overwrite) {
	var ans_chan = msg.channel.id
	if(overwrite)ans_chan=overwrite;

	if(luacode!="discord.status()")
	{
		var logline = "["+Date()+"] "+msg.author.id+" "+msg.author.username+" -> "+luacode;
		fs.appendFileSync('lua_run.log', logline+"\n");
	}

	fs.writeFile(config.discord.lua_data, luacode, (error) => {})
	//  msg.author.username.replace(/;|'|\|/g,"")
	exec("~/con.sh 'discord-lua-run [\""+msg.author.id+"\",\""+ans_chan+"\"]'", function(error, stdout, stderr){
		if (error)
		{
			msg.reply(String(error))
		}
	})
}


function discord_chat(msg) {
	
	var send =
	{
		author: msg.author.username,
		content: msg.content,
		hexcolor: msg.member.displayHexColor,
		attachments: false,
	}
	

	var reg = (/<:(.*):(\d+)>/g).exec(msg.content)
	if(reg && reg[1])
	{
		send.content=send.content.replace(/<(:.*:\d+)>/g,"https://cdn.discordapp.com/emojis/"+reg[2]+".png")
	}

	if (msg.attachments.first() && msg.attachments.first().url)
	{
		send.attachments = msg.attachments.first().url
	}
	
	fs.writeFile(config.discord.chat_data,JSON.stringify(send), (error) => {})
	
	exec("~/con.sh 'lua_run discord.get_relay()'")
}


client.on('message', msg => {
	
	if (msg.author.id == "378116447605620736")return //webhook
	if (msg.author.id == "377890604199313408")return //pornersin
	
	var reg = (/^!(\S*)\s?([^]*)/gm).exec(msg.content)
	if(reg && reg[1])
	{
		var cmd = reg[1]
		var line = reg[2]
		call_cmd(cmd,line,msg)
	}
	else if (msg.channel.id == "432467670915612672")
	{

		discord_chat(msg)
		return 
	}
	
});

var actions = 
{
	setgame: function(tab)
	{
		if(tab.count)client.user.setGame("Online: "+tab.count)
	}
}

fs.watch(config.discord.filewatch, (eventType, filename) => {
	if(eventType == "change")
	{
		fs.readFile(config.discord.filewatch, (err, data) => {
			try {
				var tab = JSON.parse(data);
				if (actions[tab.action]) actions[tab.action](tab) 
			} catch (e) {
				console.log(e);
			}	
		});	
	}
});
