
const Discord = require("discord.js");
const client = new Discord.Client();

//var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');

var config = require('./config')
var SteamID = require('steamid');


client.login(config.discord.token);
//client.login("MzkwNTE3Mjk2MTkzMzM5Mzky.DRLRMw.CdKKLbdU2tbVGTmRUNV7LmizLf0");

//https://discordapp.com/api/oauth2/authorize?client_id=377890604199313408&scope=bot&permissions=0

client.on('ready', () => {
	console.log(`Logged in as ${client.user.username}!`);
});

//["251763595262558208"]: "Card",

var cmds = {}
var _role = 
{
	Devs: ["dev"],
	Coders: ["dev","Coders"],
	Stars: ["dev","Coders","★"],
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
			let role = msg.guild.roles.find("name", "★");
			msg.member.addRole(role)
			msg.reply("successfully linked own account to steamid "+auth_member_ids[author__id])
		}
	})

	
})
/*
add_cmd("test",function(line,msg)
{
	msg.delete()
	.then(msg => 
	{
		msg.reply("```lua\n"+line+"\n```")
	})
},_role.Devs)
*/
add_cmd("stars",function(line,msg)
{
	var fields = []
	
	for (key in auth_member_ids)
	{
		
		if ( regex_token.test(key) )continue
		var sid = new SteamID(auth_member_ids[key]);
		fields.push(
		{
			name: msg.guild.members.find('id',key).user.username+" <"+key+">",
			value: "["+auth_member_ids[key]+"](http://steamcommunity.com/profiles/"+sid+")",
		})
	}
	msg.channel.send({embed: {fields:fields,}})
},_role.Stars)

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
},_role.Devs)

add_cmd("l",function(line,msg)
{	
	msg.reply("```lua\n"+line+"\n```").then(function()
	{
		discord_lua(line,msg)
	})
},_role.Devs)

add_cmd("say",function(line,msg)
{
	line = "Say[["+line+"]]"
	discord_lua(line,msg)
},_role.Devs)

add_cmd("print",function(line,msg)
{
	line = "print("+line+")"
	discord_lua(line,msg)
},_role.Devs)

cmds.p = cmds.print
 
add_cmd("table",function(line,msg)
{
	line = "PrintTable("+line+")"
	discord_lua(line,msg)
},_role.Devs)

add_cmd("raw",function(line,msg)
{
	line = "print(GetFunctionRaw("+line+"))"
	discord_lua(line,msg)
},_role.Devs)

add_cmd("fever",function(line,msg)
{
	if (line=="logs")
	{
		exec("~/node-js-projects/fever "+line, function(error, stdout, stderr){
			msg.reply(String(stdout).replace(/\W\[\d\dm/g,"").replace(/\/home\/card\/node-js-projects/g,""))
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
	msg.channel.send({embed: {
		color: 254174,
		title: "List of commands:",

		description: ":::::::::::::::::::::::::::::::::::::::::::::",
		fields:
		[
			{
			name: "!l",
			value: "RunString()"
			},
			{
				name: "!print",
				value: "print()"
			},
			{
				name: "!table",
				value: "PrintTable()"
			},
			{
				name: "!say",
				value: "Say()"
			},
			{
				name: "!raw",
				value: "print path and function source"
			},
			{
				name: "!restart",
				value: "hard restart server (may take over 60 sec)"
			},
			{
				name: "!clear",
				value: "clear all history of this channel (DANGEROUS)"
			},
			{
				name: "!connect",
				value: "print link to connect"
			},
			{
				name: "!help",
				value: "print this message"
			}
		],
	}});
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


function discord_lua(luacode,msg) {
	fs.writeFile(config.discord.lua_data, luacode, (error) => {})
	//  msg.author.username.replace(/;|'|\|/g,"")
	exec("~/con.sh 'discord-lua-run "+msg.author.id+"'", function(error, stdout, stderr){
		if (error)
		{
			msg.reply(String(error))
		}
	})
}


client.on('message', msg => {
	
	var reg = (/^!(\S*)\s?(.*)/g).exec(msg.content)
	if(reg && reg[1])
	{
		var cmd = reg[1]
		var line = reg[2]
		call_cmd(cmd,line,msg)
	}
	
});
