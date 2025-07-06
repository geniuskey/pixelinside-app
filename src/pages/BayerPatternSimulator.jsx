import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff } from 'lucide-react';

const BayerPatternSimulator = () => {
  const canvasRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState('gradient');
  const [viewMode, setViewMode] = useState('original');
  const [demosaicAlgorithm, setDemosaicAlgorithm] = useState('bilinear');
  const [showBayerGrid, setShowBayerGrid] = useState(true);
  const [pixelSize, setPixelSize] = useState(8);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // 샘플 이미지 생성
  const generateSampleImage = (type, width = 64, height = 64) => {
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        switch (type) {
          case 'gradient':
            data[idx] = (x / width) * 255;     // R
            data[idx + 1] = (y / height) * 255; // G
            data[idx + 2] = 128;                // B
            break;
          case 'checker':
            const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2;
            data[idx] = checker * 255;
            data[idx + 1] = (1 - checker) * 255;
            data[idx + 2] = checker * 128;
            break;
          case 'sunset':
            const centerX = width / 2;
            const centerY = height / 2;
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
            const factor = 1 - (dist / maxDist);
            data[idx] = Math.max(0, 255 * factor);
            data[idx + 1] = Math.max(0, 128 * factor);
            data[idx + 2] = Math.max(0, 64 * factor);
            break;
        }
        data[idx + 3] = 255; // Alpha
      }
    }
    return imageData;
  };

  // Bayer 패턴 적용
  const applyBayerPattern = (imageData) => {
    const width = imageData.width;
    const height = imageData.height;
    const rawData = new ImageData(width, height);
    const data = imageData.data;
    const raw = rawData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Bayer pattern: RGGB
        if (y % 2 === 0) {
          if (x % 2 === 0) {
            // Red pixel
            raw[idx] = data[idx];
            raw[idx + 1] = 0;
            raw[idx + 2] = 0;
          } else {
            // Green pixel
            raw[idx] = 0;
            raw[idx + 1] = data[idx + 1];
            raw[idx + 2] = 0;
          }
        } else {
          if (x % 2 === 0) {
            // Green pixel
            raw[idx] = 0;
            raw[idx + 1] = data[idx + 1];
            raw[idx + 2] = 0;
          } else {
            // Blue pixel
            raw[idx] = 0;
            raw[idx + 1] = 0;
            raw[idx + 2] = data[idx + 2];
          }
        }
        raw[idx + 3] = 255;
      }
    }
    return rawData;
  };

  // 단순 Bilinear Demosaicing
  const bilinearDemosaic = (rawData) => {
    const width = rawData.width;
    const height = rawData.height;
    const demosaiced = new ImageData(width, height);
    const raw = rawData.data;
    const result = demosaiced.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // 현재 픽셀의 Bayer 패턴 위치 확인
        const isRed = (y % 2 === 0) && (x % 2 === 0);
        const isGreen = ((y % 2 === 0) && (x % 2 === 1)) || ((y % 2 === 1) && (x % 2 === 0));
        const isBlue = (y % 2 === 1) && (x % 2 === 1);

        let r = 0, g = 0, b = 0;

        if (isRed) {
          r = raw[idx];
          // Green 보간
          let gSum = 0, gCount = 0;
          if (x > 0) { gSum += raw[idx - 4 + 1]; gCount++; }
          if (x < width - 1) { gSum += raw[idx + 4 + 1]; gCount++; }
          if (y > 0) { gSum += raw[((y - 1) * width + x) * 4 + 1]; gCount++; }
          if (y < height - 1) { gSum += raw[((y + 1) * width + x) * 4 + 1]; gCount++; }
          g = gCount > 0 ? gSum / gCount : 0;
          
          // Blue 보간
          let bSum = 0, bCount = 0;
          if (x > 0 && y > 0) { bSum += raw[((y - 1) * width + x - 1) * 4 + 2]; bCount++; }
          if (x < width - 1 && y > 0) { bSum += raw[((y - 1) * width + x + 1) * 4 + 2]; bCount++; }
          if (x > 0 && y < height - 1) { bSum += raw[((y + 1) * width + x - 1) * 4 + 2]; bCount++; }
          if (x < width - 1 && y < height - 1) { bSum += raw[((y + 1) * width + x + 1) * 4 + 2]; bCount++; }
          b = bCount > 0 ? bSum / bCount : 0;
        } else if (isGreen) {
          g = raw[idx + 1];
          // Red와 Blue 보간
          let rSum = 0, rCount = 0, bSum = 0, bCount = 0;
          
          if (y % 2 === 0) { // 홀수 행의 Green (Red 행)
            if (x > 0) { rSum += raw[idx - 4]; rCount++; }
            if (x < width - 1) { rSum += raw[idx + 4]; rCount++; }
            if (y > 0) { bSum += raw[((y - 1) * width + x) * 4 + 2]; bCount++; }
            if (y < height - 1) { bSum += raw[((y + 1) * width + x) * 4 + 2]; bCount++; }
          } else { // 짝수 행의 Green (Blue 행)
            if (y > 0) { rSum += raw[((y - 1) * width + x) * 4]; rCount++; }
            if (y < height - 1) { rSum += raw[((y + 1) * width + x) * 4]; rCount++; }
            if (x > 0) { bSum += raw[idx - 4 + 2]; bCount++; }
            if (x < width - 1) { bSum += raw[idx + 4 + 2]; bCount++; }
          }
          
          r = rCount > 0 ? rSum / rCount : 0;
          b = bCount > 0 ? bSum / bCount : 0;
        } else if (isBlue) {
          b = raw[idx + 2];
          // Green 보간
          let gSum = 0, gCount = 0;
          if (x > 0) { gSum += raw[idx - 4 + 1]; gCount++; }
          if (x < width - 1) { gSum += raw[idx + 4 + 1]; gCount++; }
          if (y > 0) { gSum += raw[((y - 1) * width + x) * 4 + 1]; gCount++; }
          if (y < height - 1) { gSum += raw[((y + 1) * width + x) * 4 + 1]; gCount++; }
          g = gCount > 0 ? gSum / gCount : 0;
          
          // Red 보간
          let rSum = 0, rCount = 0;
          if (x > 0 && y > 0) { rSum += raw[((y - 1) * width + x - 1) * 4]; rCount++; }
          if (x < width - 1 && y > 0) { rSum += raw[((y - 1) * width + x + 1) * 4]; rCount++; }
          if (x > 0 && y < height - 1) { rSum += raw[((y + 1) * width + x - 1) * 4]; rCount++; }
          if (x < width - 1 && y < height - 1) { rSum += raw[((y + 1) * width + x + 1) * 4]; rCount++; }
          r = rCount > 0 ? rSum / rCount : 0;
        }

        result[idx] = Math.min(255, Math.max(0, r));
        result[idx + 1] = Math.min(255, Math.max(0, g));
        result[idx + 2] = Math.min(255, Math.max(0, b));
        result[idx + 3] = 255;
      }
    }
    return demosaiced;
  };

  // 최근접 이웃 Demosaicing
  const nearestNeighborDemosaic = (rawData) => {
    const width = rawData.width;
    const height = rawData.height;
    const demosaiced = new ImageData(width, height);
    const raw = rawData.data;
    const result = demosaiced.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        const isRed = (y % 2 === 0) && (x % 2 === 0);
        const isGreen = ((y % 2 === 0) && (x % 2 === 1)) || ((y % 2 === 1) && (x % 2 === 0));
        const isBlue = (y % 2 === 1) && (x % 2 === 1);

        let r = 0, g = 0, b = 0;

        if (isRed) {
          r = raw[idx];
          // 가장 가까운 Green 픽셀 찾기
          if (x > 0) g = raw[idx - 4 + 1];
          else if (x < width - 1) g = raw[idx + 4 + 1];
          // 가장 가까운 Blue 픽셀 찾기
          if (x > 0 && y > 0) b = raw[((y - 1) * width + x - 1) * 4 + 2];
          else if (x < width - 1 && y < height - 1) b = raw[((y + 1) * width + x + 1) * 4 + 2];
        } else if (isGreen) {
          g = raw[idx + 1];
          // 가장 가까운 Red와 Blue 픽셀 찾기
          if (y % 2 === 0) {
            if (x > 0) r = raw[idx - 4];
            else if (x < width - 1) r = raw[idx + 4];
            if (y < height - 1) b = raw[((y + 1) * width + x) * 4 + 2];
            else if (y > 0) b = raw[((y - 1) * width + x) * 4 + 2];
          } else {
            if (y > 0) r = raw[((y - 1) * width + x) * 4];
            else if (y < height - 1) r = raw[((y + 1) * width + x) * 4];
            if (x > 0) b = raw[idx - 4 + 2];
            else if (x < width - 1) b = raw[idx + 4 + 2];
          }
        } else if (isBlue) {
          b = raw[idx + 2];
          // 가장 가까운 Green 픽셀 찾기
          if (x > 0) g = raw[idx - 4 + 1];
          else if (x < width - 1) g = raw[idx + 4 + 1];
          // 가장 가까운 Red 픽셀 찾기
          if (x > 0 && y > 0) r = raw[((y - 1) * width + x - 1) * 4];
          else if (x < width - 1 && y < height - 1) r = raw[((y + 1) * width + x + 1) * 4];
        }

        result[idx] = Math.min(255, Math.max(0, r));
        result[idx + 1] = Math.min(255, Math.max(0, g));
        result[idx + 2] = Math.min(255, Math.max(0, b));
        result[idx + 3] = 255;
      }
    }
    return demosaiced;
  };

  // 채널별 분리 표시
  const separateChannels = (rawData) => {
    const width = rawData.width;
    const height = rawData.height;
    const channels = {
      red: new ImageData(width, height),
      green: new ImageData(width, height),
      blue: new ImageData(width, height)
    };

    const raw = rawData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Red channel
        channels.red.data[idx] = raw[idx];
        channels.red.data[idx + 1] = 0;
        channels.red.data[idx + 2] = 0;
        channels.red.data[idx + 3] = 255;

        // Green channel
        channels.green.data[idx] = 0;
        channels.green.data[idx + 1] = raw[idx + 1];
        channels.green.data[idx + 2] = 0;
        channels.green.data[idx + 3] = 255;

        // Blue channel
        channels.blue.data[idx] = 0;
        channels.blue.data[idx + 1] = 0;
        channels.blue.data[idx + 2] = raw[idx + 2];
        channels.blue.data[idx + 3] = 255;
      }
    }
    return channels;
  };

  // 캔버스 그리기
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const originalImage = generateSampleImage(selectedImage);
    const rawImage = applyBayerPattern(originalImage);
    
    let displayImage;
    let title = '';

    switch (viewMode) {
      case 'original':
        displayImage = originalImage;
        title = '원본 이미지';
        break;
      case 'bayer':
        displayImage = rawImage;
        title = 'Bayer 패턴 적용';
        break;
      case 'red':
        displayImage = separateChannels(rawImage).red;
        title = 'Red 채널만';
        break;
      case 'green':
        displayImage = separateChannels(rawImage).green;
        title = 'Green 채널만';
        break;
      case 'blue':
        displayImage = separateChannels(rawImage).blue;
        title = 'Blue 채널만';
        break;
      case 'bilinear':
        displayImage = bilinearDemosaic(rawImage);
        title = 'Bilinear Demosaicing';
        break;
      case 'nearest':
        displayImage = nearestNeighborDemosaic(rawImage);
        title = 'Nearest Neighbor Demosaicing';
        break;
    }

    // 캔버스 크기 설정
    canvas.width = displayImage.width * pixelSize;
    canvas.height = displayImage.width * pixelSize;

    // 이미지 확대 그리기
    ctx.imageSmoothingEnabled = false;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = displayImage.width;
    tempCanvas.height = displayImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(displayImage, 0, 0);
    
    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

    // Bayer 패턴 격자 그리기
    if (showBayerGrid && pixelSize >= 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x <= canvas.width; x += pixelSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= canvas.height; y += pixelSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Bayer 패턴 라벨 (큰 픽셀 크기일 때만)
      if (pixelSize >= 16) {
        ctx.font = `${pixelSize / 3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let y = 0; y < displayImage.height; y++) {
          for (let x = 0; x < displayImage.width; x++) {
            const centerX = x * pixelSize + pixelSize / 2;
            const centerY = y * pixelSize + pixelSize / 2;
            
            let label = '';
            if (y % 2 === 0) {
              label = x % 2 === 0 ? 'R' : 'G';
            } else {
              label = x % 2 === 0 ? 'G' : 'B';
            }
            
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeText(label, centerX, centerY);
            ctx.fillText(label, centerX, centerY);
          }
        }
      }
    }
  };

  // 애니메이션 효과
  useEffect(() => {
    let interval;
    if (isAnimating) {
      interval = setInterval(() => {
        setAnimationStep(prev => (prev + 1) % 4);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAnimating]);

  useEffect(() => {
    if (isAnimating) {
      const modes = ['bayer', 'red', 'green', 'blue'];
      setViewMode(modes[animationStep]);
    }
  }, [animationStep, isAnimating]);

  useEffect(() => {
    drawCanvas();
  }, [selectedImage, viewMode, showBayerGrid, pixelSize]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-50 rounded-lg">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Bayer Pattern 시뮬레이터</h1>
        <p className="text-gray-600">RGB 필터 배열과 Demosaicing 과정을 시각화합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽 컨트롤 패널 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">샘플 이미지</h3>
            <div className="space-y-2">
              {[
                { value: 'gradient', label: '그라데이션' },
                { value: 'checker', label: '체커보드' },
                { value: 'sunset', label: '일몰 그라데이션' }
              ].map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="image"
                    value={option.value}
                    checked={selectedImage === option.value}
                    onChange={(e) => setSelectedImage(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">표시 모드</h3>
            <div className="space-y-2">
              {[
                { value: 'original', label: '원본 이미지' },
                { value: 'bayer', label: 'Bayer 패턴' },
                { value: 'red', label: 'Red 채널' },
                { value: 'green', label: 'Green 채널' },
                { value: 'blue', label: 'Blue 채널' },
                { value: 'bilinear', label: 'Bilinear Demosaicing' },
                { value: 'nearest', label: 'Nearest Neighbor' }
              ].map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="viewMode"
                    value={option.value}
                    checked={viewMode === option.value}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">표시 옵션</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">픽셀 크기: {pixelSize}px</label>
                <input
                  type="range"
                  min="2"
                  max="32"
                  value={pixelSize}
                  onChange={(e) => setPixelSize(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showBayerGrid}
                  onChange={(e) => setShowBayerGrid(e.target.checked)}
                  className="text-blue-600"
                />
                <span className="text-sm">Bayer 격자 표시</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">애니메이션</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {isAnimating ? <Pause size={16} /> : <Play size={16} />}
                <span>{isAnimating ? '정지' : '시작'}</span>
              </button>
              <button
                onClick={() => {
                  setIsAnimating(false);
                  setAnimationStep(0);
                  setViewMode('original');
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <RotateCcw size={16} />
                <span>리셋</span>
              </button>
            </div>
          </div>
        </div>

        {/* 오른쪽 디스플레이 영역 */}
        <div className="lg:col-span-2">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                {viewMode === 'original' && '원본 이미지'}
                {viewMode === 'bayer' && 'Bayer 패턴 적용'}
                {viewMode === 'red' && 'Red 채널만'}
                {viewMode === 'green' && 'Green 채널만'}
                {viewMode === 'blue' && 'Blue 채널만'}
                {viewMode === 'bilinear' && 'Bilinear Demosaicing'}
                {viewMode === 'nearest' && 'Nearest Neighbor Demosaicing'}
              </h3>
              <button
                onClick={() => setShowBayerGrid(!showBayerGrid)}
                className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
              >
                {showBayerGrid ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>격자</span>
              </button>
            </div>
            
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 max-w-full max-h-96 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          </div>

          {/* 정보 패널 */}
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-3">Bayer 패턴 설명</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>RGGB 배열:</strong> 각 픽셀은 Red, Green, Blue 중 하나의 색상만 감지합니다.</p>
              <p><strong>Green 픽셀이 2배:</strong> 인간의 눈이 녹색에 가장 민감하기 때문입니다.</p>
              <p><strong>Demosaicing:</strong> 누락된 색상 정보를 주변 픽셀로부터 추정합니다.</p>
              <p><strong>Bilinear:</strong> 주변 픽셀의 평균값을 사용하여 부드러운 결과를 생성합니다.</p>
              <p><strong>Nearest Neighbor:</strong> 가장 가까운 픽셀 값을 사용하여 빠르지만 거친 결과를 생성합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BayerPatternSimulator;