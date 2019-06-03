import React from 'react';
import { socket } from '../utils/sockets';

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.localVideo = React.createRef();
    this.pc = null;
  }

  componentDidMount() {
    this.initialize();
  }

  componentWillUnmount() {
    this.uninitialize();
  }

  render() {
    return (
      <video ref={this.localVideo} width='320' height='240' autoPlay muted />
    );
  }

  initialize = async () => {
    socket.on('webrtc', (data) => this.receiveData(JSON.parse(data)));

    const mediaConstraints = {
      'audio': false,
      'video': {
        'width': 640,
        'height': 480
      }
    };

    const pcConfiguration = {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' }
      ]
    };

    const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

    this.localVideo.current.srcObject = stream;

    this.pc = new RTCPeerConnection(pcConfiguration);

    this.pc.addStream(stream);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendData(event.candidate);
      }
    };

    this.pc.onaddstream = (event) => {
      console.log(event.stream);
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(this.pc ? this.pc.iceConnectionState : '...');
    };
  };

  uninitialize = async () => {
    socket.off('webrtc');
  };

  sendData = async (data) => {
    socket.emit('webrtc', JSON.stringify(data));
  };

  receiveData = async (data) => {
    if (data['type'] === undefined) {
      await this.pc.addIceCandidate(data);
    }
    else if (data['type'] === 'offer') {
      await this.pc.setRemoteDescription(data);

      const answer = await this.pc.createAnswer();

      await this.pc.setLocalDescription(answer);

      this.sendData(answer);
    }
    else if (data['type'] === 'answer') {
      await this.pc.setRemoteDescription(data);
    }
  };
}
