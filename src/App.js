import {BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Channel from './components/Channel/Channel';
import Lobby from './components/Lobby/Lobby';
import './App.css';


function App() {

  return (
    <Router>
      <Routes>
        <Route path='*' element={<Lobby />} />
        <Route exact path='/lobby' element={<Lobby />} />
        <Route exact path='/channel/:channelId' element={<Channel />} />
      </Routes>
    </Router>
  );
}

export default App;
