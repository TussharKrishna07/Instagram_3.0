import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useNavigate, Link } from 'react-router-dom'; // Import useNavigate and Link
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon
import { faUserCircle, faComment, faHeart, faHeartBroken } from '@fortawesome/free-solid-svg-icons'; // Import the user icon

const abi = [
  "function makePost(string memory content, string memory imageURI)",
  "function getPostsCount() public view returns (uint256)",
  "function getPost(uint256 i) public view returns (uint256,string memory,string memory, address, address[] memory, address[] memory, uint256)",
  "function getUserName(address addr) public view returns (string memory userName)",
  "function likePost(address userAddress,uint256 postId) public",
  "function dislikePost(address userAddress, uint256 postId) public",
  "function followUser(address userToFollow) public",
  "function getUser(uint256 index) public view returns (string memory name, address userAddr)",
  "function getUsersCount() public view returns (uint256)",
  "function addComment(uint256 postId, string memory content) public",
  "function getComments(uint256 postId) public view returns (tuple(uint256 commentId, uint256 postId, string content, address commenter, uint256 timestamp)[] memory)",
  "function getFollowers(address userAddress) public view returns (address[] memory)",
  "function getFollowing(address userAddress) public view returns (address[] memory)"
];

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // Initialize useNavigate
  const [account, setAccount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [followStatus, setFollowStatus] = useState({});

  useEffect(() => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    provider.send("eth_requestAccounts", []).then(async () => {
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);
    });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      console.log(import.meta.env.VITE_CONTRACT_ADDRESS);
      const postCount = await contract.getPostsCount();
      const fetchedPosts = [];

      if (postCount > 0) {
        for (let i = postCount - 1; i >= 0; i--) {
          const [postId,content, imageURI, owner, likes, dislikes, time] = await contract.getPost(i);
          const username = await contract.getUserName(owner);
          fetchedPosts.push({ postId,content, imageURI, owner, likes, dislikes,time, formattedTime: new Date(time * 1000), username });
        }
      }

      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
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
    });
    data.append('pinataMetadata', metadata);

    try {
      console.log(import.meta.env.VITE_PINATA_JWT)
      const response = await axios.post(url, data, {
        maxBodyLength: 'Infinity', // Required to prevent Axios from erroring out with large files
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
          // pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          // pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
      });
      return response.data.IpfsHash; // CID
    } catch (error) {
      console.error('Error uploading file to Pinata:', error);
      throw new Error('Pinata upload failed');
    }
  };

  // Function to upload JSON metadata to Pinata
  const uploadMetadataToPinata = async (metadata) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
      const response = await axios.post(url, metadata, {
        headers: {
          'Content-Type': 'application/json',
          // pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          // pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
      });
      return response.data.IpfsHash; // CID
    } catch (error) {
      console.error('Error uploading JSON to Pinata:', error);
      throw new Error('Pinata metadata upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);

      let tokenURI = '';
      let imageURI = '';

      if (selectedFile) {
        // Upload image to Pinata
        const imageCID = await uploadToPinata(selectedFile);
        console.log(imageCID)
        imageURI = `https://gateway.pinata.cloud/ipfs/${imageCID}`;
        console.log(imageURI)
        // Create metadata
        const metadata = {
          name: newPost, // Or any other title
          description: 'User Post',
          image: imageURI,
        };

        // Upload metadata to Pinata
        const metadataCID = await uploadMetadataToPinata(metadata);
        tokenURI = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
      }
      // Interact with the smart contract
      console.log(imageURI);
      const tx = await contract.makePost(newPost,imageURI);
      await tx.wait();

      setNewPost('');
      setSelectedFile(null);
      setPreview(null);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleLike = async (userAddress,postId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const postCount = await contract.getPostsCount();
      const tx = await contract.likePost(userAddress,postId);
      await tx.wait();
      fetchPosts(); // Refresh posts to update like count
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDislike = async (userAddress,postId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const postCount = await contract.getPostsCount();
      const tx = await contract.dislikePost(userAddress,postId);
      await tx.wait();
      fetchPosts(); // Refresh posts to update dislike count
    } catch (error) {
      console.error("Error disliking post:", error);
    }
  };

  const checkFollowStatus = async (userToCheck) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const followersList = await contract.getFollowers(userToCheck);
      const currentUser = await signer.getAddress();
      const isFollowing = followersList.some(follower => follower.toLowerCase() === currentUser.toLowerCase());
      setFollowStatus(prev => ({...prev, [userToCheck]: isFollowing}));
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async (userToFollow) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.followUser(userToFollow);
      await tx.wait();
      await checkFollowStatus(userToFollow);
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      alert("Failed to follow/unfollow user. Please try again.");
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS,abi,signer);
      const usersCount = await contract.getUsersCount();
      const fetchedUsers = [];
      for (let i = 0; i < usersCount; i++) {
        const [username,userAddress] = await contract.getUser(i);
        fetchedUsers.push({ username,userAddress });
        console.log(username);
      }
      const results = fetchedUsers.filter((user) => user.username.includes(searchTerm));
      console.log(results);
      setSearchResults(results);
      if(results.length === 0){
        alert("No users found");
      }else{
        navigate('/ProfilePage/'+results[0].userAddress);
      }

    } catch (error) {
      console.error("Error searching users:", error);
      alert("Failed to search users. Please try again.");
    }
  };

  const fetchComments = async (postId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const fetchedComments = await contract.getComments(postId);

      // Fetch usernames for each comment
      const commentsWithUsernames = await Promise.all(
        fetchedComments.map(async (comment) => {
          const username = await contract.getUserName(comment.commenter);
          return { ...comment, username };
        })
      );

      setComments(prevState => ({
        ...prevState,
        [postId]: commentsWithUsernames
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async (postId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const tx = await contract.addComment(postId, newComment);
      await tx.wait();
      setNewComment('');
      fetchComments(postId); // Refresh comments after adding
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  useEffect(() => {
    posts.forEach(post => {
      checkFollowStatus(post.owner);
    });
  }, [posts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="flex rounded-lg shadow-lg overflow-hidden">
            <input
              type="text"
              className="flex-1 px-6 py-3 text-gray-700 focus:outline-none"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition duration-200"
            >
              Search
            </button>
          </div>
        </form>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Social Feed
          </h1>
          <button
            onClick={() => navigate('/ProfilePage/'+account)}
            className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition duration-200"
          >
            <FontAwesomeIcon icon={faUserCircle} size="2x" className="text-indigo-600" />
          </button>
        </div>

        {/* Create Post Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <textarea
            id="post"
            name="post"
            rows={3}
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-200 resize-none"
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          ></textarea>

          {preview && (
            <div className="mt-4 rounded-lg overflow-hidden">
              {selectedFile.type.startsWith('image') ? (
                <img src={preview} alt="Preview" className="max-h-96 w-full object-cover" />
              ) : (
                <video src={preview} className="max-h-96 w-full" controls />
              )}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-5 py-2.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition duration-200"
            >
              Upload Media
            </button>
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>

        {/* Posts */}
        <div className="space-y-8">
          {posts.map((post, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition duration-200 hover:scale-[1.02]">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Link to={`/ProfilePage/${post.owner}`} className="flex items-center group">
                    <FontAwesomeIcon icon={faUserCircle} size="lg" className="text-indigo-600 mr-3" />
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition duration-200">
                      {post.username}
                    </h3>
                  </Link>
                  <button
                    onClick={() => handleFollow(post.owner)}
                    className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                      followStatus[post.owner]
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                    }`}
                  >
                    {followStatus[post.owner] ? 'Unfollow' : 'Follow'}
                  </button>
                </div>

                <p className="text-gray-600 mb-4">{post.content}</p>

                {post.imageURI && (
                  <img
                    src={post.imageURI}
                    alt="Post"
                    className="rounded-lg w-full object-cover max-h-[32rem]"
                  />
                )}

                <div className="flex items-center gap-6 mt-6">
                  <button
                    onClick={() => handleLike(post.owner, post.postId)}
                    className="flex items-center gap-2 text-gray-600 hover:text-rose-500 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faHeart} />
                    <span>{post.likes.length} Likes</span>
                  </button>
                  <button
                    onClick={() => handleDislike(post.owner, post.postId)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition duration-200"
                  >
                    <FontAwesomeIcon icon={faHeartBroken} />
                    <span>{post.dislikes.length} Dislikes</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedPostId(post.postId);
                        fetchComments(post.postId);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                    >
                      <FontAwesomeIcon icon={faComment} className="mr-2" />
                      {comments[post.postId]?.length || 0} Replies
                    </button>
                    <button
                      onClick={() => setSelectedPostId(post.postId)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                    >
                      Add Comment
                    </button>
                  </div>

                  {selectedPostId === post.postId && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200 shadow-sm"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                          />
                          <button
                            onClick={() => handleAddComment(post.postId)}
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 shadow-md"
                          >
                            Post
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {comments[post.postId]?.map((comment, index) => (
                          <div key={index} 
                               className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                                  {comment.username[0].toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {comment.username}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {comment.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(comment.timestamp * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;

// /* Add this CSS somewhere in your global styles or component */
// .custom-scrollbar {
//   scrollbar-width: thin;
//   scrollbar-color: #818CF8 #EEF2FF;
// }

// .custom-scrollbar::-webkit-scrollbar {
//   width: 6px;
// }

// .custom-scrollbar::-webkit-scrollbar-track {
//   background: #EEF2FF;
//   border-radius: 10px;
// }

// .custom-scrollbar::-webkit-scrollbar-thumb {
//   background: #818CF8;
//   border-radius: 10px;
// }
