import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import LoginPage from './components/LoginPage'
import SignUpPage from './components/SignUpPage'
import HomePage from './components/HomePage'
import {Web3Provider} from './Context/Web3Context'

function App() {
  return (
    <div>
      <Web3Provider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element ={<LoginPage />}/>
          <Route path="/SignUpPage" element = {<SignUpPage/>}/>
          <Route path="/HomePage" element = {<HomePage/>}/>
        </Routes>
      </BrowserRouter>
      </Web3Provider>
    </div>
  )
}

export default App

