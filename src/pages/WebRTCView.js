import React from 'react';
import { Container, Row, Button } from 'reactstrap';
import { socket } from '../utils/sockets';

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.localVideo = React.createRef();
    this.remoteVideo = React.createRef();
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
      <Container>
        <Row>
          <Button color='success' onPress={this.call}>Call</Button>
          <Button color='danger' onPress={this.hangup}>Hangup</Button>
        </Row>

        <Row>
          <video ref={this.localVideo} width='300' autoPlay muted />
          <video ref={this.remoteVideo} width='300' autoPlay />
        </Row>
      </Container >
    );
  }

  initialize = async () => {
    socket.on('webrtc', (data) => this.receiveData(JSON.parse(data)));

    const mediaConstraints = {
      'audio': true,
      'video': true
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
      this.remoteVideo.current.srcObject = event.stream;
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(this.pc ? this.pc.iceConnectionState : '...');
    };
  };

  uninitialize = async () => {
    socket.off('webrtc');
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
