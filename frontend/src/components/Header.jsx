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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
            <span className="sm:hidden">BQ</span>
          </Link>
          
          {/* Mobile menu toggle */}
          <button 
            className="md:hidden text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <MenuIcon />
          </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center text-white hover:text-blue-200 transition-colors px-3 py-2"
            >
              
            </Link>
            
           
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 bg-blue-800 bg-opacity-90 rounded-lg p-4 shadow-lg">
            <Link 
              to="/" 
              className="flex items-center text-white hover:text-blue-200 transition-colors px-3 py-2 mb-2"
              onClick={() => setMobileMenuOpen(false)}
            >

            </Link>
            
           
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;