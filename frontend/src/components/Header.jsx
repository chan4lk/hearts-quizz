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
      
      <header className={`bg-blue-100 fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'py-2 bg-blue-100 backdrop-blur-sm' : 'py-4'
      }`}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-16 flex justify-between items-center">
          {/* Logo - Left side */}
          <div className="flex items-center">
            <Link
              to="/"
              className={`text-2xl font-bold hover:text-blue-500 transition-colors flex items-center ${
                !isHomePage ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                Q
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">BistecQuizz</span>
            </Link>
          </div>
          
          {/* Desktop Navigation - Right side */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`flex items-center text-gray-700 hover:text-blue-500 ${
                location.pathname === '/' ? 'text-blue-500 font-medium' : ''
              }`}
            >
              <HomeIcon className="mr-1" fontSize="small" />
              <span>Home</span>
            </Link>
            <Link 
              to="/quizzes" 
              className={`flex items-center text-gray-700 hover:text-blue-500 ${
                location.pathname.includes('/quizzes') ? 'text-blue-500 font-medium' : ''
              }`}
            >
              <QuizIcon className="mr-1" fontSize="small" />
              <span>Quizzes</span>
            </Link>
            <div className="flex items-center">
              <Link 
                to="/profile" 
                className={`flex items-center text-gray-700 hover:text-blue-500 ${
                  location.pathname.includes('/profile') ? 'text-blue-500 font-medium' : ''
                }`}
              >
                <PersonIcon className="mr-1" fontSize="small" />
                <span>{userName ? userName : 'Profile'}</span>
              </Link>
              {children}
            </div>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex justify-center items-center h-full">
            <button 
              id="menu-button"
              className="p-2 rounded-lg text-gray-700 hover:bg-blue-200 focus:outline-none flex items-center justify-center"
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
          className={`md:hidden bg-blue-100 shadow-lg ${mobileMenuOpen ? 'block' : 'hidden'}`}
        >
          <div className="px-4 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className={`block py-2 px-3 rounded-md ${
                location.pathname === '/' ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center">
                <HomeIcon className="mr-3" fontSize="small" />
                <span>Home</span>
              </div>
            </Link>
            <Link 
              to="/quizzes" 
              className={`block py-2 px-3 rounded-md ${
                location.pathname.includes('/quizzes') ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center">
                <QuizIcon className="mr-3" fontSize="small" />
                <span>Quizzes</span>
              </div>
            </Link>
            <div className="flex items-center py-2 px-3 rounded-md">
              <Link 
                to="/profile" 
                className={`flex items-center ${
                  location.pathname.includes('/profile') ? 'bg-blue-100 text-blue-600' : 'text-gray-700 hover:bg-blue-50'
                }`}
              >
                <PersonIcon className="mr-3" fontSize="small" />
                <span>{userName ? userName : 'Profile'}</span>
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