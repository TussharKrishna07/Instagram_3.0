import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCircle, 
  faHeart, 
  faThumbsDown, 
  faHome, 
  faCompass, 
  faUser, 
  faPlus,
  faArrowLeft,
  faUserPlus,
  faThLarge,
  faBookmark,
  faTag,
  faCamera
} from '@fortawesome/free-solid-svg-icons';

const abi = [
    "function getUserName(address addr) public view returns (string memory userName)",
    "function getPostsCount() public view returns (uint256)",
    "function getPost(uint256 i) public view returns (string memory,string memory, address, address[] memory, address[] memory, uint256)",
    "function getFollowers(address userAddress) public view returns (address[] memory)",
    "function getFollowing(address userAddress) public view returns (address[] memory)",
    "function likePost(uint256 index) public",
    "function dislikePost(uint256 index) public",
    "function followUser(address userToFollow) public"
];

function ProfilePage() {
    const [username, setUsername] = useState('');
    const [account, setAccount] = useState('');
    const [currentUserAccount, setCurrentUserAccount] = useState('');
    const [posts, setPosts] = useState([]);
    const [followers, setFollowers] = useState([]); 
    const [following, setFollowing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isFollowing, setIsFollowing] = useState(false);
    const { userAddress } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                setIsLoading(true);
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const currentAddress = await signer.getAddress();
                setCurrentUserAccount(currentAddress);
                
                // Determine which profile to show
                const profileAddress = userAddress || currentAddress;
                setAccount(profileAddress);
                
                await fetchProfileData(profileAddress);
                await fetchUserPosts(profileAddress);
            } catch (error) {
                console.error("Error initializing profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        init();
    }, [userAddress]);

    const fetchProfileData = async (profileAddress) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            
            // Get username
            const userName = await contract.getUserName(profileAddress);
            setUsername(userName);
            
            // Get followers and following
            const followersList = await contract.getFollowers(profileAddress);
            const followingList = await contract.getFollowing(profileAddress);
            
            setFollowers(followersList);
            setFollowing(followingList);
            
            // Check if current user is following this profile
            const currentAddress = await signer.getAddress();
            setIsFollowing(followersList.some(addr => 
                addr.toLowerCase() === currentAddress.toLowerCase()
            ));
            
        } catch (error) {
            console.error("Error fetching profile data:", error);
        }
    };

    const fetchUserPosts = async (profileAddress) => {
        if (!profileAddress) return;
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const postCount = await contract.getPostsCount();
            const fetchedPosts = [];
            const currentAddress = await signer.getAddress();

            for (let i = 0; i < postCount; i++) {
                const [content, imageURI, owner, likes, dislikes, time] = await contract.getPost(i);
                if (owner.toLowerCase() === profileAddress.toLowerCase()) {
                    fetchedPosts.push({ 
                        id: i,
                        content, 
                        imageURI, 
                        owner, 
                        likes, 
                        dislikes, 
                        time: new Date(time * 1000),
                        isLikedByUser: likes.some(addr => addr.toLowerCase() === currentAddress.toLowerCase()),
                        isDislikedByUser: dislikes.some(addr => addr.toLowerCase() === currentAddress.toLowerCase())
                    });
                }
            }
            
            // Sort posts by time (newest first)
            fetchedPosts.sort((a, b) => b.time - a.time);
            
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const handleLike = async (index) => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const tx = await contract.likePost(index);
            await tx.wait();
            fetchUserPosts(account);
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
            fetchUserPosts(account);
        } catch (error) {
            console.error("Error disliking post:", error);
        }
    };
    
    const handleFollow = async () => {
        if (account === currentUserAccount) {
            alert("You cannot follow yourself");
            return;
        }
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);
            const tx = await contract.followUser(account);
            await tx.wait();
            await fetchProfileData(account);
        } catch (error) {
            console.error("Error following user:", error);
        }
    };
    
    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };
    
    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };
    
    const getRandomGradient = () => {
        const gradients = [
            'from-purple-400 to-pink-500',
            'from-blue-400 to-indigo-500',
            'from-green-400 to-teal-500',
            'from-yellow-400 to-orange-500',
            'from-red-400 to-pink-500'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="mr-2 text-gray-500"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                            <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Instagram_logo.svg/1280px-Instagram_logo.svg.png" 
                                alt="Instagram Logo" 
                                className="h-8"
                            />
                            <span className="ml-2 text-xl font-semibold text-pink-600">3.0</span>
                        </div>
                        <div className="flex items-center">
                            <Link to="/HomePage" className="p-2 rounded-full hover:bg-gray-100">
                                <FontAwesomeIcon icon={faHome} className="text-gray-700" />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <svg className="animate-spin h-10 w-10 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : (
                        <>
                            {/* Profile Header */}
                            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                                <div className="flex flex-col sm:flex-row items-center">
                                    <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getRandomGradient()} flex items-center justify-center text-white text-4xl font-bold`}>
                                        {getInitials(username)}
                                    </div>
                                    
                                    <div className="mt-4 sm:mt-0 sm:ml-6 flex-1 text-center sm:text-left">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <h1 className="text-xl font-bold text-gray-900">{username || "Unnamed User"}</h1>
                                            
                                            {account !== currentUserAccount && (
                                                <button
                                                    onClick={handleFollow}
                                                    className={`mt-2 sm:mt-0 px-4 py-2 rounded-md text-sm font-medium ${
                                                        isFollowing 
                                                            ? 'bg-gray-200 text-gray-800' 
                                                            : 'bg-pink-600 text-white hover:bg-pink-700'
                                                    }`}
                                                >
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                </button>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-gray-500 mt-1 break-all">{formatAddress(account)}</p>
                                        
                                        <div className="flex justify-center sm:justify-start space-x-6 mt-4">
                                            <div className="text-center">
                                                <span className="block font-bold text-gray-900">{posts.length}</span>
                                                <span className="text-sm text-gray-500">Posts</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-bold text-gray-900">{followers.length}</span>
                                                <span className="text-sm text-gray-500">Followers</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-bold text-gray-900">{following.length}</span>
                                                <span className="text-sm text-gray-500">Following</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Tabs */}
                            <div className="bg-white rounded-lg shadow-sm mb-6">
                                <div className="flex border-b">
                                    <button
                                        className={`flex-1 py-3 text-sm font-medium text-center ${
                                            activeTab === 'posts' 
                                                ? 'text-pink-600 border-b-2 border-pink-600' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                        onClick={() => setActiveTab('posts')}
                                    >
                                        <FontAwesomeIcon icon={faThLarge} className="mr-2" />
                                        Posts
                                    </button>
                                    <button
                                        className={`flex-1 py-3 text-sm font-medium text-center ${
                                            activeTab === 'saved' 
                                                ? 'text-pink-600 border-b-2 border-pink-600' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                        onClick={() => setActiveTab('saved')}
                                    >
                                        <FontAwesomeIcon icon={faBookmark} className="mr-2" />
                                        Saved
                                    </button>
                                    <button
                                        className={`flex-1 py-3 text-sm font-medium text-center ${
                                            activeTab === 'tagged' 
                                                ? 'text-pink-600 border-b-2 border-pink-600' 
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                        onClick={() => setActiveTab('tagged')}
                                    >
                                        <FontAwesomeIcon icon={faTag} className="mr-2" />
                                        Tagged
                                    </button>
                                </div>
                            </div>
                            
                            {/* Content based on active tab */}
                            {activeTab === 'posts' && (
                                posts.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-1">
                                        {posts.map((post) => (
                                            <div key={post.id} className="aspect-square bg-black relative group">
                                                {post.imageURI ? (
                                                    <img 
                                                        src={post.imageURI} 
                                                        alt="Post" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                                                        <span className="text-sm p-2 text-center">{post.content.substring(0, 50)}{post.content.length > 50 ? '...' : ''}</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="text-white flex items-center space-x-4">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faHeart} className="mr-2" />
                                                            <span>{post.likes.length}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon icon={faThumbsDown} className="mr-2" />
                                                            <span>{post.dislikes.length}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                                        <div className="text-5xl text-gray-300 mb-4">
                                            <FontAwesomeIcon icon={faCamera} />
                                        </div>
                                        <h3 className="text-xl font-medium text-gray-900 mb-2">No Posts Yet</h3>
                                        <p className="text-gray-500">
                                            {account === currentUserAccount 
                                                ? "When you share photos, they'll appear on your profile."
                                                : "This user hasn't posted anything yet."}
                                        </p>
                                        {account === currentUserAccount && (
                                            <Link 
                                                to="/HomePage" 
                                                className="mt-4 inline-block px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                                            >
                                                Share Your First Photo
                                            </Link>
                                        )}
                                    </div>
                                )
                            )}
                            
                            {activeTab === 'saved' && (
                                <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                                    <div className="text-5xl text-gray-300 mb-4">
                                        <FontAwesomeIcon icon={faBookmark} />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">Save</h3>
                                    <p className="text-gray-500">
                                        Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
                                    </p>
                                </div>
                            )}
                            
                            {activeTab === 'tagged' && (
                                <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                                    <div className="text-5xl text-gray-300 mb-4">
                                        <FontAwesomeIcon icon={faTag} />
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">Photos of you</h3>
                                    <p className="text-gray-500">
                                        When people tag you in photos, they'll appear here.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* Bottom Navigation */}
            <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-around">
                        <Link to="/HomePage" className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faHome} size="lg" />
                        </Link>
                        <button className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faCompass} size="lg" />
                        </button>
                        <Link 
                            to="/HomePage" 
                            className="bg-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                        </Link>
                        <button className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faHeart} size="lg" />
                        </button>
                        <Link to={`/ProfilePage/${currentUserAccount}`} className={`${account === currentUserAccount ? 'text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}>
                            <FontAwesomeIcon icon={faUser} size="lg" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;