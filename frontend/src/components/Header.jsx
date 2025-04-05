import React from 'react';

function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        {/* Logo */}
        <div className="flex items-center space-x-2">
             {/* Placeholder for Logo image */}
             {/* <img src="/path/to/logo.png" alt="Logo" className="h-8 w-auto" /> */}
             <span className="text-xl font-semibold text-gray-700">Agregador</span>
             <span className="text-xl font-normal text-blue-600">Notícias</span>
        </div>

        {/* Search Bar Placeholder */}
        <div className="flex-1 px-4 lg:px-16">
            <input
                type="text"
                placeholder="Pesquisar..."
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
        </div>

        {/* Right Icons Placeholder */}
        <div className="flex items-center space-x-4">
            {/* Placeholder for icons like Apps, Settings, User */}
            <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </header>
  );
}
export default Header;