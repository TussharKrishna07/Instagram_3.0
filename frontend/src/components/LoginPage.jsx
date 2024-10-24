import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

console.log(import.meta.env.VITE_API_URL);
console.log(import.meta.env.VITE_CONTRACT_ADDRESS);
const provider1 = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_API_URL);
const provider2 = new ethers.providers.Web3Provider(window.ethereum);

async function connectWallet(){
  await provider2.send("eth_requestAccounts", []);
  const signer = provider2.getSigner();
  const address = signer.getAddress();
  const contract2 = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer); 
  const tx = await contract2.addUser(username,password)
  
}

const abi = [
  "function addUser(string memory username,string memory password)public",
  "function getUser(uint index)public view returns(string memory,string memory,address,bool)"
];

const contract1 = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, provider1);
const getUser = async () => {
  const getter = await contract1.getUser(0);
  console.log(getter);
};

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempted with:', username, password);
   getUser();
   connectWallet();
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
