import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';

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
  

  async function connectWallet(){
    console.log('Login attempted');
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
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    connectWallet();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 max-w">
          Connect your wallet to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 transform transition-all hover:scale-105">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
              >
                <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
                Connect with MetaMask
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to the platform?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => navigate('/SignUpPage')}
                className="w-full flex justify-center items-center px-6 py-3 border-2 border-indigo-500 text-base font-medium rounded-xl text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all duration-200 hover:scale-[1.02]"
              >
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                Create an Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

