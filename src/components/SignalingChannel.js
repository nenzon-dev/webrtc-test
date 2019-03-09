import io from 'socket.io-client';

const useSocketio = true;
let socket = null;

const SignalingChannelSocketio = {
	init() {
		//socket = io('http://35.229.222.96:3000');
		socket = io('https://vvk954yznl.sse.codesandbox.io/');
		socket.on('connect', () => console.log('connect'));
	},

	send(data) {
		socket.emit('x', JSON.stringify(data));
	},

	receive(callback) {
		socket.on('x', (data) => callback(data));
	}
};

const SignalingChannelFirebase = {
	init() {

	},

	send(data) {

	},

	receive(callback) {

	}
};

const SignalingChannel = {
	init() {
		(useSocketio === true) ? SignalingChannelSocketio.init() : SignalingChannelFirebase.init();
	},

	send(data) {
		(useSocketio === true) ? SignalingChannelSocketio.send(data) : SignalingChannelFirebase.send(data);
	},

	receive(callback) {
		(useSocketio === true) ? SignalingChannelSocketio.receive(callback) : SignalingChannelFirebase.receive(callback);
	}
};

export default SignalingChannel;
