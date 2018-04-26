var http = require('http');
const net = require('net');

var port = 3333;
var host = '195.2.252.214';

var timerId1;
var timerId2;
var planted=false


function ye_rgb(r,g,b)
{
	return (r*65536)+(g*256)+b
}
 
http.createServer(function (req, res) {

	if (req.method == 'POST') {
        console.log("Handling POST request...");
        res.writeHead(200, {'Content-Type': 'text/html'});
 
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            //console.log("POST payload: " + body);
			var j = JSON.parse(body)
			console.log(j.round)
			console.log(j.player.team)
			if(j.round.bomb=="planted")
			{
				if(!planted)
				{
					const client = net.createConnection({host: "card_home", port: 55443}, () => {
						client.write('{"id":1,"method":"set_power","params":["on", "smooth", 500]}\r\n');
						client.write('{"id":2,"method":"set_rgb","params":['+ye_rgb(255,255,255)+', "smooth", 500]}\r\n')
						client.write('{"id":3,"method":"set_bright","params":[100, "smooth", 500]}\r\n')
						client.end();
					});
				}
				planted = true
				timerId1 = setTimeout(()=>
				{
					const client = net.createConnection({host: "card_home", port: 55443}, () => {
						client.write('{"id":1,"method":"set_power","params":["on", "smooth", 500]}\r\n');
						client.write('{"id":2,"method":"set_rgb","params":['+ye_rgb(0,255,255)+', "smooth", 500]}\r\n')
						client.write('{"id":3,"method":"set_bright","params":[100, "smooth", 500]}\r\n')
						client.end();
					});
					timerId2 = setTimeout(()=>
					{
						const client = net.createConnection({host: "card_home", port: 55443}, () => {
							client.write('{"id":1,"method":"set_power","params":["on", "smooth", 500]}\r\n');
							client.write('{"id":2,"method":"set_rgb","params":['+ye_rgb(255,0,255)+', "smooth", 500]}\r\n')
							client.write('{"id":3,"method":"set_bright","params":[100, "smooth", 500]}\r\n')
							client.end();
						});
					}, 4500)
				}, 29500)
				
			}else if (j.player.team==j.round.win_team)
			{
				const client = net.createConnection({host: "card_home", port: 55443}, () => {
					client.write('{"id":1,"method":"set_power","params":["on", "smooth", 500]}\r\n');
					client.write('{"id":2,"method":"set_rgb","params":['+ye_rgb(0,255,0)+', "smooth", 500]}\r\n')
					client.write('{"id":3,"method":"set_bright","params":[100, "smooth", 500]}\r\n')
					client.end();
				});
				planted = false
				clearTimeout(timerId1);
				clearTimeout(timerId2);

			}else if (j.round.win_team)
			{
				const client = net.createConnection({host: "card_home", port: 55443}, () => {
					client.write('{"id":1,"method":"set_power","params":["on", "smooth", 500]}\r\n');
					client.write('{"id":2,"method":"set_rgb","params":['+ye_rgb(255,0,0)+', "smooth", 500]}\r\n')
					client.write('{"id":3,"method":"set_bright","params":[100, "smooth", 500]}\r\n')
					client.end();
				});
				planted = false
				clearTimeout(timerId1);
				clearTimeout(timerId2);
			}
        	res.end( '' );
        });
    }
 
	
}).listen(3333)