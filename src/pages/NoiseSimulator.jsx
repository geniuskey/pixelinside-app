import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Info } from 'lucide-react';

const NoiseSimulator = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState({
    shotNoise: true,
    thermalNoise: true,
    readNoise: true,
    fixedPatternNoise: true,
    iso: 100,
    temperature: 25,
    exposureTime: 1.0,
    signalLevel: 50
  });
  
  const [noiseStats, setNoiseStats] = useState({
    shotNoise: 0,
    thermalNoise: 0,
    readNoise: 0,
    totalNoise: 0,
    snr: 0
  });

  const [showInfo, setShowInfo] = useState(false);

  // 노이즈 계산 함수들
  const calculateShotNoise = (signal, iso) => {
    const photons = signal * (iso / 100);
    return Math.sqrt(photons) * 0.5;
  };

  const calculateThermalNoise = (temperature, exposureTime) => {
    const darkCurrent = 0.1 * Math.pow(2, (temperature - 25) / 7);
    return Math.sqrt(darkCurrent * exposureTime) * 0.3;
  };

  const calculateReadNoise = (iso) => {
    return 2 + (iso / 100) * 0.5;
  };

  const generateFixedPatternNoise = (width, height) => {
    const noise = [];
    for (let i = 0; i < width * height; i++) {
      noise.push((Math.random() - 0.5) * 2);
    }
    return noise;
  };

  const updateNoiseStats = () => {
    const shotNoise = settings.shotNoise ? calculateShotNoise(settings.signalLevel, settings.iso) : 0;
    const thermalNoise = settings.thermalNoise ? calculateThermalNoise(settings.temperature, settings.exposureTime) : 0;
    const readNoise = settings.readNoise ? calculateReadNoise(settings.iso) : 0;
    const totalNoise = Math.sqrt(shotNoise * shotNoise + thermalNoise * thermalNoise + readNoise * readNoise);
    const snr = settings.signalLevel / (totalNoise || 1);

    setNoiseStats({
      shotNoise: shotNoise.toFixed(2),
      thermalNoise: thermalNoise.toFixed(2),
      readNoise: readNoise.toFixed(2),
      totalNoise: totalNoise.toFixed(2),
      snr: snr.toFixed(1)
    });
  };

  const drawNoiseSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 기본 이미지 생성 (그라데이션)
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // 고정 패턴 노이즈 생성
    const fixedPattern = generateFixedPatternNoise(width, height);

    for (let i = 0; i < width * height; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      
      // 기본 신호 (그라데이션)
      let baseSignal = (x / width) * 255 * (settings.signalLevel / 100);
      
      // 각종 노이즈 추가
      let totalNoise = 0;
      
      if (settings.shotNoise) {
        const shotNoise = calculateShotNoise(baseSignal, settings.iso);
        totalNoise += (Math.random() - 0.5) * shotNoise * 2;
      }
      
      if (settings.thermalNoise) {
        const thermalNoise = calculateThermalNoise(settings.temperature, settings.exposureTime);
        totalNoise += (Math.random() - 0.5) * thermalNoise * 2;
      }
      
      if (settings.readNoise) {
        const readNoise = calculateReadNoise(settings.iso);
        totalNoise += (Math.random() - 0.5) * readNoise * 2;
      }
      
      if (settings.fixedPatternNoise) {
        totalNoise += fixedPattern[i] * 3;
      }
      
      // 최종 픽셀 값 계산
      let finalValue = baseSignal + totalNoise;
      finalValue = Math.max(0, Math.min(255, finalValue));
      
      const pixelIndex = i * 4;
      data[pixelIndex] = finalValue;     // R
      data[pixelIndex + 1] = finalValue; // G
      data[pixelIndex + 2] = finalValue; // B
      data[pixelIndex + 3] = 255;        // A
    }

    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    updateNoiseStats();
    drawNoiseSimulation();
  }, [settings]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        drawNoiseSimulation();
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, settings]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings({
      shotNoise: true,
      thermalNoise: true,
      readNoise: true,
      fixedPatternNoise: true,
      iso: 100,
      temperature: 25,
      exposureTime: 1.0,
      signalLevel: 50
    });
  };

  const NoiseInfoPanel = () => (
    <div className="bg-gray-800 p-4 rounded-lg text-sm space-y-2">
      <h3 className="font-semibold text-white mb-2">노이즈 종류 설명</h3>
      <div className="space-y-1 text-gray-300">
        <p><strong className="text-blue-400">Shot Noise (포아송 노이즈):</strong> 광자의 무작위적 도달로 인한 노이즈</p>
        <p><strong className="text-red-400">Thermal Noise (열 노이즈):</strong> 온도에 의한 dark current 노이즈</p>
        <p><strong className="text-green-400">Read Noise (읽기 노이즈):</strong> 신호 읽기 과정에서 발생하는 노이즈</p>
        <p><strong className="text-purple-400">Fixed Pattern Noise:</strong> 픽셀 간 특성 차이로 인한 고정 패턴 노이즈</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">이미지 센서 노이즈 시뮬레이터</h1>
          <p className="text-gray-300">다양한 노이즈 소스의 영향을 실시간으로 관찰하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 시뮬레이션 화면 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">노이즈 시뮬레이션</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {isRunning ? <Pause size={16} /> : <Play size={16} />}
                    <span>{isRunning ? '정지' : '시작'}</span>
                  </button>
                  <button
                    onClick={resetSettings}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                  >
                    <RotateCcw size={16} />
                    <span>리셋</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-black rounded-lg p-4 mb-4">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={300}
                  className="w-full h-auto border border-gray-600 rounded"
                />
              </div>

              {/* 노이즈 통계 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">노이즈 레벨</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-400">Shot Noise:</span>
                      <span className="text-white">{noiseStats.shotNoise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">Thermal Noise:</span>
                      <span className="text-white">{noiseStats.thermalNoise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">Read Noise:</span>
                      <span className="text-white">{noiseStats.readNoise}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-600 pt-1">
                      <span className="text-yellow-400 font-semibold">Total Noise:</span>
                      <span className="text-white font-semibold">{noiseStats.totalNoise}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-700 p-3 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">신호 품질</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Signal Level:</span>
                      <span className="text-white">{settings.signalLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">SNR:</span>
                      <span className="text-white">{noiseStats.snr} dB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 제어 패널 */}
          <div className="space-y-6">
            {/* 노이즈 소스 제어 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">노이즈 소스 제어</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400">Shot Noise</span>
                  <input
                    type="checkbox"
                    checked={settings.shotNoise}
                    onChange={(e) => handleSettingChange('shotNoise', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-400">Thermal Noise</span>
                  <input
                    type="checkbox"
                    checked={settings.thermalNoise}
                    onChange={(e) => handleSettingChange('thermalNoise', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-400">Read Noise</span>
                  <input
                    type="checkbox"
                    checked={settings.readNoise}
                    onChange={(e) => handleSettingChange('readNoise', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-purple-400">Fixed Pattern Noise</span>
                  <input
                    type="checkbox"
                    checked={settings.fixedPatternNoise}
                    onChange={(e) => handleSettingChange('fixedPatternNoise', e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>

            {/* 센서 설정 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">센서 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ISO: {settings.iso}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="6400"
                    step="50"
                    value={settings.iso}
                    onChange={(e) => handleSettingChange('iso', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>50</span>
                    <span>6400</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    온도: {settings.temperature}°C
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="60"
                    step="1"
                    value={settings.temperature}
                    onChange={(e) => handleSettingChange('temperature', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>-10°C</span>
                    <span>60°C</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    노출 시간: {settings.exposureTime}s
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={settings.exposureTime}
                    onChange={(e) => handleSettingChange('exposureTime', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.1s</span>
                    <span>10s</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    신호 레벨: {settings.signalLevel}%
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={settings.signalLevel}
                    onChange={(e) => handleSettingChange('signalLevel', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>1%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 정보 패널 */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">정보</h3>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="text-gray-400 hover:text-white"
                >
                  <Info size={20} />
                </button>
              </div>
              {showInfo && <NoiseInfoPanel />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoiseSimulator;