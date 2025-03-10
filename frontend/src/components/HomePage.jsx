import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useChat } from '../context/chatContext';
import { 
  faUserCircle, 
  faHeart, 
  faThumbsDown, 
  faImage, 
  faPaperPlane, 
  faHome, 
  faCompass, 
  faUser, 
  faSignOutAlt,
  faPlus,
  faExclamationTriangle,
  faComment
} from '@fortawesome/free-solid-svg-icons';
import { faHeart as solidHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as regularHeart } from '@fortawesome/free-regular-svg-icons';
const abi = [
  "function makePost(string memory content, string memory imageURI)",
  "function getPostsCount() public view returns (uint256)",
  "function getPost(uint256 i) public view returns (string memory,string memory, address, address[] memory, address[] memory, uint256)",
  "function getUserName(address addr) public view returns (string memory userName)",
  "function likePost(uint256 index) public",
  "function dislikePost(uint256 index) public",
  "function followUser(address userToFollow) public",
  "function getFollowers(address userAddress) public view returns (address[] memory)",
  "function getFollowing(address userAddress) public view returns (address[] memory)"
];

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [username, setUsername] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [account, setAccount] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pinataConnected, setPinataConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { getTotalUnreadCount } = useChat();
  const [followingList, setFollowingList] = useState([]);


  useEffect(() => {
    const init = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        
        // Get username
        try {
          const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
          const name = await contract.getUserName(address);
          setUsername(name);

          const following = await contract.getFollowing(address);
          setFollowingList(following);
        } catch (error) {
          console.error("Error fetching username:", error);
        }
        
        // Test Pinata connection
        await testPinataConnection();
        
        // Fetch posts
        await fetchPosts();
      } catch (error) {
        console.error("Error initializing:", error);
      }
    };
    
    init();
  }, []);
  const isFollowing = (address) => {
    return followingList.some(addr => addr.toLowerCase() === address.toLowerCase());
  };
  const testPinataConnection = async () => {
    try {
      const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`
        }
      });
      
      if (response.status === 200) {
        console.log('Pinata connection successful!');
        setPinataConnected(true);
        return true;
      }
    } catch (error) {
      console.error('Pinata connection failed:', error);
      setPinataConnected(false);
      return false;
    }
  };

  const fetchPosts = async () => {
    try {
      setIsPostsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
   
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      console.log(import.meta.env.VITE_CONTRACT_ADDRESS);
      const postCount = await contract.getPostsCount();
      console.log(postCount)
      const fetchedPosts = [];
      const currentAddress = await signer.getAddress();

      for (let i = 0; i < postCount; i++) {
        const [content, imageURI, owner, likes, dislikes, time] = await contract.getPost(i);
        const username = await contract.getUserName(owner);
        fetchedPosts.push({ 
          id: i,
          content, 
          imageURI, 
          owner, 
          likes, 
          dislikes, 
          time: new Date(time * 1000), 
          username,
          isLikedByUser: likes.some(addr => addr.toLowerCase() === currentAddress.toLowerCase()),
          isDislikedByUser: dislikes.some(addr => addr.toLowerCase() === currentAddress.toLowerCase())
        });
      }

      // Sort posts by time (newest first)
      fetchedPosts.sort((a, b) => b.time - a.time);
      
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setErrorMessage("Failed to load posts. Please try again later.");
    } finally {
      setIsPostsLoading(false);
    }
  };

  // Function to upload file to Pinata with retry mechanism
  const uploadToPinataWithRetry = async (file, maxRetries = 3) => {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await uploadToPinata(file);
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  };

  // Function to upload file to Pinata
  const uploadToPinata = async (file) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    let data = new FormData();
    data.append('file', file);

    // Optional: Add metadata to pinning
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        app: 'Instagram3.0',
        user: account
      }
    });
    data.append('pinataMetadata', metadata);

    // Add options for Pinata
    const options = JSON.stringify({
      cidVersion: 1
    });
    data.append('pinataOptions', options);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const response = await axios.post(url, data, {
        maxBodyLength: 'Infinity', // Required to prevent Axios from erroring out with large files
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      return response.data.IpfsHash; // CID
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      // Show more specific error messages
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Invalid Pinata credentials. Please check your JWT token.');
        } else {
          throw new Error(`Pinata upload failed: ${error.response.data.error || 'Unknown error'}`);
        }
      } else {
        throw new Error('Network error when uploading to Pinata. Please check your connection.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Function to upload JSON metadata to Pinata
  const uploadMetadataToPinata = async (metadata) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
      const response = await axios.post(url, metadata, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
      });
      return response.data.IpfsHash; // CID
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw new Error('Pinata metadata upload failed');
    }
  };

  // Function to get IPFS gateway URL with fallbacks
  const getPinataGatewayUrl = (cid) => {
    // Try multiple gateways in case one is down
    const gateways = [
      `https://gateway.pinata.cloud/ipfs/${cid}`,
      `https://ipfs.io/ipfs/${cid}`,
      `https://cloudflare-ipfs.com/ipfs/${cid}`
    ];
    
    return gateways[0]; // Default to Pinata gateway
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPost.trim() && !selectedFile) {
      alert("Please enter some text or select an image for your post");
      return;
    }
    
    if (!pinataConnected && selectedFile) {
      alert("Pinata connection is not available. Please check your JWT token.");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);

      let imageURI = '';

      if (selectedFile) {
        // Upload image to Pinata with retry
        const imageCID = await uploadToPinataWithRetry(selectedFile);
        console.log("Image uploaded to IPFS with CID:", imageCID);
        imageURI = getPinataGatewayUrl(imageCID);
        console.log("Image URI:", imageURI);
      }
      
      // Interact with the smart contract
      const tx = await contract.makePost(newPost, imageURI);
      await tx.wait();
      console.log("Post created successfully!");

      setNewPost('');
      setSelectedFile(null);
      setPreview(null);
      setShowCreatePost(false);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      setErrorMessage(error.message || "Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        alert("File is too large. Maximum size is 10MB.");
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert("Only image files are allowed.");
        return;
      }
      
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleLike = async (index) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.likePost(index);
      await tx.wait();
      fetchPosts(); // Refresh posts to update like count
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDislike = async (index) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.dislikePost(index);
      await tx.wait();
      fetchPosts(); // Refresh posts to update dislike count
    } catch (error) {
      console.error("Error disliking post:", error);
    }
  };

  const handleFollow = async (userToFollow) => {
    if (userToFollow === account) {
      alert("You cannot follow yourself");
      return;
    }
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.followUser(userToFollow);
      await tx.wait();
      alert(`Successfully followed user: ${userToFollow}`);
      const following = await contract.getFollowing(account);
      setFollowingList(following);
    } catch (error) {
      console.error("Error following user:", error);
      alert("Failed to follow user. Please try again.");
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Instagram_logo.svg/1280px-Instagram_logo.svg.png" 
                alt="Instagram Logo" 
                className="h-8"
              />
              <span className="ml-2 text-xl font-semibold text-pink-600">3.0</span>
            </div>
            <div className="flex items-center">
              <button 
                onClick={() => setShowCreatePost(true)}
                className="p-2 rounded-full hover:bg-gray-100 mr-4"
              >
                <FontAwesomeIcon icon={faPlus} className="text-gray-700" />
              </button>
              <Link to="/friends" className="p-2 rounded-full hover:bg-gray-100 mr-4 relative">
                <FontAwesomeIcon icon={faComment} className="text-gray-700" />
                {getTotalUnreadCount() > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-pink-600 rounded-full">
                    {getTotalUnreadCount()}
                  </span>
                )}
              </Link>
              <Link to={`/ProfilePage/${account}`} className="p-2 rounded-full hover:bg-gray-100">
                <FontAwesomeIcon icon={faUser} className="text-gray-700" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

            {/* Main Content */}
            <div className="pt-16 pb-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pinata Connection Status */}
          {!pinataConnected && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Pinata connection is not available. Image uploads will not work. Please check your JWT token.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create Post Modal */}
          {showCreatePost && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Create Post</h3>
                  <button 
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPost('');
                      setSelectedFile(null);
                      setPreview(null);
                      setErrorMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4">
                  <div className="mb-4">
                    <textarea
                      id="post"
                      name="post"
                      rows={3}
                      className="shadow-sm focus:ring-pink-500 focus:border-pink-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                      placeholder="What's on your mind?"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                    ></textarea>
                  </div>
                  
                  {preview && (
                    <div className="mb-4 relative">
                      <button 
                        onClick={() => {
                          setSelectedFile(null);
                          setPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        &times;
                      </button>
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-auto rounded-lg max-h-60 object-contain bg-black" 
                      />
                      
                      {isUploading && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-pink-600 h-2.5 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-center mt-1">Uploading: {uploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      disabled={!pinataConnected}
                    >
                      <FontAwesomeIcon icon={faImage} className="mr-2 text-gray-500" />
                      Add Photo
                    </button>
                    
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    
                    <button
                      type="submit"
                      disabled={isLoading || (!newPost.trim() && !selectedFile) || (selectedFile && !pinataConnected)}
                      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        isLoading || (!newPost.trim() && !selectedFile) || (selectedFile && !pinataConnected)
                          ? 'bg-pink-300' 
                          : 'bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Posting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                          Post
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {isPostsLoading ? (
            <div className="flex justify-center items-center py-20">
              <svg className="animate-spin h-10 w-10 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-500 mb-4">No posts yet</div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create First Post
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Post Header */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <Link to={`/ProfilePage/${post.owner}`} className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold">
                        {post.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{post.username}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.time)}</p>
                      </div>
                    </Link>
                    {post.owner !== account && (
                      <button
                      onClick={() => handleFollow(post.owner)}
                      className={`${
                        isFollowing(post.owner) 
                          ? 'text-red-500' 
                          : 'text-pink-600 hover:text-pink-800'
                      } text-sm font-medium`}
                    >
                      {isFollowing(post.owner) ? (
                        <FontAwesomeIcon icon={solidHeart} size="lg" />
                      ) : (
                        'Follow'
                      )}
                    </button>
                    )}
                  </div>
                  
                  {/* Post Image (if any) */}
                  {post.imageURI && (
                    <div className="bg-black flex justify-center">
                      <img
                        src={post.imageURI}
                        alt="Post"
                        className="max-h-96 object-contain"
                        onError={(e) => {
                          // If image fails to load, try alternative gateways
                          const currentSrc = e.target.src;
                          if (currentSrc.includes('gateway.pinata.cloud')) {
                            e.target.src = currentSrc.replace('gateway.pinata.cloud', 'ipfs.io');
                          } else if (currentSrc.includes('ipfs.io')) {
                            e.target.src = currentSrc.replace('ipfs.io', 'cloudflare-ipfs.com');
                          } else {
                            // If all gateways fail, show a placeholder
                            e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Post Content */}
                  <div className="px-4 py-3">
                    {post.content && (
                      <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                    )}
                  </div>
                  
                  {/* Post Actions */}
                  <div className="px-4 py-2 border-t border-gray-100 flex items-center space-x-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-1 ${post.isLikedByUser ? 'text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}
                    >
                      <FontAwesomeIcon icon={faHeart} />
                      <span>{post.likes.length}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleDislike(post.id)}
                      className={`flex items-center space-x-1 ${post.isDislikedByUser ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                      <FontAwesomeIcon icon={faThumbsDown} />
                      <span>{post.dislikes.length}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-around">
      <button className="text-pink-600">
        <FontAwesomeIcon icon={faHome} size="lg" />
      </button>
      <button className="text-gray-500 hover:text-gray-700">
        <FontAwesomeIcon icon={faCompass} size="lg" />
      </button>
      <button 
        onClick={() => setShowCreatePost(true)}
        className="bg-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
      >
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <Link to="/friends" className="text-gray-500 hover:text-gray-700 relative">
        <FontAwesomeIcon icon={faComment} size="lg" />
        {getTotalUnreadCount() > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-pink-600 rounded-full">
            {getTotalUnreadCount()}
          </span>
        )}
      </Link>
      <Link to={`/ProfilePage/${account}`} className="text-gray-500 hover:text-gray-700">
        <FontAwesomeIcon icon={faUser} size="lg" />
      </Link>
    </div>
  </div>
</div>
</div>)
}

export default HomePage;