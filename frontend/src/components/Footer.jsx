import React from 'react';

function Footer() {
  return (
    <footer className="py-4 md:py-6 lg:py-8 text-center text-gray-500 flex flex-col md:flex-row items-center justify-center md:justify-between px-4 md:px-8 lg:px-12 border-t border-gray-200 bg-blue-100 backdrop-blur-sm">
      <div className="flex items-center mb-3 md:mb-0">
        <svg className="h-4 w-4 md:h-5 md:w-5 mr-2 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
        <p className="text-sm md:text-base font-medium">© {new Date().getFullYear()} BistecQuizz</p>
      </div>
      
      <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 text-xs md:text-sm">
        <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a>
        <a href="#" className="hover:text-blue-600 transition-colors">Help Center</a>
      </div>
    </footer>
  );
}

export default Footer;