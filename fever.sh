#!/bin/bash

case $1 in
	start)
		forever start ~/node-js-projects/discord.js
		forever start ~/node-js-projects/gitwebhook.js
		;;
	restart)
		forever restart ~/node-js-projects/discord.js
		forever restart ~/node-js-projects/gitwebhook.js
		;;
esac 