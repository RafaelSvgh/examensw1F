import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Room from './pages/Room';
import Principal from './pages/Principal';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Principal />} />
        <Route path="/room/:roomCode" element={<Room />} />
      </Routes>
    </Router>
  );
}

export default App;
