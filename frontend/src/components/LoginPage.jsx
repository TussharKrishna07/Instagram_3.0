import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { ethers } from 'ethers';
import SignUpPage from './SignUpPage'
import HomePage from './HomePage' 

//importing the ABI
const abi = [
  "function signUp(string memory name) public",
  "function getUser(uint256 index) public view returns (string memory name, address userAddr)",
  "function isSignedUp() public view returns (bool) ",
  "function getUserName(address addr) public view returns (string memory userName)"

];

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistered, setIsRegistered] = useState(null);

  
  async function connectWallet(username){
    const provider2 = new ethers.providers.Web3Provider(window.ethereum);
    await provider2.send("eth_requestAccounts", []);
    const signer = provider2.getSigner();
    const address = await signer.getAddress();
    const contract2 = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer); 
    const isRegistered = await contract2.isSignedUp();

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
    console.log('Login attempted with:', username);
    connectWallet(username);
  };
    
  return (
    <div >
      <h2>Login Page</h2>
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default LoginPage;

