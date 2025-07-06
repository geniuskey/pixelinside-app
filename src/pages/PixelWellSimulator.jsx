import React, { useState, useEffect } from 'react';
import { Lightbulb, Clock, Zap, Thermometer } from 'lucide-react';

const PixelWellSimulator = () => {
  const [lightIntensity, setLightIntensity] = useState(1000); // lux
  const [exposureTime, setExposureTime] = useState(100);
  const [wellCapacity, setWellCapacity] = useState(10000);
  const [colorTemperature, setColorTemperature] = useState(5500); // Kelvin
  const [pixelCharges, setPixelCharges] = useState({ R: 0, G1: 0, G2: 0, B: 0 });
  const [pixelBlooming, setPixelBlooming] = useState({ R: false, G1: false, G2: false, B: false });
  const [electrons, setElectrons] = useState({ R: [], G1: [], G2: [], B: [] });

  // Color temperature to RGB conversion (simplified blackbody radiation)
  const colorTempToRGB = (temp) => {
    temp = temp / 100;
    
    let red, green, blue;
    
    if (temp <= 66) {
      red = 255;
    } else {
      red = temp - 60;
      red = 329.698727446 * Math.pow(red, -0.1332047592);
      red = Math.max(0, Math.min(255, red));
    }
    
    if (temp <= 66) {
      green = temp;
      green = 99.4708025861 * Math.log(green) - 161.1195681661;
    } else {
      green = temp - 60;
      green = 288.1221695283 * Math.pow(green, -0.0755148492);
    }
    green = Math.max(0, Math.min(255, green));
    
    if (temp >= 66) {
      blue = 255;
    } else if (temp <= 19) {
      blue = 0;
    } else {
      blue = temp - 10;
      blue = 138.5177312231 * Math.log(blue) - 305.0447927307;
      blue = Math.max(0, Math.min(255, blue));
    }
    
    return { red: red / 255, green: green / 255, blue: blue / 255 };
  };

  useEffect(() => {
    const rgbResponse = colorTempToRGB(colorTemperature);
    
    // Calculate charge for each color channel based on color temperature
    const baseCharge = lightIntensity * 0.1 * exposureTime;
    
    const charges = {
      R: baseCharge * rgbResponse.red * 0.299, // Red sensitivity
      G1: baseCharge * rgbResponse.green * 0.587, // Green sensitivity (higher)
      G2: baseCharge * rgbResponse.green * 0.587, // Green sensitivity (higher)
      B: baseCharge * rgbResponse.blue * 0.114 // Blue sensitivity
    };
    
    // Check for blooming and calculate overflow
    const blooming = {};
    const finalCharges = { ...charges };
    
    Object.keys(charges).forEach(channel => {
      blooming[channel] = charges[channel] > wellCapacity;
      if (blooming[channel]) {
        finalCharges[channel] = Math.min(charges[channel], wellCapacity * 1.2);
      }
    });
    
    // Simulate overflow to adjacent pixels in Bayer pattern
    if (blooming.G1 || blooming.G2) {
      const overflowG1 = Math.max(0, charges.G1 - wellCapacity);
      const overflowG2 = Math.max(0, charges.G2 - wellCapacity);
      
      // Green pixels overflow to adjacent R and B pixels
      finalCharges.R += (overflowG1 + overflowG2) * 0.15;
      finalCharges.B += (overflowG1 + overflowG2) * 0.15;
      
      blooming.R = blooming.R || finalCharges.R > wellCapacity;
      blooming.B = blooming.B || finalCharges.B > wellCapacity;
    }
    
    setPixelCharges(finalCharges);
    setPixelBlooming(blooming);
    
    // Generate electron animations
    const newElectrons = {};
    Object.keys(finalCharges).forEach(channel => {
      const electronCount = Math.min(Math.floor(finalCharges[channel] / 200), 15);
      newElectrons[channel] = Array.from({ length: electronCount }, (_, i) => ({
        id: i,
        x: 25 + (Math.random() * 50),
        y: 25 + (Math.random() * 50),
        opacity: Math.random() * 0.5 + 0.5,
        size: Math.random() * 1.5 + 0.5,
      }));
    });
    setElectrons(newElectrons);
  }, [lightIntensity, exposureTime, wellCapacity, colorTemperature]);

  const getPixelColor = (channel, charge, isBlooming) => {
    const intensity = Math.min(charge / wellCapacity, 1);
    
    if (isBlooming) {
      return 'bg-gradient-to-t from-red-500 to-orange-400';
    }
    
    switch (channel) {
      case 'R':
        return intensity > 0 ? `bg-gradient-to-t from-red-600 to-red-400` : 'bg-gray-800';
      case 'G1':
      case 'G2':
        return intensity > 0 ? `bg-gradient-to-t from-green-600 to-green-400` : 'bg-gray-800';
      case 'B':
        return intensity > 0 ? `bg-gradient-to-t from-blue-600 to-blue-400` : 'bg-gray-800';
      default:
        return 'bg-gray-800';
    }
  };

  const getBorderColor = (channel) => {
    switch (channel) {
      case 'R': return 'border-red-500';
      case 'G1':
      case 'G2': return 'border-green-500';
      case 'B': return 'border-blue-500';
      default: return 'border-gray-500';
    }
  };

  const bayerPattern = [
    { channel: 'R', position: 'top-left' },
    { channel: 'G1', position: 'top-right' },
    { channel: 'G2', position: 'bottom-left' },
    { channel: 'B', position: 'bottom-right' }
  ];

  const rgbResponse = colorTempToRGB(colorTemperature);

  return (
    <div className="w-full px-6 bg-gray-900 text-white min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-blue-400">Bayer Pattern 픽셀 웰 시뮬레이터</h1>
        <p className="text-gray-300">색온도에 따른 RGB 응답 차이와 blooming 현상을 시뮬레이션</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Lightbulb className="mr-2 text-yellow-400" size={20} />
            <label className="text-sm font-medium">광 강도 (조도)</label>
          </div>
          <input
            type="range"
            min="0"
            max="15000"
            step="100"
            value={lightIntensity}
            onChange={(e) => setLightIntensity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-400 mt-1">{lightIntensity.toLocaleString()} lux</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Clock className="mr-2 text-green-400" size={20} />
            <label className="text-sm font-medium">노출 시간</label>
          </div>
          <input
            type="range"
            min="50"
            max="500"
            value={exposureTime}
            onChange={(e) => setExposureTime(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-400 mt-1">{exposureTime}ms</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Zap className="mr-2 text-purple-400" size={20} />
            <label className="text-sm font-medium">웰 용량</label>
          </div>
          <input
            type="range"
            min="2000"
            max="20000"
            step="1000"
            value={wellCapacity}
            onChange={(e) => setWellCapacity(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-400 mt-1">{wellCapacity.toLocaleString()} e⁻</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Thermometer className="mr-2 text-orange-400" size={20} />
            <label className="text-sm font-medium">색온도</label>
          </div>
          <input
            type="range"
            min="2000"
            max="10000"
            step="100"
            value={colorTemperature}
            onChange={(e) => setColorTemperature(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-xs text-gray-400 mt-1">{colorTemperature}K</div>
        </div>
      </div>

      {/* Color Temperature Preview */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3 text-center">색온도 응답 특성</h3>
        <div className="flex justify-center items-center gap-6">
          <div 
            className="w-20 h-20 rounded-lg border-2 border-white"
            style={{
              backgroundColor: `rgb(${rgbResponse.red * 255}, ${rgbResponse.green * 255}, ${rgbResponse.blue * 255})`
            }}
          />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-red-400 font-bold">Red</div>
              <div className="text-sm">{(rgbResponse.red * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-green-400 font-bold">Green</div>
              <div className="text-sm">{(rgbResponse.green * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-blue-400 font-bold">Blue</div>
              <div className="text-sm">{(rgbResponse.blue * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bayer Pattern Visualization */}
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Bayer Pattern 2x2 배열</h2>
        
        <div className="flex justify-center mb-6">
          <div className="grid grid-cols-2 gap-3 p-6 bg-gray-700 rounded-lg">
            {bayerPattern.map(({ channel, position }) => {
              const charge = pixelCharges[channel];
              const isBlooming = pixelBlooming[channel];
              const percentage = Math.min((charge / wellCapacity) * 100, 100);
              
              return (
                <div key={`${channel}-${position}`} className="relative w-32 h-32">
                  {/* Pixel Well Container */}
                  <div className={`absolute inset-0 border-2 rounded-lg ${getBorderColor(channel)} bg-gray-800 overflow-hidden`}>
                    
                    {/* Charge Fill */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${getPixelColor(channel, charge, isBlooming)}`}
                      style={{ height: `${percentage}%` }}
                    />
                    
                    {/* Blooming Effect */}
                    {isBlooming && (
                      <div className="absolute -inset-1 bg-red-500 opacity-25 rounded-lg animate-pulse" />
                    )}
                    
                    {/* Electrons */}
                    {electrons[channel]?.map((electron) => (
                      <div
                        key={electron.id}
                        className="absolute bg-yellow-300 rounded-full animate-pulse"
                        style={{
                          left: `${electron.x}%`,
                          top: `${electron.y}%`,
                          opacity: electron.opacity,
                          width: `${electron.size}px`,
                          height: `${electron.size}px`,
                        }}
                      />
                    ))}
                    
                    {/* Well Capacity Line */}
                    <div className="absolute left-0 right-0 border-t-2 border-white border-dashed opacity-40" style={{ top: '0%' }} />
                  </div>
                  
                  {/* Channel Label */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-center">
                    <div className={`text-lg font-bold ${
                      channel === 'R' ? 'text-red-400' : 
                      channel.startsWith('G') ? 'text-green-400' : 'text-blue-400'
                    }`}>
                      {channel}
                    </div>
                  </div>
                  
                  {/* Charge Amount Display */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-white font-medium text-sm">{charge.toFixed(0)} e⁻</div>
                    <div className="text-xs text-gray-400">{percentage.toFixed(1)}%</div>
                  </div>
                  
                  {/* Overflow Animation from Green pixels */}
                  {(pixelBlooming.G1 || pixelBlooming.G2) && (channel === 'R' || channel === 'B') && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
                      <div className="w-1 h-1 bg-green-300 rounded-full animate-ping absolute" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {bayerPattern.map(({ channel }) => (
            <div key={channel} className="bg-gray-700 p-3 rounded">
              <div className="text-xs text-gray-400">{channel} 픽셀</div>
              <div className={`text-lg font-bold ${
                channel === 'R' ? 'text-red-400' : 
                channel.startsWith('G') ? 'text-green-400' : 'text-blue-400'
              }`}>
                {pixelCharges[channel].toFixed(0)} e⁻
              </div>
              <div className={`text-xs ${pixelBlooming[channel] ? 'text-red-400' : 'text-green-400'}`}>
                {pixelBlooming[channel] ? 'Blooming' : 'Normal'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">주요 개념</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-cyan-400 mb-2">Bayer Pattern</h4>
            <p className="text-gray-300">RGGB 2x2 배열로 구성된 컬러 필터 패턴입니다. Green 픽셀이 2개인 이유는 인간의 눈이 녹색에 가장 민감하기 때문입니다.</p>
          </div>
          <div>
            <h4 className="font-medium text-cyan-400 mb-2">색온도 응답</h4>
            <p className="text-gray-300">흑체복사에 따라 색온도가 낮으면 적색이, 높으면 청색이 강해집니다. 각 픽셀의 응답도 이에 따라 달라집니다.</p>
          </div>
          <div>
            <h4 className="font-medium text-cyan-400 mb-2">Cross-talk Blooming</h4>
            <p className="text-gray-300">Green 픽셀이 포화되면 과잉 전하가 인접한 Red, Blue 픽셀로 누설되어 색상 왜곡을 일으킵니다.</p>
          </div>
          <div>
            <h4 className="font-medium text-cyan-400 mb-2">실제 적용</h4>
            <p className="text-gray-300">햇빛(5500K)에서는 균형잡힌 응답을, 백열등(3000K)에서는 적색 편향을, LED(6500K)에서는 청색 편향을 보입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixelWellSimulator;