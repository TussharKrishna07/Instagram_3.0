import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const abi = [
    "function signUp(string memory name) public",
    "function getUser(uint256 index) public view returns (string memory name, address userAddr)",
    "function isSignedUp() public view returns (bool) "
  
  ];


const provider1 = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_API_URL);
const contract1 = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, provider1);
const getUser = async () => {
  const getter = await contract1.getUser(0);
  console.log(getter);
};

async function connectWallet(username){
    const provider2 = new ethers.providers.Web3Provider(window.ethereum);
    await provider2.send("eth_requestAccounts", []);
    const signer = provider2.getSigner();
    const address = signer.getAddress();
    const contract2 = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer); 
    const tx = await contract2.signUp(username);
}

function SignUpPage(){
    const [username, setUsername] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Login attempted with:', username);
        getUser();
        connectWallet(username);
      };

    
    return (
        <div >
          <h2>SignUp</h2>
          <div>
                User Profile
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">Username:</label>
              <input
              placeholder='Username'
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit">Sign Up</button>
          </form>
        </div>
      );
    }


export default SignUpPage;