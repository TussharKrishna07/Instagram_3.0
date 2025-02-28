import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const abi = [
    "function getUserName(address addr) public view returns (string memory userName)",
    "function getPostsCount() public view returns (uint256)",
    "function getPost(uint256 i) public view returns (string memory,string memory, address, address[] memory, address[] memory, uint256)"
];

function ProfilePage() {
    const [username, setUsername] = useState('');
    const [account, setAccount] = useState('');
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState(123); // Dummy data
    const [following, setFollowing] = useState(456); // Dummy data

    useEffect(() => {
        fetchProfileData();
        fetchUserPosts();
    }, [account]);

    const fetchProfileData = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);

            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const userName = await contract.getUserName(address);
            setUsername(userName);
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    };

    const fetchUserPosts = async () => {
        if (!account) return;
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const postCount = await contract.getPostsCount();
            const fetchedPosts = [];

            for (let i = 0; i < postCount; i++) {
                const [content, imageURI, owner, likes, dislikes, time] = await contract.getPost(i);
                if (owner.toLowerCase() === account.toLowerCase()) {
                    fetchedPosts.push({ content, imageURI, owner, likes, dislikes, time });
                }
            }
            setPosts(fetchedPosts.reverse());
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto py-10">
                {/* Profile Header */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="w-16 h-16 rounded-full bg-gray-300 flex-shrink-0">
                                {/* Placeholder for profile picture */}
                            </div>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Posts */}
                <div className="bg-white shadow rounded-lg">
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">Your Posts</h3>
                        {posts.length > 0 ? (
                            <div className="space-y-4">
                                {posts.map((post, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <p>{post.content}</p>
                                        {post.imageURI && (
                                            <img src={post.imageURI} alt="Post Image" className="mt-2 max-w-full h-auto" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No posts yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;