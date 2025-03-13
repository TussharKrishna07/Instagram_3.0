import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link, useParams } from 'react-router-dom';

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
    "function followUser(address userToFollow) public"

];

function ProfilePage() {
    const [username, setUsername] = useState('');
    const [account, setAccount] = useState('');
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState(0); 
    const [following, setFollowing] = useState(0);
    const { userAddress } = useParams();

    useEffect(() => {
        fetchProfileData(userAddress);
        fetchUserPosts(userAddress);
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

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-10">
                {/* Profile Header */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="p-6">
                        <div className="flex items-center">
                            <Link to={`/ProfilePage/${account}`} className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0">
                                {/* Placeholder for profile picture */}
                            </Link>
                            <div className="ml-4">
                                <h2 className="text-xl font-semibold">{username || "Unnamed User"}</h2>
                                <p className="text-gray-500">{account}</p>
                                <div className="flex mt-2">
                                    <div className="mr-4">
                                        <span className="font-semibold">{followers}</span> Followers
                                    </div>
                                    <div>
                                        <span className="font-semibold">{following}</span> Following
                                    </div>
                                    <button
                                      onClick={() => handleFollow(account)}
                                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                      Follow
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Posts */}
                <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Your Posts</h3>
                        <div className="space-y-6">
            {posts.map((post, index) => (
              <div key={index} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{post.username}</h3>
                    <p className="text-sm text-gray-500">{post.owner}</p>
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {new Date(post.time * 1000).toLocaleString()}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Content</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {post.content}
                        {post.imageURI && (
                          <img
                            src={post.imageURI}
                            alt="Post Image"
                            className="mt-4 max-w-full h-auto rounded"
                          />
                        )}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Likes</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {post.likes.length}
                        <button onClick={() => handleLike(post.owner,post.postId)} className="ml-2 px-3 py-1 bg-green-200 rounded">Like</button>
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Dislikes</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {post.dislikes.length}
                        <button onClick={() => handleDislike(post.owner,post.postId)} className="ml-2 px-3 py-1 bg-red-200 rounded">Dislike</button>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;