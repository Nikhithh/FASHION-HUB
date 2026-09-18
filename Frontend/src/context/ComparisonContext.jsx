import React, { createContext, useContext, useState } from 'react';

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [selected, setSelected] = useState([]); // array of product objects

  const addProduct = (product) => {
    if (selected.length >= 4) {
      return { success: false, message: 'Maximum 4 products can be compared' };
    }
    if (selected.find(p => p._id === product._id)) {
      return { success: false, message: 'Product already selected for comparison' };
    }
    setSelected(prev => [...prev, product]);
    return { success: true };
  };

  const removeProduct = (id) => {
    setSelected(prev => prev.filter(p => p._id !== id));
  };

  const clearComparison = () => setSelected([]);

  return (
    <ComparisonContext.Provider value={{ selected, addProduct, removeProduct, clearComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => useContext(ComparisonContext);
