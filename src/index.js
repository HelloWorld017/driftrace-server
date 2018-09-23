const attachSocket = require('./socket');
const chalk = require('chalk');
const express = require('express');
const fs = require('fs');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');

const serverRoot = path.resolve(__dirname, '..');
const configPath = path.join(serverRoot, 'server.json');
const defaultConfig = {
	useServing: false,
	port: 80
};

if(!fs.existsSync(configPath)) {
	fs.writeFileSync(configPath, JSON.stringify(defaultConfig));
	console.log(chalk.yellow("Server configuration generated!"));
}

const config = Object.assign({}, defaultConfig, JSON.parse(fs.readFileSync(configPath, 'utf8')));

const app = express();

if(config.useServing) {
	app.use(express.static(path.join(serverRoot, 'public')));
}
app.use(express.json());
app.get('/', (req, res, next) => {
	if(config.useServing) {
		res.sendFile(path.resolve(serverRoot, 'public', 'index.html'));
		return;
	}

	next();
});

app.use((req, res) => {
	res.status(404);
});

const server = http.createServer(app);

const io = socketIo(server, {
	serveClient: false
});
io.on('connection', attachSocket);

server.listen(80);

console.log(chalk.cyan(`Server Listening on ${config.port}`));
