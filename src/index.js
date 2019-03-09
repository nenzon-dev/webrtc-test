import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';

import WebRTCView from './components/WebRTCView'

import './main.css';

class App extends Component {
	render() {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<WebRTCView />
			</View>
		);
	}
}

AppRegistry.registerComponent('app', () => App);
AppRegistry.runApplication('app', { rootTag: document.getElementById('root') });
