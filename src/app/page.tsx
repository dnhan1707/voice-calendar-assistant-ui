'use client'
import './globals.css';

export default function Home() {
  return (
    <div className='full-screen'>
      <div className='intro-welcome-text-container'>
        <p className='intro-welcome'>
          Hi, Welcome to your personal 
          <span className='assistant-text highlight'>calendar assistant!</span>
        </p>
      </div>
      
      <div className='mic-container'>
        <div className='mic-button'>
          <i className="fas fa-microphone"></i>  
        </div>
      </div>
    </div>
  )
}