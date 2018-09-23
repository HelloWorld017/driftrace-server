const sockets = {};

const availChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const genToken = len => [...Array(len)].map(v => availChars[Math.floor(Math.random() * availChars.length)]).join('');

module.exports = function attachSocket(socket) {
	socket.on('disconnected', reason => {
		if(socket.$DriftToken) delete sockets[socket.$DriftToken];
	});

	socket.on('registerPeer', () => {
		if(!socket.$DriftToken) {
			const desiredLen = Math.ceil(
				Math.log((Object.keys(sockets).length + 1) * 10000) / Math.log(availChars.length)
			);

			socket.$DriftToken = genToken(desiredLen);
		}

		sockets[socket.$DriftToken] = socket;
		socket.emit('registerPeer', socket.$DriftToken);
	});

	socket.on('channelMessage', payload => {
		if(!payload) return;
		if(!payload.target || !sockets[payload.target]) return;

		const messageType = payload.messageType;
		if(typeof messageType !== 'string' || messageType.length > 32 || messageType.length < 2) return;

		console.log(`Channeling ${messageType} to ${payload.target}, Payload: ${JSON.stringify(payload.payload, null, '\t')}`);
		try {
			sockets[payload.target].emit('channelMessage', {
				messageType,
				payload: payload.payload
			});
		} catch(e) {}
	});
}
