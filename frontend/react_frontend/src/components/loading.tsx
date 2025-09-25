//import React from 'react'
import Lottie from "lottie-react"
import Rocket from '../assets/Rocket.json';

const LoadingComponent = () => {
  return (
    <div style={{height: '100vh', width:'100vh', display: "flex", flexDirection: "column", justifyContent: "center", alignItems: 'center'}}>
        <Lottie
            animationData={Rocket}
            loop={true}
            autoplay={true}
            style={{width: '150px', height: '150px'}}
        />
        <div>Loading your insights...</div>
    </div>
  )
}

export default LoadingComponent