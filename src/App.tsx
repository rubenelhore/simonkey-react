import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Pricing from './pages/Pricing';

const App: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <Header />
            <Hero />
            <Features />
            <HowItWorks />
            <CTA />
            <Footer />
          </div>
        }
      />
      <Route path="/pricing" element={<Pricing />} />
    </Routes>
  );
};

export default App;