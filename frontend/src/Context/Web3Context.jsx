import { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'

const Web3Context = createContext()

const contractABI = [
  "function signUp(string memory name) public",
  "function makePost(string memory content) public",
  "function getPostsCount() public view returns (uint256)",
  "function getPost(uint256 i) public view returns (string memory, address, address[] memory, address[] memory, uint256)",
  "function getUserName(address addr) public view returns (string memory userName)",
  "function isSignedUp() public view returns (bool)"
]

const contractAddress = "0xdE5aE03fa3960a8AF95C66e8335380b2478a5166"

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null)
  const [contract, setContract] = useState(null)
  const [provider, setProvider] = useState(null)
  const [isSignedUp, setIsSignedUp] = useState(false)

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', () => window.location.reload())
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0])
      checkSignUpStatus(accounts[0])
    } else {
      setAccount(null)
      setIsSignedUp(false)
    }
  }

  const connectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, contractABI, signer)
      setContract(contract)
      setAccount(accounts[0])
      await checkSignUpStatus(accounts[0])
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const checkSignUpStatus = async (address) => {
    try {
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, contractABI, signer)
      const status = await contract.isSignedUp()
      setIsSignedUp(status)
    } catch (error) {
      console.error('Error checking signup status:', error)
    }
  }

  return (
    <Web3Context.Provider value={{ account, contract, connectWallet, isSignedUp }}>
      {children}
    </Web3Context.Provider>
  )
}

export function useWeb3() {
  return useContext(Web3Context)
}

