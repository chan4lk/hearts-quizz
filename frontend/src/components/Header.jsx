import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import QuizIcon from '@mui/icons-material/Quiz';
import PersonIcon from '@mui/icons-material/Person';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';

const Header = ({ userName, children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('#mobile-menu') && !event.target.closest('#menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);
  
  return (
    <>
      {/* Spacer to prevent content jump when header becomes fixed */}
      <div className="h-20"></div>
      
      <header className={`bg-white fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'py-2 bg-white shadow-lg' : 'py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo - Left side */}
          <div className="flex items-center">
              <a href="https://bistecglobal.com/" target="_blank" rel="noopener noreferrer" className="flex items-center group">
                <img src="/Logo1.png" alt="BistecQuizz Logo" className="h-12 w-12 object-contain group-hover:scale-105 transition-transform duration-300" />
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-900 transition-all duration-300">BistecQuizz</span>
              </a>
            </div>
          
          {/* Desktop Navigation - Right side */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`flex items-center text-gray-700 hover:text-[#2563eb] transition-colors ${
                location.pathname === '/' ? 'text-[#2563eb] font-medium' : ''
              }`}
            >
              <HomeIcon className="mr-1" fontSize="small" />
              <span className="text-base">Home</span>
            </Link>
            <Link 
              to="/quizzes" 
              className={`flex items-center text-gray-700 hover:text-[#2563eb] transition-colors ${
                location.pathname.includes('/quizzes') ? 'text-[#2563eb] font-medium' : ''
              }`}
            >
              <QuizIcon className="mr-1" fontSize="small" />
              <span className="text-base">Quizzes</span>
            </Link>
            <div className="flex items-center">
              <Link 
                to="/profile" 
                className={`flex items-center text-gray-700 hover:text-[#2563eb] transition-colors ${
                  location.pathname.includes('/profile') ? 'text-[#2563eb] font-medium' : ''
                }`}
              >
                <PersonIcon className="mr-1" fontSize="small" />
                <span className="text-base">{userName ? userName : 'Profile'}</span>
              </Link>
              {children}
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex justify-center items-center h-full">
            <button 
              id="menu-button"
              className="p-2 rounded-lg text-gray-300 hover:text-[#2563eb] focus:outline-none flex items-center justify-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon fontSize="medium" />
              ) : (
                <MenuIcon fontSize="medium" />
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div 
          id="mobile-menu"
          className={`md:hidden bg-[#1e293b] shadow-lg ${mobileMenuOpen ? 'block' : 'hidden'}`}
        >
          <div className="px-4 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className={`block py-2 px-3 rounded-md ${
                location.pathname === '/' ? 'bg-[#2563eb] text-white' : 'text-gray-300 hover:bg-[#2563eb] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <HomeIcon className="mr-3" fontSize="small" />
                <span className="text-base">Home</span>
              </div>
            </Link>
            <Link 
              to="/quizzes" 
              className={`block py-2 px-3 rounded-md ${
                location.pathname.includes('/quizzes') ? 'bg-[#2563eb] text-white' : 'text-gray-300 hover:bg-[#2563eb] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <QuizIcon className="mr-3" fontSize="small" />
                <span className="text-base">Quizzes</span>
              </div>
            </Link>
            <div className="flex items-center py-2 px-3 rounded-md">
              <Link 
                to="/profile" 
                className={`flex items-center ${
                  location.pathname.includes('/profile') ? 'bg-[#2563eb] text-white' : 'text-gray-300 hover:bg-[#2563eb] hover:text-white'
                }`}
              >
                <PersonIcon className="mr-3" fontSize="small" />
                <span className="text-base">{userName ? userName : 'Profile'}</span>
              </Link>
              {children && <div className="ml-2">{children}</div>}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;