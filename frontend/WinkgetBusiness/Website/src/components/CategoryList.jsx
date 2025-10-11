import React from 'react';
import { useNavigate } from 'react-router-dom';
import { mainCategories } from '../utils/categories';

const CategoryList = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/businesses/${category.slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Businesses by Category</h1>
          <p className="text-gray-600">Discover local businesses in your area</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainCategories.map((category) => (
            <div
              key={category.slug}
              onClick={() => handleCategoryClick(category)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer p-6 border border-gray-200 hover:border-blue-300"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {category.name.charAt(0)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  Explore businesses in {category.name.toLowerCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryList;
