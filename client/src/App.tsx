import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddEditSubscription from './pages/AddEditSubscription';

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/subscriptions/new" element={<AddEditSubscription />} />
      <Route path="/subscriptions/:id/edit" element={<AddEditSubscription />} />
    </Routes>
  </BrowserRouter>
);

export default App;
