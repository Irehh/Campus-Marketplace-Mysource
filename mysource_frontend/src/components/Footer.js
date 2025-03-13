// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-secondary-200 py-6">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="text-primary font-bold text-xl">
              Campus Market
            </Link>
            <p className="text-secondary-500 text-sm mt-1">The marketplace for campus communities</p>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6 text-sm">
            <Link to="/products" className="text-secondary-600 hover:text-primary">
              Products
            </Link>
            <Link to="/businesses" className="text-secondary-600 hover:text-primary">
              Businesses
            </Link>
            <Link to="/terms" className="text-secondary-600 hover:text-primary">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-secondary-600 hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-secondary-500 text-xs">
          &copy; {new Date().getFullYear()} Campus Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;