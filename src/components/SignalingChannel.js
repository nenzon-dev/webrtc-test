import io from 'socket.io-client';

let socket = null;

export default {
	init: () => {
		//socket = io('http://35.229.222.96:3000');
		socket = io('https://vvk954yznl.sse.codesandbox.io/');
		socket.on('connect', () => console.log('connect'));
	},

	send: (data) => {
		socket.emit('x', JSON.stringify(data));
	},

	receive: (callback) => {
		socket.on('x', (data) => callback(data));
	}
};
