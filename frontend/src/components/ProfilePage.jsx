import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faHeart, faHeartBroken, faCheck } from '@fortawesome/free-solid-svg-icons';

const abi = [
    "function getUserName(address addr) public view returns (string memory userName)",
    "function getPostsCount() public view returns (uint256)",
    "function getPost(uint256 i) public view returns (string memory,string memory, address, address[] memory, address[] memory, uint256)",
    "function getFollowers(address userAddress) public view returns (address[] memory)",
    "function getFollowing(address userAddress) public view returns (address[] memory)",
    "function likePost(address userAddress,uint256 postId) public",
    "function dislikePost(address userAddress, uint256 postId) public",
    "function getUserPostsCount(address userAddress) public view returns(uint256)",
    "function getUserPost(uint256 i,address userAdress) public view returns (uint256,string memory,string memory, address, address[] memory, address[] memory, uint256)",
    "function followUser(address userToFollow) public",
    "function addComment(uint256 postId, string memory content) public",
    "function getComments(uint256 postId) public view returns (tuple(uint256 commentId, uint256 postId, string content, address commenter, uint256 timestamp)[] memory)"
];

function ProfilePage() {
    const [username, setUsername] = useState('');
    const [account, setAccount] = useState('');
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState(0); 
    const [following, setFollowing] = useState(0);
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState('');
    const [selectedPostId, setSelectedPostId] = useState(null);
    const { userAddress } = useParams();
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (userAddress) {
            fetchProfileData(userAddress);
            fetchUserPosts(userAddress);
            checkFollowStatus(userAddress);
        }
    }, [userAddress]);

    const fetchProfileData = async (userAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            let address;
            if (userAddress) {
                address = userAddress;
                setAccount(userAddress);
            } else {
                address = await signer.getAddress();
                setAccount(address);
            }

            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const userName = await contract.getUserName(address);
            const followersList = await contract.getFollowers(address); // Fetch followers count
            const followingList = await contract.getFollowing(address); // Fetch following count
            setUsername(userName);
            console.log(followersList);
            console.log(followingList);
            setFollowing(followingList.length);
            setFollowers(followersList.length);
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    };

    const fetchUserPosts = async (userAddress) => {
        let accountAddress = userAddress ? userAddress : account;
        if (!accountAddress) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const userPostCount = await contract.getUserPostsCount(userAddress);
            const fetchedPosts = [];

            for (let i = userPostCount-1; i >=0; i--) {
                const [postId,content, imageURI, owner, likes, dislikes, time] = await contract.getUserPost(i,userAddress);
                if (owner.toLowerCase() === accountAddress.toLowerCase()) {
                    fetchedPosts.push({ postId,content, imageURI, owner, likes, dislikes, time });
                    console.log(postId)
                }
            }
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const handleFollow = async (userToFollow) => {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
          const tx = await contract.followUser(userToFollow);
          await tx.wait();
          alert(`Successfully followed user: ${userToFollow}`);
          fetchProfileData(userToFollow); // Refresh profile data to update follower count
        } catch (error) {
          console.error("Error following user:", error);
          alert("Failed to follow user. Please try again.");
        }
      };

    const handleLike = async (userAddress,postId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const userPostCount = await contract.getUserPostsCount(userAddress);
      const tx = await contract.likePost(userAddress,postId);
      await tx.wait();
      fetchUserPosts(account); // Refresh posts to update like count
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDislike = async (userAddress,postId) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const userPostCount = await contract.getUserPostsCount(userAddress);
      const tx = await contract.dislikePost(userAddress,postId);
      await tx.wait();
      fetchUserPosts(account); // Refresh posts to update dislike count
    } catch (error) {
      console.error("Error disliking post:", error);
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

  const checkFollowStatus = async (userToCheck) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
      const followersList = await contract.getFollowers(userToCheck);
      const currentUser = await signer.getAddress();
      setIsFollowing(followersList.some(follower => follower.toLowerCase() === currentUser.toLowerCase()));
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 transform transition-all duration-200 hover:shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white text-4xl font-bold">
                            {username ? username[0].toUpperCase() : "?"}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                {username || "Unnamed User"}
                            </h2>
                            <p className="text-gray-500 mt-2 font-medium">
                                {account}
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4">
                                <div className="flex flex-col items-center md:items-start">
                                    <span className="text-2xl font-bold text-gray-900">{followers}</span>
                                    <span className="text-sm text-gray-500">Followers</span>
                                </div>
                                <div className="flex flex-col items-center md:items-start">
                                    <span className="text-2xl font-bold text-gray-900">{following}</span>
                                    <span className="text-sm text-gray-500">Following</span>
                                </div>
                                <button
                                    onClick={() => handleFollow(account)}
                                    className={`px-6 py-2 font-medium rounded-xl transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                        isFollowing
                                          ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500'
                                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-indigo-500'
                                      }`}
                                >
                                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Posts */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Posts</h3>
                    {posts.map((post, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-[1.02]">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center text-white font-bold">
                                            {username ? username[0].toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{username}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(post.time * 1000).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-600 mb-4">{post.content}</p>

                                {post.imageURI && (
                                    <img
                                        src={post.imageURI}
                                        alt="Post"
                                        className="rounded-lg w-full object-cover max-h-[32rem] mb-4"
                                    />
                                )}

                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => handleLike(post.owner, post.postId)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-rose-500 transition-colors duration-200"
                                    >
                                        <FontAwesomeIcon icon={faHeart} />
                                        <span>{post.likes.length} Likes</span>
                                    </button>
                                    <button
                                        onClick={() => handleDislike(post.owner, post.postId)}
                                        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors duration-200"
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

export default ProfilePage;