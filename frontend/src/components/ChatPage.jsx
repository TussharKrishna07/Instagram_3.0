import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faPaperPlane, 
  faSmile,
  faCircle,
  faImage,
  faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import TextareaAutosize from 'react-textarea-autosize';
import EmojiPicker from 'emoji-picker-react';
import { useChat } from '../context/chatContext';

function ChatPage() {
  const { 
    activeChat, 
    messages, 
    sendMessage, 
    closeChat, 
    currentUser, 
    onlineFriends 
  } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Redirect if no active chat
  useEffect(() => {
    if (!activeChat) {
      navigate('/friends');
    }
  }, [activeChat, navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && activeChat) {
      sendMessage(activeChat.address, newMessage);
      setNewMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const isOnline = (address) => {
    return onlineFriends.includes(address);
  };

  const getChatMessages = () => {
    if (!activeChat || !currentUser) return [];
    
    const chatId = [currentUser.address, activeChat.address].sort().join('-');
    return messages[chatId] || [];
  };

  // Group messages by sender and date
  const getGroupedMessages = () => {
    const chatMessages = getChatMessages();
    if (chatMessages.length === 0) return [];
    
    const grouped = [];
    let currentGroup = null;
    let currentDate = null;
    
    chatMessages.forEach((msg, index) => {
      // Check if we need a date separator
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        grouped.push({
          type: 'date',
          date: msg.timestamp
        });
      }
      
      // Check if we need to start a new message group
      if (!currentGroup || 
          currentGroup.sender !== msg.from || 
          // If more than 5 minutes between messages, start a new group
          (index > 0 && new Date(msg.timestamp) - new Date(chatMessages[index-1].timestamp) > 5 * 60 * 1000)) {
        
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        
        currentGroup = {
          type: 'messages',
          sender: msg.from,
          messages: [msg],
          isCurrentUser: msg.from === currentUser.address
        };
      } else {
        // Add to current group
        currentGroup.messages.push(msg);
      }
    });
    
    // Add the last group
    if (currentGroup) {
      grouped.push(currentGroup);
    }
    
    return grouped;
  };

  if (!activeChat) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button 
                onClick={closeChat} 
                className="mr-3 text-gray-500"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <div className="flex items-center">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                    {activeChat.username.charAt(0).toUpperCase()}
                  </div>
                  {isOnline(activeChat.address) && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400"></span>
                  )}
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-medium text-gray-900">{activeChat.username}</h2>
                  <p className="text-xs text-gray-500">
                    {isOnline(activeChat.address) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
            <button className="text-gray-500">
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 pt-16 pb-20 overflow-y-auto bg-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 space-y-4">
            {getGroupedMessages().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No messages yet. Say hello!</p>
              </div>
            ) : (
              getGroupedMessages().map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {group.type === 'date' && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-200 rounded-full px-4 py-1">
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDate(group.date)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {group.type === 'messages' && (
                    <div 
                      className={`flex ${group.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!group.isCurrentUser && (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex-shrink-0 flex items-center justify-center text-white font-bold self-end mb-1">
                          {activeChat.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className={`max-w-xs sm:max-w-md mx-2`}>
                        {group.messages.map((msg, msgIndex) => (
                          <div 
                            key={msgIndex} 
                            className={`px-4 py-2 ${
                              group.isCurrentUser 
                                ? 'bg-pink-600 text-white' 
                                : 'bg-white text-gray-800'
                            } ${
                              msgIndex === 0 
                                ? group.isCurrentUser 
                                  ? 'rounded-t-lg rounded-bl-lg' 
                                  : 'rounded-t-lg rounded-br-lg'
                                : msgIndex === group.messages.length - 1
                                  ? group.isCurrentUser 
                                    ? 'rounded-b-lg rounded-bl-lg mt-1' 
                                    : 'rounded-b-lg rounded-br-lg mt-1'
                                  : 'mt-1'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            {msgIndex === group.messages.length - 1 && (
                              <p 
                                className={`text-xs mt-1 text-right ${
                                  group.isCurrentUser ? 'text-pink-200' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(msg.timestamp)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSendMessage} className="flex items-end">
            <button 
              type="button" 
              className="p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FontAwesomeIcon icon={faSmile} />
            </button>
            <div className="relative flex-1 mx-2">
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-10">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
              <TextareaAutosize
                className="w-full border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                maxRows={4}
              />
            </div>
            <button 
              type="submit" 
              className={`p-2 rounded-full ${
                newMessage.trim() 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
              disabled={!newMessage.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;