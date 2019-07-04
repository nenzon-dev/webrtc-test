import React from 'react';
import { Container, Row, Button } from 'reactstrap';
import { socket } from '../utils/sockets';

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isCalling: false
    };

    this.localVideo = React.createRef();
    this.remoteVideo = React.createRef();
    this.localStream = null;
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
          {!this.state.isCalling && <Button color='success' onClick={this.call}>Call</Button>}
          {this.state.isCalling && <Button color='danger' onClick={this.hangup}>Hangup</Button>}
        </Row>

        <Row>
          <video ref={this.localVideo} width='300' autoPlay muted />
          <video ref={this.remoteVideo} width='300' autoPlay />
        </Row>
      </Container >
    );
  }

  initialize = async () => {
    socket.on('chatAudio-signaling', (data) => this.receiveData(JSON.parse(data)));

    const mediaConstraints = {
      'audio': true,
      'video': false
    };

    const pcConfiguration = {
      'iceServers': [
        { 'urls': 'stun:stun.l.google.com:19302' }
      ]
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

    this.localVideo.current.srcObject = this.localStream;

    this.pc = new RTCPeerConnection(pcConfiguration);

    this.pc.addStream(this.localStream);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendData('', event.candidate);
      }
    };

    this.pc.onaddstream = (event) => {
      this.remoteVideo.current.srcObject = event.stream;
    };

    this.pc.oniceconnectionstatechange = () => {
      console.log(this.pc ? this.pc.iceConnectionState : '...');

      if (!this.pc) {
        return;
      }

      let state = this.pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        this.setState({ isCalling: true });
      }
    };
  };

  uninitialize = async () => {
    socket.off('chatAudio-signaling');
  };

  call = async () => {
    const offer = await this.pc.createOffer();

    await this.pc.setLocalDescription(offer);

    this.sendData('', offer);

    this.setState({ isCalling: true });
  };

  hangup = async () => {
    this.pc.close();
    this.pc = null;

    this.setState({ isCalling: false });

    this.initialize();
  };

  sendData = async (chatUserId, data) => {
    socket.emit('chatAudio-signaling', {
      chatUserId: chatUserId,
      data: JSON.stringify(data)
    });
  };

  receiveData = async (data) => {
    if (data['type'] === undefined) {
      await this.pc.addIceCandidate(data);
    }
    else if (data['type'] === 'offer') {
      await this.pc.setRemoteDescription(data);

      const answer = await this.pc.createAnswer();

      await this.pc.setLocalDescription(answer);

      this.sendData('', answer);
    }
    else if (data['type'] === 'answer') {
      await this.pc.setRemoteDescription(data);
    }
  };
}
