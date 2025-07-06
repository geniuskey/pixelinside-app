import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Camera, Zap } from 'lucide-react';

const ADCSimulator = () => {
  const [bitDepth, setBitDepth] = useState(8);
  const [inputVoltage, setInputVoltage] = useState(2.5);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [showQuantization, setShowQuantization] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const maxVoltage = 3.3; // 3.3V reference
  const maxValue = Math.pow(2, bitDepth) - 1;
  const voltageStep = maxVoltage / maxValue;
  const digitalValue = Math.floor(inputVoltage / voltageStep);
  const quantizedVoltage = digitalValue * voltageStep;
  const quantizationError = inputVoltage - quantizedVoltage;

  const bitDepthOptions = [
    { value: 8, label: '8-bit', levels: 256 },
    { value: 10, label: '10-bit', levels: 1024 },
    { value: 12, label: '12-bit', levels: 4096 },
    { value: 14, label: '14-bit', levels: 16384 }
  ];

  // Animation logic
  useEffect(() => {
    if (isAnimating) {
      animationRef.current = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 4);
      }, 1000);
    } else {
      clearInterval(animationRef.current);
    }
    return () => clearInterval(animationRef.current);
  }, [isAnimating]);

  // Canvas drawing for quantization visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal lines (voltage levels)
    for (let i = 0; i <= maxValue; i += Math.max(1, Math.floor(maxValue / 16))) {
      const y = height - (i / maxValue) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines (time)
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw quantization levels
    if (showQuantization) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      
      for (let i = 0; i <= maxValue; i++) {
        const y = height - (i / maxValue) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Draw current voltage line
    const currentY = height - (inputVoltage / maxVoltage) * height;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();

    // Draw quantized voltage line
    const quantizedY = height - (quantizedVoltage / maxVoltage) * height;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, quantizedY);
    ctx.lineTo(width, quantizedY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '12px sans-serif';
    ctx.fillText(`입력: ${inputVoltage.toFixed(3)}V`, 10, currentY - 10);
    ctx.fillText(`양자화: ${quantizedVoltage.toFixed(3)}V`, 10, quantizedY + 20);

  }, [inputVoltage, bitDepth, showQuantization, maxValue, quantizedVoltage]);

  const getStepColor = (step) => {
    return animationStep >= step ? '#10b981' : '#d1d5db';
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setAnimationStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Camera className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">ADC 변환 과정 시뮬레이터</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            이미지 센서에서 아날로그 전압이 디지털 값으로 변환되는 과정을 시각적으로 학습하고,
            비트 깊이에 따른 양자화 노이즈의 차이를 비교해보세요.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Voltage Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                입력 전압 (V)
              </label>
              <input
                type="range"
                min="0"
                max={maxVoltage}
                step="0.01"
                value={inputVoltage}
                onChange={(e) => setInputVoltage(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0V</span>
                <span className="font-semibold">{inputVoltage.toFixed(3)}V</span>
                <span>{maxVoltage}V</span>
              </div>
            </div>

            {/* Bit Depth Control */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비트 깊이
              </label>
              <select
                value={bitDepth}
                onChange={(e) => setBitDepth(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {bitDepthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.levels} levels)
                  </option>
                ))}
              </select>
            </div>

            {/* Animation Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                애니메이션 제어
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAnimating(!isAnimating)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                  {isAnimating ? '일시정지' : '시작'}
                </button>
                <button
                  onClick={resetAnimation}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw size={16} />
                  리셋
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Process */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-500" size={20} />
              ADC 변환 단계
            </h3>
            
            <div className="space-y-4">
              {/* Step 1: Analog Input */}
              <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                animationStep >= 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    animationStep >= 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    1
                  </div>
                  <h4 className="font-semibold">아날로그 입력</h4>
                </div>
                <p className="text-sm text-gray-600 ml-9">
                  포토다이오드에서 생성된 전압: <span className="font-mono font-bold">{inputVoltage.toFixed(3)}V</span>
                </p>
              </div>

              {/* Step 2: Sampling */}
              <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                animationStep >= 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    animationStep >= 1 ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    2
                  </div>
                  <h4 className="font-semibold">샘플링</h4>
                </div>
                <p className="text-sm text-gray-600 ml-9">
                  특정 시점의 전압 값을 캡처하여 유지
                </p>
              </div>

              {/* Step 3: Quantization */}
              <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                animationStep >= 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    animationStep >= 2 ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    3
                  </div>
                  <h4 className="font-semibold">양자화</h4>
                </div>
                <p className="text-sm text-gray-600 ml-9">
                  가장 가까운 디지털 레벨로 근사: <span className="font-mono font-bold">{quantizedVoltage.toFixed(3)}V</span>
                </p>
                <p className="text-xs text-red-600 ml-9 mt-1">
                  양자화 오차: <span className="font-mono font-bold">{(quantizationError * 1000).toFixed(1)}mV</span>
                </p>
              </div>

              {/* Step 4: Digital Output */}
              <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                animationStep >= 3 ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    animationStep >= 3 ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    4
                  </div>
                  <h4 className="font-semibold">디지털 출력</h4>
                </div>
                <p className="text-sm text-gray-600 ml-9">
                  최종 디지털 값: <span className="font-mono font-bold">{digitalValue}</span> / {maxValue}
                </p>
                <p className="text-xs text-blue-600 ml-9 mt-1">
                  이진수: <span className="font-mono font-bold">{digitalValue.toString(2).padStart(bitDepth, '0')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quantization Visualization */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">양자화 시각화</h3>
            
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showQuantization}
                  onChange={(e) => setShowQuantization(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">양자화 레벨 표시</span>
              </label>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={300}
                className="w-full h-auto border rounded"
              />
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500"></div>
                <span className="text-sm">입력 전압</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 border-dashed border"></div>
                <span className="text-sm">양자화된 전압</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span className="text-sm">양자화 레벨</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">비트 깊이별 성능 비교</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left">비트 깊이</th>
                  <th className="border p-3 text-left">양자화 레벨</th>
                  <th className="border p-3 text-left">전압 분해능</th>
                  <th className="border p-3 text-left">이론적 SNR</th>
                  <th className="border p-3 text-left">동적 범위</th>
                </tr>
              </thead>
              <tbody>
                {bitDepthOptions.map(option => {
                  const resolution = (maxVoltage / (option.levels - 1) * 1000).toFixed(1);
                  const snr = (6.02 * option.value + 1.76).toFixed(1);
                  const dynamicRange = (option.value * 6.02).toFixed(1);
                  const isSelected = option.value === bitDepth;
                  
                  return (
                    <tr key={option.value} className={isSelected ? 'bg-blue-50' : ''}>
                      <td className={`border p-3 ${isSelected ? 'font-bold' : ''}`}>
                        {option.label}
                      </td>
                      <td className="border p-3">{option.levels.toLocaleString()}</td>
                      <td className="border p-3">{resolution}mV</td>
                      <td className="border p-3">{snr}dB</td>
                      <td className="border p-3">{dynamicRange}dB</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Technical Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">기술적 개념</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">양자화 노이즈</h4>
              <p className="text-sm text-gray-600 mb-2">
                연속적인 아날로그 신호를 이산적인 디지털 값으로 변환할 때 발생하는 오차입니다.
              </p>
              <p className="text-sm text-gray-600">
                현재 양자화 오차: <span className="font-mono font-bold">{(quantizationError * 1000).toFixed(1)}mV</span>
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 text-blue-600">비트 깊이의 영향</h4>
              <p className="text-sm text-gray-600 mb-2">
                비트 깊이가 높을수록 더 정밀한 디지털 변환이 가능하지만, 
                데이터 처리량과 비용이 증가합니다.
              </p>
              <p className="text-sm text-gray-600">
                각 비트 증가시 SNR은 약 6dB 향상됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ADCSimulator;