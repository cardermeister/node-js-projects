var Steam = require('steam');
var SteamTotp = require('steam-totp');
var config = require('./config')
var fs = require('fs');
var chats_dir = __dirname+"/steam_chats"
if (!fs.existsSync(chats_dir)){
    fs.mkdirSync(chats_dir);
}

var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);

var logOnOptions =
{
	account_name: config.steam.username,
	password: config.steam.userpasswd,
};

var sharedSecret = config.steam.secretshared;
var authCode = SteamTotp.getAuthCode(sharedSecret);
logOnOptions.two_factor_code = authCode;


steamClient.connect();

steamClient.on('connected', function() {
	steamUser.logOn(logOnOptions)
});

steamClient.on('error', function(a)
{
	console.log("АЙ МЛЯ "+ a)
	setTimeout(function()
	{
		logOnOptions.two_factor_code = SteamTotp.getAuthCode(sharedSecret)
		steamClient.connect()
		
	}, /*10*60*1000*/120000);
});

steamFriends.on("friendMsg",function(a,b,c)
{
	if(c==1)
	{
		var logline = Date()+" -> "+b;
		console.log(logline)
		fs.appendFileSync(chats_dir+"/"+a+'.txt', logline+"\n");
	}
})

steamClient.on('logOnResponse', function(logonResp)
{
	if (logonResp.eresult === Steam.EResult.OK) {
		console.log('Logged in!');
		steamFriends.setPersonaState(Steam.EPersonaState.Online);
		steamUser.gamesPlayed({games_played: [
			{
				game_id: '4000',
				game_ip_address: 3271752918,
				game_port: 27015,
			},
			{
				game_id: '270550',
			},
			{
				game_id: '513780',
			},
			{
				game_id: '265590',
			},
			{
				game_id: '65930',
			},
			{
				game_id: '439190',
			},
			{
				game_id: '234650',
			},
			{
				game_id: '41070',
			},
			{
				game_id: '34270',
			},
			{
				game_id: '268870',
			},
			{
				game_id: '210770',
			},
			{
				game_id: '449630',
			},
			{
				game_id: '334210',
			},
			{
				game_id: '318600',
			}
		]});
	}
});
