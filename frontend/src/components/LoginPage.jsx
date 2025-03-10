import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faUser, faLock } from '@fortawesome/free-solid-svg-icons';

const abi = [
  "function signUp(string memory name) public",
  "function getUser(uint256 index) public view returns (string memory name, address userAddr)",
  "function isSignedUp() public view returns (bool)",
  "function getUserName(address addr) public view returns (string memory userName)"
];

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  

  async function connectWallet(username){
    try {
      setIsLoading(true);
      console.log('Login attempted with:', username);
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log(address)
      console.log(import.meta.env.VITE_CONTRACT_ADDRESS)
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer); 
      console.log(contract)
      const isRegistered = await contract.isSignedUp();

      setIsRegistered(isRegistered);
      //checking the if the user is registered or not and navigating 
      if(isRegistered===false){
        navigate("/SignUpPage");
      }else{
        navigate("/HomePage");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    connectWallet(username);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Instagram_logo.svg/1280px-Instagram_logo.svg.png" 
            alt="Instagram Logo" 
            className="h-16 mb-6"
          />
        </div>
        <h2 className="text-center text-4xl font-extrabold text-white">Instagram 3.0</h2>
        <p className="mt-2 text-center text-xl text-white opacity-80">Decentralized Social Experience</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300 transform hover:scale-105"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FontAwesomeIcon icon={faWallet} className="mr-2" />
                    Connect Wallet
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to Instagram 3.0?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/SignUpPage')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-pink-600 bg-white hover:bg-pink-50 border-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300"
              >
                Create an account
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-pink-800">About Instagram 3.0</h3>
              <p className="mt-2 text-sm text-pink-700">
                A decentralized social media platform built on blockchain technology. 
                Connect with your wallet to experience social media without centralized control.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-4 right-4">
        <div className="bg-white bg-opacity-80 rounded-full p-2 shadow-lg">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
            alt="MetaMask" 
            className="h-8 w-8"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

