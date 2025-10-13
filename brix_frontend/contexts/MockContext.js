// mock 토큰 저장소 
import React, { createContext, useState, useContext } from 'react';

const MockContext = createContext();

export const MockProvider = ({ children }) => {
  const [useMock, setUseMock] = useState(false); // false: 실제 API

  return (
    <MockContext.Provider value={{ useMock, setUseMock }}>
      {children}
    </MockContext.Provider>
  );
};

export const useMockContext = () => useContext(MockContext);
