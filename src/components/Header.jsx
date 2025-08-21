import React from 'react'
import visionaryGlobal from '../assets/visionaryGlobal.png';
import dcb from '../assets/dcb.png';
const Header = () => {
  return (
    <div>
    <div className="z-10 flex justify-between items-center w-full p-6  h-32 bg-gradient-to-br from-green-600 via-green-700 to-green-800 relative overflow-hidden font-sans space-x-2 mb-8">
                <div className="flex items-center space-x-4">
                    
                   <div className="bg-white rounded-lg shadow-lg">
                  <img src={dcb} alt="Visionary Global" className="w-24 h-24 rounded-full" />
                </div>
                    
                    
                </div>
                <div className='flex flex-col justify-center items-center text-center'>
                    <h2 className="text-2xl text-white sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                      Household Survey
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-white">
                      Delhi Cantonment Board, 2025
                    </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg">
                  <img src={visionaryGlobal} alt="Visionary Global" className="w-24 h-24 rounded-full" />
                </div>
            </div>
    </div>
        );
}

export default Header