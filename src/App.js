import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PixelWellSimulator from './pages/PixelWellSimulator';
import PDSimulator from './pages/PDSimulator';
import BayerPatternSimulator from './pages/BayerPatternSimulator';
import NoiseSimulator from './pages/NoiseSimulator';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div>
        {/* ✅ 상단 네비게이션 */}
        <nav className="bg-blue-700 text-white px-4 py-2 flex space-x-4 relative z-50">
          <Link to="/" className="px-4 py-2 hover:underline">Home</Link>
          <div className="relative group px-4">
            <span className="cursor-pointer">Pixel ⬇</span>
            <div className="absolute hidden group-hover:block bg-teal-500 mt-2 rounded shadow-md z-10">
              <Link to="/pd-simulator" className="block px-4 py-2 hover:bg-teal-600">Photo Diode</Link>
              <Link to="/pixel-well" className="block px-4 py-2 hover:bg-teal-600">Pixel Well</Link>
              <Link to="/bayer-pattern" className="block px-4 py-2 hover:bg-teal-600">Bayer Pattern</Link>
              <Link to="/noise-simulator" className="block px-4 py-2 hover:bg-teal-600">Noise Simulator</Link>
            </div>
          </div>
          <div className="relative group px-4">
            <span className="cursor-pointer">Optics ⬇</span>
            {/* Add more sub links here */}
          </div>
          <div className="relative group px-4">
            <span className="cursor-pointer">Device ⬇</span>
            {/* Add more sub links here */}
          </div>
          <Link to="/blog" className="px-4 hover:underline">Blog</Link>
          <Link to="/contact" className="px-4 hover:underline">Contact</Link>
        </nav>

        {/* ✅ 페이지 본문 라우팅 */}
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pixel-well" element={<PixelWellSimulator />} />
            <Route path="/pd-simulator" element={<PDSimulator />} />
            <Route path="/bayer-pattern" element={<BayerPatternSimulator />} />
            <Route path="/noise-simulator" element={<NoiseSimulator />} />
            {/* Add more routes here */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
