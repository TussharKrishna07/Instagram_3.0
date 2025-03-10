import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import FriendsPage from './components/FriendsPage';
import ChatPage from './components/ChatPage';
import { ChatProvider } from './context/chatContext';

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/SignUpPage" element={<SignUpPage />} />
          <Route path="/HomePage" element={<HomePage />} />
          <Route path="/ProfilePage/:userAddress" element={<ProfilePage />} />
          <Route path="/ProfilePage" element={<ProfilePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;

