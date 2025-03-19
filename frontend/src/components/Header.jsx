import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import QuizIcon from '@mui/icons-material/Quiz';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import { useState } from 'react';

const Header = ({ userName }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  
  return (
          

        <header className="bg-blue-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link 
            to="/" 
            className={`text-2xl font-bold hover:text-blue-100 transition-colors flex items-center ${
              !isHomePage ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
            Q
          </div>
            <span className="ml-3 text-xl font-bold text-gray-800">BistecQuizz</span>
          </Link>
          
          
          
        </div>
        
        
      </div>
    </header>
  );
};

export default Header;