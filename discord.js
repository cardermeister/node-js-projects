
const Discord = require("discord.js");
const client = new Discord.Client();

var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');

var config = require('./config')

client.login(config.discord.token);

//https://discordapp.com/api/oauth2/authorize?client_id=257786656369672192&scope=bot&permissions=0

client.on('ready', () => {
	console.log(`Logged in as ${client.user.username}!`);
});


var cmds = {}

function add_cmd(cmd,func,role){cmds[cmd] = {func: func, role: role}}
function call_cmd(cmd,line,msg)
{
	if(cmds[cmd])
	{
		//console.log(cmds[cmd])
		var ValidRole = msg.channel.guild.roles.find("name",cmds[cmd].role)
		if( ( cmds[cmd].role=="all" ) || ( ValidRole && ValidRole.members.get(msg.author.id) ) )
		{
			cmds[cmd].func(line,msg)
		}

	}
}

var auth_member_ids = {}

function lua_to_js_members(obj,newobj)
{
	for (key in obj) {
		newobj[obj[key]] = key;
	}
}

fs.readFile(config.discord.discord_auth, function(err, data)
{
	obj = JSON.parse(data)
	lua_to_js_members(obj,auth_member_ids)
})

add_cmd("auth",function(line,msg)
{
	
	var base64Rejex =new RegExp(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/);
	
	if ( auth_member_ids[msg.author.id] )
	{
		msg.reply("already linked to steamid "+auth_member_ids[msg.author.id])
		return
	}
	
	if (!base64Rejex.test(line) || line.length<5)
	{
		msg.reply("this is not valid token!")
		return
	}
	line = "discord.auth_apply('"+line+"','"+msg.author.id+"')"
	discord_lua(line,msg)
	
	fs.readFile(config.discord.discord_auth, function(err, data)
	{
		obj = JSON.parse(data)
		lua_to_js_members(obj,auth_member_ids)
		
		if ( auth_member_ids[msg.author.id] )
		{
			let role = msg.guild.roles.find("name", "★");
			msg.member.addRole(role)
			msg.reply("successfully linked own account to steamid "+auth_member_ids[msg.author.id])
		}
	})

	
},'all')

add_cmd("stars",function(line,msg)
{
	var fields = []
	
	for (key in auth_member_ids)
	{
		fields.push(
		{
			name: msg.guild.members.find('id',key).user.username+" <"+key+">",
			value: "["+auth_member_ids[key]+"](http://steamcommunity.com/profiles/)",
		})
	}
	msg.channel.send({embed: {fields:fields,}})
},'dev')

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
},'dev')

add_cmd("l",function(line,msg)
{
	discord_lua(line,msg)
},'dev')

add_cmd("say",function(line,msg)
{
	line = "Say[["+line+"]]"
	discord_lua(line,msg)
},'dev')

add_cmd("print",function(line,msg)
{
	line = "print("+line+")"
	discord_lua(line,msg)
},'dev')
 
add_cmd("table",function(line,msg)
{
	line = "PrintTable("+line+")"
	discord_lua(line,msg)
},'dev')

add_cmd("raw",function(line,msg)
{
	line = "print(GetFunctionRaw("+line+"))"
	discord_lua(line,msg)
},'dev')

add_cmd("connect",function(line,msg)
{
	msg.channel.send({embed: {
		color: 254174,
		title: "",
		description: "[CONNECT TO WIREBUILD](steam://connect/195.2.252.214:27015)",
	}})
	//msg.reply("steam://connect/195.2.252.214:27015 <- Click to connect")
},'all')


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
},'all')
  
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
},'dev')


function discord_lua(luacode,msg) {
	fs.writeFile(config.discord.lua_data, luacode, (error) => {})
	exec("~/con.sh 'discord-lua-run "+msg.author.username.replace(/;|'|\|/g,"")+"'", function(error, stdout, stderr){
		if (error)
		{
			msg.reply(String(error))
		}
	})
}


client.on('message', msg => {
	
	var reg = (/!(\S*)\s?(.*)/g).exec(msg.content)
	if(reg && reg[1])
	{
		var cmd = reg[1]
		var line = reg[2]
		call_cmd(cmd,line,msg)
	}
	
});
