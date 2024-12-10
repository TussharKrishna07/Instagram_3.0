import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers';
import SignUpPage from './SignUpPage'
import HomePage from './HomePage' 

const abi = [
  "function signUp(string memory name) public",
  "function getUser(uint256 index) public view returns (string memory name, address userAddr)",
  "function isSignedUp() public view returns (bool) "

];

console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_CONTRACT_ADDRESS);

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
  console.log(address)
  const contract2 = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer); 
  const tx = await contract2.isSignedUp();
  console.log(tx)
}

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistered, setIsRegistered] = useState(null);
  
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', username, password);
    connectWallet(username);
    getUser();
  };
    
  return (
    <div >
      <h2>Login</h2>
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
        <div>
          <label htmlFor="password">Password:</label>
          <input
          placeholder='Password'
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;
