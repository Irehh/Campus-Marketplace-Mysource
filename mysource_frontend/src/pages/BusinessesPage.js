import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import BusinessCard from '../components/BusinessCard';
import CampusSelector from '../components/CampusSelector';
import Select from 'react-select';
import { BUSINESS_CATEGORIES } from '../config';

const BusinessesPage = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [campus, setCampus] = useState(user?.campus || '');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBusinesses = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/businesses', {
        params: { campus, category },
      });
      setBusinesses(response.data.businesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
    setLoading(false);
  }, [campus, category]);

  useEffect(() => {
    fetchBusinesses();
  }, [campus, category]); // Removed fetchBusinesses from dependency array

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <div className="flex space-x-4">
          {!user && <CampusSelector onChange={setCampus} />}
          <Select
            options={BUSINESS_CATEGORIES}
            onChange={(selectedOption) => setCategory(selectedOption.value)}
            placeholder="Category"
            className="w-48"
            classNamePrefix="react-select"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessesPage;