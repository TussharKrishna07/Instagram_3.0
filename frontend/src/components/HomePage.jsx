import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

const abi = [
  "function makePost(string memory content, string memory imageURI)",
  "function getPostsCount() public view returns (uint256)",
  "function getPost(uint256 i) public view returns (string memory,string memory, address, address[] memory, address[] memory, uint256)",
  "function getUserName(address addr) public view returns (string memory userName)"
];

function HomePage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [imageURI, setimageURI] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
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

      for (let i = 0; i < postCount; i++) {
        const [content,imageURI, owner, likes, dislikes, time] = await contract.getPost(i);
        const username = await contract.getUserName(owner);
        fetchedPosts.push({ content,imageURI, owner, likes, dislikes, time: new Date(time * 1000), username });
      }

      setPosts(fetchedPosts.reverse());
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
      let localImageURI = '';

      if (selectedFile) {
        // Upload image to Pinata
        const imageCID = await uploadToPinata(selectedFile);
        console.log(imageCID)
        const localImageURI = `https://gateway.pinata.cloud/ipfs/${imageCID}`;
        setimageURI(localImageURI)
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Social Media Feed</h1>

          <form onSubmit={handleSubmit} className="mb-8">
            <div>
              <label htmlFor="post" className="block text-sm font-medium text-gray-700">
                Create a new post
              </label>
              <div className="mt-1">
                <textarea
                  id="post"
                  name="post"
                  rows={3}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md"
                  placeholder="What's on your mind?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                ></textarea>
              </div>
            </div>
            {preview && (
              <div className="preview-container mt-2">
                {/* Render image or video based on file type */}
                {selectedFile.type.startsWith('image') ? (
                  <img src={preview} alt="Preview" className="preview-image" />
                ) : (
                  <video src={preview} className="preview-video" controls />
                )}
              </div>
            )}
            <div className="mt-2">
              <button
                type="button"
                style={{ marginRight: '10px' }}
                onClick={() => fileInputRef.current.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Upload Media
              </button>

              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {posts.map((post, index) => (
              <div key={index} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{post.username}</h3>
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
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{post.likes.length}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Dislikes</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{post.dislikes.length}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
