import { AppRegistry } from 'react-native';

import App from './App';

AppRegistry.registerComponent('app', () => App);
AppRegistry.runApplication('app', { rootTag: document.getElementById('root') });
