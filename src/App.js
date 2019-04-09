import React, { Component } from 'react';
import { View } from 'react-native';

import WebRTCView from './components/WebRTCView'

//import './main.css';

export default class extends Component {
	render() {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<WebRTCView />
			</View>
		);
	}
}
