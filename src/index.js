import React from 'react';
import ReactDOM from 'react-dom';
//import { BrowserRouter, Switch, Route } from 'react-router-dom';

//import Home from './pages/Home';
//import P1 from './pages/P1';
//import P2 from './pages/P2';
//import WebRTCView from './pages/WebRTCView';
import WebRTCView2 from './pages/WebRTCView2';

import 'bootstrap/dist/css/bootstrap.min.css';

/*const App = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route path='/' exact component={Home} />
        <Route path='/p1' component={P1} />
        <Route path='/p2' component={P2} />
        <Route path='/webrtc' component={WebRTCView} />
      </Switch>
    </BrowserRouter>
  );
};*/

const App = () => {
  return <WebRTCView2 />
}

ReactDOM.render(<App />, document.getElementById('root'));
