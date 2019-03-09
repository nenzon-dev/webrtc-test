import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import SignalingChannel from './SignalingChannel';

export default class WebRTCView extends Component {
	constructor(props) {
		super(props);

		this.state = {
			iceConnectionState: '',
		};

		this.localVideo = React.createRef();
		this.remoteVideo = React.createRef();

		this.pc = null;
	}

	componentDidMount() {
		SignalingChannel.init();
		SignalingChannel.receive(this.receiveSignalData.bind(this));

		this.start();
	}

	render() {
		return (
			<View>
				<View style={{ justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
					<Text style={{ fontSize: 20, fontWeight: 'bold' }}>WebRTC</Text>
					<Text>{'state: ' + this.state.iceConnectionState}</Text>
				</View>

				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
					<video ref={this.localVideo} width='500' autoPlay muted />

					<video ref={this.remoteVideo} width='500' autoPlay />
				</View>

				<View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
					<TouchableOpacity
						style={{ backgroundColor: 'lightgray', margin: 20, padding: 10, borderRadius: 10 }}
						onPress={this.call.bind(this)}
					>
						<Text style={{ color: 'white' }}>{'Call'}</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={{ backgroundColor: 'lightgray', margin: 20, padding: 10, borderRadius: 10 }}
						onPress={this.hangup.bind(this)}
					>
						<Text style={{ color: 'white' }}>{'hangup'}</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	start() {
		const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

		this.pc = new RTCPeerConnection(configuration);

		this.setState({
			iceConnectionState: this.pc.iceConnectionState
		});

		this.pc.onicecandidate = (event) => {
			if (event.candidate) {
				SignalingChannel.send({ candidate: event.candidate });
			}
		};

		this.pc.onaddstream = (event) => {
			this.remoteVideo.current.srcObject = event.stream;
		};

		this.pc.oniceconnectionstatechange = (event) => {
			this.setState({
				iceConnectionState: this.pc.iceConnectionState
			});
		};

		navigator.mediaDevices.getUserMedia({ 'audio': true, 'video': true }).then((stream) => {
			this.localVideo.current.srcObject = stream;

			this.pc.addStream(stream);
		});
	}

	async call() {
		const offer = await this.pc.createOffer();

		await this.pc.setLocalDescription(offer);

		SignalingChannel.send({ sdp: this.pc.localDescription });
	}

	async hangup() {
		this.pc.close();
		//this.pc = null;
	}

	async receiveSignalData(data) {
		const msg = JSON.parse(data);

		if (msg.candidate !== undefined) {
			this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
		}
		else if (msg.sdp.type === 'offer') {
			this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));

			const answer = await this.pc.createAnswer();

			await this.pc.setLocalDescription(answer);

			SignalingChannel.send({ sdp: this.pc.localDescription });
		}
		else if (msg.sdp.type === 'answer') {
			this.pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
		}
	}
}
