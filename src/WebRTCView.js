import React, { Component, Fragment } from 'react';
import { View, Button } from 'react-native';
import io from 'socket.io-client';

const socket = io('https://vvk954yznl.sse.codesandbox.io/');

export default class extends Component {
	constructor(props) {
		super(props);

		this.localVideo = React.createRef();
		this.remoteVideo = React.createRef();

		this.pc = null;
	}

	componentDidMount() {
		socket.on('webrtc', (data) => this.receiveData(JSON.parse(data)));

		this.initialize();
	}

	componentWillUnmount() {
		socket.off('x');
	}

	render() {
		return (
			<Fragment>
				<View style={{ flexDirection: 'row' }}>
					<Button title={'Call'} onPress={this.call} />
					<View style={{ width: 10 }} />
					<Button title={'Hangup'} onPress={this.hangup} />
				</View>

				<View>
					<video ref={this.localVideo} width='300' autoPlay muted />
					<video ref={this.remoteVideo} width='300' autoPlay />
				</View>
			</Fragment>
		);
	}

	initialize = async () => {
		const mediaConstraints = {
			'audio': true,
			'video': true
		};

		const configuration = {
			'iceServers': [
				{ 'urls': 'stun:stun.l.google.com:19302' }
			]
		};

		const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

		this.localVideo.current.srcObject = stream;

		this.pc = new RTCPeerConnection(configuration);

		this.pc.addStream(stream);

		this.pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.sendData(event.candidate);
			}
		};

		this.pc.onaddstream = (event) => {
			this.remoteVideo.current.srcObject = event.stream;
		};

		this.pc.oniceconnectionstatechange = (event) => {
			console.log(this.pc ? this.pc.iceConnectionState : '...');
		};
	};

	call = async () => {
		const offer = await this.pc.createOffer();

		await this.pc.setLocalDescription(offer);

		this.sendData(offer);
	};

	hangup = async () => {
		this.pc.close();
		this.pc = null;

		this.initialize();
	};

	sendData = async (data) => {
		socket.emit('webrtc', JSON.stringify(data));
	};

	receiveData = async (data) => {
		console.log(data);

		if (data.type === undefined) {
			this.pc.addIceCandidate(data);
		}
		else if (data.type === 'offer') {
			this.pc.setRemoteDescription(data);

			const answer = await this.pc.createAnswer();

			await this.pc.setLocalDescription(answer);

			this.sendData(answer);
		}
		else if (data.type === 'answer') {
			this.pc.setRemoteDescription(data);
		}
	};
}
