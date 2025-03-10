import React, { createContext, useState, useEffect, useContext } from 'react';
import { ethers } from 'ethers';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

const SOCKET_URL = 'http://localhost:3001'; 

const abi = [
  "function getFollowers(address userAddress) public view returns (address[] memory)",
  "function getFollowing(address userAddress) public view returns (address[] memory)",
  "function getUserName(address addr) public view returns (string memory userName)"
];

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        // Set current user
        setCurrentUser({
          address,
          username: await getUserName(address)
        });

        // Connect to socket server
        const newSocket = io(SOCKET_URL, {
          query: { userId: address }
        });

        setSocket(newSocket);

        // Socket event listeners
        newSocket.on('connect', () => {
          console.log('Connected to chat server');
          fetchFriends(address);
        });

        newSocket.on('message', (message) => {
          handleNewMessage(message);
        });

        newSocket.on('onlineUsers', (users) => {
          setOnlineFriends(users);
        });

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initSocket();
  }, []);

  const getUserName = async (address) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      return await contract.getUserName(address);
    } catch (error) {
      console.error('Error getting username:', error);
      return 'Unknown User';
    }
  };

  const fetchFriends = async (userAddress) => {
    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      
      // Get followers and following
      const followers = await contract.getFollowers(userAddress);
      const following = await contract.getFollowing(userAddress);
      
      // Find mutual connections (friends)
      const mutualConnections = followers.filter(follower => 
        following.some(followed => followed.toLowerCase() === follower.toLowerCase())
      );
      const uniqueAddresses = new Set();
      const friendsWithDetails = [];
      
      // Get usernames for each friend
      for (const address of mutualConnections) {
        // Convert to lowercase for case-insensitive comparison
        const lowerCaseAddress = address.toLowerCase();
        
        // Skip if we've already processed this address
        if (uniqueAddresses.has(lowerCaseAddress)) {
          continue;
        }
        
        // Add to our set of processed addresses
        uniqueAddresses.add(lowerCaseAddress);
        
        // Get username and add to friends list
        const username = await contract.getUserName(address);
        friendsWithDetails.push({ address, username });
      }
      
      setFriends(friendsWithDetails);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    // Update messages state
    setMessages(prev => {
      const chatId = getChatId(message.from, message.to);
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: [...chatMessages, message]
      };
    });

    // Update unread messages if not in active chat
    if (activeChat?.address !== message.from) {
      setUnreadMessages(prev => {
        const count = prev[message.from] || 0;
        return {
          ...prev,
          [message.from]: count + 1
        };
      });
    }
  };

  const sendMessage = (to, content) => {
    if (!socket || !content.trim()) return;
    
    const message = {
      from: currentUser.address,
      to,
      content,
      timestamp: new Date().toISOString()
    };
    
    socket.emit('message', message);
    
    // Add to local messages
    setMessages(prev => {
      const chatId = getChatId(currentUser.address, to);
      const chatMessages = prev[chatId] || [];
      return {
        ...prev,
        [chatId]: [...chatMessages, message]
      };
    });
  };

  const getChatId = (addr1, addr2) => {
    return [addr1, addr2].sort().join('-');
  };

  const openChat = (friend) => {
    setActiveChat(friend);
    
    // Clear unread messages for this friend
    setUnreadMessages(prev => ({
      ...prev,
      [friend.address]: 0
    }));
    
    // Load chat history from server or local storage
    const chatId = getChatId(currentUser?.address, friend.address);
    if (!messages[chatId]) {
      // If no messages loaded yet, you could fetch from server/blockchain
      socket.emit('getChatHistory', { 
        user1: currentUser.address, 
        user2: friend.address 
      });
    }
    
    navigate('/chat');
  };

  const closeChat = () => {
    setActiveChat(null);
    navigate(-1);
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  };

  const value = {
    friends,
    activeChat,
    messages,
    unreadMessages,
    onlineFriends,
    currentUser,
    isLoading,
    openChat,
    closeChat,
    sendMessage,
    getTotalUnreadCount,
    fetchFriends
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);