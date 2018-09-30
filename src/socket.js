const sockets = {};

const availChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const genToken = len => [...Array(len)].map(v => availChars[Math.floor(Math.random() * availChars.length)]).join('');

module.exports = function attachSocket(socket) {
	socket.on('disconnect', reason => {
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
		if(!socket.$DriftToken) return;

		if(!payload) return;
		if(!payload.target || !sockets[payload.target]) return;

		const messageType = payload.messageType;
		if(typeof messageType !== 'string' || messageType.length > 32 || messageType.length < 2) return;

		try {
			sockets[payload.target].emit('channelMessage', {
				messageType,
				payload: payload.payload,
				from: socket.$DriftToken
			});
		} catch(e) {}
	});

	socket.on('existsPeer', token => {
		if(!token || typeof token !== 'string') return;

		socket.emit('existsPeer', {exists: !!sockets[token]});
	});
}
