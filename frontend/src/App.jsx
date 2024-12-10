import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import LoginPage from './components/LoginPage'
import SignUpPage from './components/SignUpPage'
import HomePage from './components/HomePage'

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element ={<LoginPage />}/>
          <Route path="/SignUpPage" element = {<SignUpPage/>}/>
          <Route path="/HomePage" element = {<HomePage/>}/>
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App

