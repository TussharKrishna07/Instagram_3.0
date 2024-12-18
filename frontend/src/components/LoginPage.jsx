import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

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
  

  async function connectWallet(username){
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
    const isRegistered = await contract.isSignedUp();

    setIsRegistered(isRegistered);
    //checking the if the user is registered or not and navigating 
    if(isRegistered===false){
      navigate("/SignUpPage");
    }else{
      navigate("/HomePage");
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    connectWallet(username);
  };


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
            <button
              type="submit"
              
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sign in
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
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/SignUpPage')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

