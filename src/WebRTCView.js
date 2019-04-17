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
		socket.on('x', (data) => this.receiveData(JSON.parse(data)));

		this.start();
	}

	componentWillUnmount() {
		socket.off('x');
	}

	render() {
		return (
			<Fragment>
				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 10 }}>
					<Button title={'Call'} onPress={this.call} />
					<View style={{ width: 10 }} />
					<Button title={'Hangup'} onPress={this.hangup} />
				</View>

				<View style={{ justifyContent: 'center', alignItems: 'center' }}>
					<video ref={this.localVideo} width='300' autoPlay muted />

					<video ref={this.remoteVideo} width='300' autoPlay />
				</View>
			</Fragment>
		);
	}

	start = () => {
		const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

		this.pc = new RTCPeerConnection(configuration);

		this.pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.sendData({ candidate: event.candidate });
			}
		};

		this.pc.onaddstream = (event) => {
			this.remoteVideo.current.srcObject = event.stream;
		};

		//this.pc.oniceconnectionstatechange = (event) => console.log(this.pc.iceConnectionState);

		navigator.mediaDevices.getUserMedia({ 'audio': true, 'video': true }).then((stream) => {
			this.localVideo.current.srcObject = stream;

			this.pc.addStream(stream);
		});
	};

	call = async () => {
		const offer = await this.pc.createOffer();

		await this.pc.setLocalDescription(offer);

		this.sendData({ sdp: this.pc.localDescription });
	};

	hangup = async () => {
		this.pc.close();
		this.pc = null;

		this.start();
	};

	sendData = async (data) => {
		socket.emit('x', JSON.stringify(data));
	};

	receiveData = async (data) => {
		if (data.candidate !== undefined) {
			this.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
		}
		else if (data.sdp.type === 'offer') {
			this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

			const answer = await this.pc.createAnswer();

			await this.pc.setLocalDescription(answer);

			this.sendData({ sdp: this.pc.localDescription });
		}
		else if (data.sdp.type === 'answer') {
			this.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
		}
	};
}
