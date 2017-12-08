
const Discord = require("discord.js");
const client = new Discord.Client();

//var sys = require('sys')
var exec = require('child_process').exec;
var fs = require('fs');

var config = require('./config')
var SteamID = require('steamid');

var ytsearch = require('youtube-search');
var opts = {
	maxResults: 3,
	key: config.youtube.key,
	type: "video",
};

const ytdl = require('ytdl-core');
const streamOptions = { seek: 0, volume: 0.3 };



client.login(config.discord.token);

//https://discordapp.com/api/oauth2/authorize?client_id=377890604199313408&scope=bot&permissions=0

client.on('ready', () => {
	console.log(`Logged in as ${client.user.username}!`);
});

var allow_all_cmds = 
{
	["251763595262558208"]: "Card",
//	["315576074924982274"]: "Zpudi",
}	

var cmds = {}

function add_cmd(cmd,func,role){cmds[cmd] = {func: func, role: role}}
function call_cmd(cmd,line,msg)
{
	if(cmds[cmd])
	{
		//console.log(cmds[cmd])
		var ValidRole = msg.channel.guild.roles.find("name",cmds[cmd].role)
		console.log(allow_all_cmds[msg.author.id])
		if( ( cmds[cmd].role=="all" ) || ( ValidRole && ValidRole.members.get(msg.author.id) ) || allow_all_cmds[msg.author.id] )
		{
			console.log("vse ok run")
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
//////////////////////////////////////////////////////////

var dispatcher = false

var playlist = []

function YTplayStream(connection)
{
	if (playlist.length > 0)
	{
		console.log(playlist[0].title)
		dispatcher = connection.playStream(ytdl(playlist[0].link, { filter : 'audioonly' }), streamOptions);
	}
}

add_cmd("add",function(line,msg)
{
	if (msg.member.voiceChannel)
	{
		msg.member.voiceChannel.join()
		.then(connection => {
			
			ytsearch(line, opts, function(err, results) {
				if(err) return console.log(err);
				
				playlist.push({
					author: msg.author.username,
					title: results[0].title,
					link: results[0].link,
				})
				
				msg.channel.send("Добавлено: **"+results[0].title+"** ("+msg.author.username+")")
				
				if (playlist.length > 0)
				{
				
					console.log("now "+connection.speaking)
					
					if (!dispatcher)YTplayStream(connection)
					
					dispatcher.connection2 = connection
			
					if (!dispatcher.init_events)
					{
						dispatcher.on('speaking',function(isplaying)
						{
							console.log("speaking "+isplaying)
							if (isplaying)
							{
								msg.channel.send("Сейчас играет: **"+playlist[0].title+"** ("+playlist[0].username+")")
							}
							else
							{	
								playlist.shift()
								setTimeout(function()
								{
									YTplayStream(connection)
								},2000)
							}
						
						})

						dispatcher.init_events = true
					}
				
				}
				
			});

			
		})
		
	}
},'dev')

add_cmd("skip",function(line,msg)
{
	if (!dispatcher) return
	dispatcher.end("skip")
	
},'dev')

add_cmd("leave",function(line,msg)
{
	dispatcher.connection2.disconnect()
	dispatcher = false 
	playlist = []
	
},'dev')

add_cmd("list",function(line,msg)
{
	console.log(playlist)
	playlist.forEach(function(item, i) {
		msg.reply( i + ": " + item.title);
	});
},'all')

add_cmd("volume",function(line,msg)
{
	if (!dispatcher) return
	dispatcher.setVolume(Number(line))
},'all')

//////////////////////////////////////////////////////////

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

	
},'all')

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
