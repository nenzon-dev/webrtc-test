import React from 'react';
import { Container, Row, Button } from 'reactstrap';
import { socket } from '../utils/sockets';

const faceapi = window.faceapi;

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.localVideo = React.createRef();
    this.remoteVideo = React.createRef();
    this.pc = null;

    this.canvas = React.createRef();
  }

  async componentDidMount() {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models')
    ]);

    await this.initialize();
  }

  componentWillUnmount() {
    this.uninitialize();
  }

  render() {
    return (
      <Container>
        <Row>
          <Button color='success' onClick={this.call}>Start</Button>
        </Row>

        <Row>
          <canvas ref={this.canvas} width='640' height='480' />
        </Row>

        <video ref={this.localVideo} width='0' height='0' autoPlay muted />
        <video ref={this.remoteVideo} width='0' height='0' autoPlay />

      </Container >
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

    this.pc = new RTCPeerConnection(pcConfiguration);

    this.localVideo.current.srcObject = stream;

    this.pc.addStream(stream);

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendData(event.candidate);
      }
    };

    this.pc.onaddstream = (event) => {
      this.remoteVideo.current.srcObject = event.stream;

      this.remoteVideo.current.addEventListener('play', this.detectFace());
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

  sendData = async (data) => {
    socket.emit('webrtc', JSON.stringify(data));
  };

  receiveData = async (data) => {
    if (data['type'] === undefined) {
      this.pc.addIceCandidate(data);
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

  detectFace = async () => {
    const _canvas = this.canvas.current;
    const _video = this.remoteVideo.current;
    const _ctx = _canvas.getContext('2d');

    const frame = async () => {
      const detections = await faceapi.detectAllFaces(_video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();

      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      _ctx.drawImage(_video, 0, 0, _canvas.width, _canvas.height);

      faceapi.draw.drawDetections(_canvas, detections);
      faceapi.draw.drawFaceLandmarks(_canvas, detections);
      faceapi.draw.drawFaceExpressions(_canvas, detections);
    };

    setInterval(frame, 100);
  };
}
