import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';
import CampusSelector from '../components/CampusSelector';
import Select from 'react-select';
import { PRODUCT_CATEGORIES } from '../config';

const ProductsPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [campus, setCampus] = useState(user?.campus || '');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/products', {
        params: { campus, category },
      });
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    setLoading(false);
  }, [campus, category]);

  useEffect(() => {
    fetchProducts();
  }, [campus, category]); // Removed fetchProducts from dependency array

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex space-x-4">
          {!user && <CampusSelector onChange={setCampus} />}
          <Select
            options={PRODUCT_CATEGORIES}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;