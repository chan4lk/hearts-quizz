import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ userName }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className={`text-2xl font-bold hover:text-blue-100 transition-colors ${
              !isHomePage ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            BistecQuizz
          </Link>
          
          {userName && (
            <div className="flex items-center">
              <span className="text-sm mr-2">Welcome,</span>
              <span className="font-semibold">{userName}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
