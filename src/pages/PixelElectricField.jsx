import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Zap, Eye } from 'lucide-react';

const CMOSPixelSimulator = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [vtgVoltage, setVtgVoltage] = useState(0); // VTG 전압
  const [resetVoltage, setResetVoltage] = useState(3.3); // Reset 전압
  const [showElectrons, setShowElectrons] = useState(true);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [showPotential, setShowPotential] = useState(true);
  const [transferSpeed, setTransferSpeed] = useState(1);
  const [lightIntensity, setLightIntensity] = useState(50);
  
  // 전하 상태 관리
  const [charges, setCharges] = useState([]);
  const [fdCharges, setFdCharges] = useState([]);
  const [time, setTime] = useState(0);
  const [transferProgress, setTransferProgress] = useState(0);

  // 픽셀 구조 파라미터
  const canvasWidth = 500;
  const canvasHeight = 400;
  const pdWidth = 150;
  const pdHeight = 120;
  const fdWidth = 80;
  const fdHeight = 60;
  const vtgWidth = 30;
  const vtgHeight = 80;
  
  // 위치 정의
  const pdX = 50;
  const pdY = 200;
  const vtgX = pdX + pdWidth;
  const vtgY = pdY + 20;
  const fdX = vtgX + vtgWidth + 20;
  const fdY = pdY + 30;

  // 전위 계산 함수 (Si 내부 전기장)
  const calculatePotential = (x, y) => {
    let potential = 0;
    
    // 포토다이오드 영역의 전위 (depletion region)
    if (x >= pdX && x <= pdX + pdWidth && y >= pdY && y <= pdY + pdHeight) {
      if (vtgVoltage > 2.0) {
        // VTG ON: PD에서 VTG 방향으로 선형 기울기
        const distanceToVtg = (x - pdX) / pdWidth;
        potential = -1.0 + distanceToVtg * 1.5; // 전송을 위한 기울기
      } else {
        // VTG OFF: PD 내부에서 평평한 전위 (자유로운 움직임)
        const centerX = pdX + pdWidth / 2;
        const centerY = pdY + pdHeight / 2;
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        potential = -1.0 - (distFromCenter / 100) * 0.1; // 매우 약한 중심 집중
      }
    }
    
    // VTG 영역의 전위
    if (x >= vtgX && x <= vtgX + vtgWidth && y >= vtgY && y <= vtgY + vtgHeight) {
      if (vtgVoltage > 2.0) {
        // VTG ON: 전송 채널 형성
        potential = vtgVoltage * 0.4; // 전송을 위한 중간 전위
      } else {
        // VTG OFF: 높은 장벽 형성 (전자 차단)
        potential = -2.0; // 매우 낮은 전위로 전자 진입 방지
      }
    }
    
    // FD 영역의 전위
    if (x >= fdX && x <= fdX + fdWidth && y >= fdY && y <= fdY + fdHeight) {
      potential = resetVoltage - 0.7; // VDD - Vth (높은 전위)
    }
    
    // VTG와 FD 사이 연결 영역
    if (x > vtgX + vtgWidth && x < fdX && y >= vtgY && y <= vtgY + vtgHeight) {
      if (vtgVoltage > 2.0) {
        // 전송 경로 형성
        const progress = (x - (vtgX + vtgWidth)) / (fdX - (vtgX + vtgWidth));
        const vtgPotential = vtgVoltage * 0.4;
        const fdPotential = resetVoltage - 0.7;
        potential = vtgPotential + progress * (fdPotential - vtgPotential);
      } else {
        potential = -2.0; // 차단
      }
    }
    
    return potential;
  };

  // 전기장 계산 함수
  const calculateElectricField = (x, y) => {
    const delta = 2;
    const potentialRight = calculatePotential(x + delta, y);
    const potentialLeft = calculatePotential(x - delta, y);
    const potentialUp = calculatePotential(x, y - delta);
    const potentialDown = calculatePotential(x, y + delta);
    
    const Ex = -(potentialRight - potentialLeft) / (2 * delta);
    const Ey = -(potentialDown - potentialUp) / (2 * delta);
    
    return { Ex, Ey };
  };

  // 전하 생성 (광전 효과)
  const generatePhotoCharges = () => {
    if (Math.random() < lightIntensity / 1000) {
      const newCharge = {
        x: pdX + Math.random() * pdWidth,
        y: pdY + Math.random() * pdHeight,
        vx: 0,
        vy: 0,
        trail: [],
        type: 'electron', // 전자
        energy: 0.5 + Math.random() * 0.5
      };
      
      setCharges(prev => [...prev, newCharge]);
    }
  };

  // 전하 이동 업데이트
  const updateCharges = (dt) => {
    setCharges(prev => prev.map(charge => {
      const field = calculateElectricField(charge.x, charge.y);
      
      // 기본 전기장에 의한 이동 (전자는 전기장과 반대 방향)
      const baseAcceleration = 0.03 * transferSpeed;
      let newVx = charge.vx - field.Ex * baseAcceleration * dt;
      let newVy = charge.vy - field.Ey * baseAcceleration * dt;
      
      // VTG OFF 상태: PD 내부에서 자유로운 브라운 운동
      if (vtgVoltage <= 2.0) {
        // PD 영역 내에서만 움직임
        if (charge.x >= pdX && charge.x <= pdX + pdWidth && 
            charge.y >= pdY && charge.y <= pdY + pdHeight) {
          // 랜덤한 브라운 운동 추가
          newVx += (Math.random() - 0.5) * 0.2;
          newVy += (Math.random() - 0.5) * 0.2;
          
          // 전기장 효과 최소화 (자유로운 움직임)
          newVx *= 0.3;
          newVy *= 0.3;
        }
      } else {
        // VTG ON 상태: 강한 전송력
        if (charge.x >= pdX && charge.x <= pdX + pdWidth) {
          // PD에서 VTG 방향으로 강한 드리프트
          newVx += 0.8 * transferSpeed;
        }
        if (charge.x >= vtgX && charge.x <= vtgX + vtgWidth) {
          // VTG 영역에서 매우 강한 전송력
          newVx += 1.5 * transferSpeed;
        }
      }
      
      // 속도 제한
      const maxSpeed = vtgVoltage > 2.0 ? 2.5 : 0.8; // VTG OFF일 때 느린 움직임
      const speed = Math.sqrt(newVx ** 2 + newVy ** 2);
      const limitedVx = speed > maxSpeed ? (newVx / speed) * maxSpeed : newVx;
      const limitedVy = speed > maxSpeed ? (newVy / speed) * maxSpeed : newVy;
      
      // 새 위치 계산
      let newX = charge.x + limitedVx * dt;
      let newY = charge.y + limitedVy * dt;
      
      // FD 도달 확인
      if (vtgVoltage > 2.0 && newX >= fdX - 5) {
        setFdCharges(prev => [...prev, {
          x: fdX + Math.random() * fdWidth,
          y: fdY + Math.random() * fdHeight,
          energy: charge.energy
        }]);
        return null; // 전송된 전하 제거
      }
      
      // 경계 처리
      if (vtgVoltage <= 2.0) {
        // VTG OFF: PD 영역에 완전히 가둠
        if (newX < pdX + 2) newX = pdX + 2;
        if (newX > pdX + pdWidth - 2) newX = pdX + pdWidth - 2;
        if (newY < pdY + 2) newY = pdY + 2;
        if (newY > pdY + pdHeight - 2) newY = pdY + pdHeight - 2;
      } else {
        // VTG ON: 전송 경로 허용
        if (newY < pdY || newY > pdY + pdHeight) {
          // Y 방향 제한
          if (newY < pdY) newY = pdY + 1;
          if (newY > pdY + pdHeight) newY = pdY + pdHeight - 1;
        }
        // X 방향은 전송 허용
        if (newX < pdX) newX = pdX + 1;
      }
      
      // 궤적 업데이트
      const newTrail = [...charge.trail, { x: charge.x, y: charge.y }];
      if (newTrail.length > (vtgVoltage > 2.0 ? 25 : 15)) {
        newTrail.shift();
      }
      
      return {
        ...charge,
        x: newX,
        y: newY,
        vx: limitedVx,
        vy: limitedVy,
        trail: newTrail
      };
    }).filter(Boolean));
  };

  // 전위 맵 색상 매핑
  const getPotentialColor = (potential) => {
    const normalized = (potential + 2) / 4; // -2V ~ 2V 정규화
    const hue = normalized * 240; // 빨간색(0)에서 파란색(240)으로
    return `hsl(${hue}, 80%, 50%)`;
  };

  // 캔버스 렌더링
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 전위 맵 렌더링
    if (showPotential) {
      const step = 8;
      for (let x = 0; x < canvasWidth; x += step) {
        for (let y = 0; y < canvasHeight; y += step) {
          const potential = calculatePotential(x, y);
          if (Math.abs(potential) > 0.1) {
            const color = getPotentialColor(potential);
            const alpha = Math.min(0.6, Math.abs(potential) / 2);
            
            ctx.fillStyle = color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
            ctx.fillRect(x, y, step, step);
          }
        }
      }
    }
    
    // 전기장 벡터 렌더링
    if (showFieldLines) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      const step = 25;
      for (let x = pdX; x < fdX + fdWidth; x += step) {
        for (let y = pdY; y < pdY + pdHeight; y += step) {
          const field = calculateElectricField(x, y);
          const magnitude = Math.sqrt(field.Ex ** 2 + field.Ey ** 2);
          
          if (magnitude > 0.01) {
            const scale = 15;
            const endX = x + field.Ex * scale;
            const endY = y + field.Ey * scale;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // 화살표 머리
            const angle = Math.atan2(field.Ey, field.Ex);
            const arrowLength = 4;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowLength * Math.cos(angle - Math.PI / 6),
              endY - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowLength * Math.cos(angle + Math.PI / 6),
              endY - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
      }
    }
    
    // 픽셀 구조 렌더링
    // 포토다이오드 (PD)
    ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
    ctx.fillRect(pdX, pdY, pdWidth, pdHeight);
    ctx.strokeStyle = '#6666ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(pdX, pdY, pdWidth, pdHeight);
    
    // VTG (Vertical Transfer Gate)
    ctx.fillStyle = vtgVoltage > 2 ? 'rgba(255, 100, 100, 0.5)' : 'rgba(150, 150, 150, 0.5)';
    ctx.fillRect(vtgX, vtgY, vtgWidth, vtgHeight);
    ctx.strokeStyle = vtgVoltage > 2 ? '#ff6666' : '#999';
    ctx.lineWidth = 2;
    ctx.strokeRect(vtgX, vtgY, vtgWidth, vtgHeight);
    
    // FD (Floating Diffusion)
    ctx.fillStyle = 'rgba(255, 165, 0, 0.4)';
    ctx.fillRect(fdX, fdY, fdWidth, fdHeight);
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2;
    ctx.strokeRect(fdX, fdY, fdWidth, fdHeight);
    
    // 라벨 텍스트
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PD', pdX + pdWidth/2, pdY - 10);
    ctx.fillText('VTG', vtgX + vtgWidth/2, vtgY - 10);
    ctx.fillText('FD', fdX + fdWidth/2, fdY - 10);
    
    // 전하 (전자) 렌더링
    if (showElectrons) {
      // PD 내의 전자들
      charges.forEach(charge => {
        // 궤적 그리기
        if (charge.trail.length > 1) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(charge.trail[0].x, charge.trail[0].y);
          for (let i = 1; i < charge.trail.length; i++) {
            ctx.lineTo(charge.trail[i].x, charge.trail[i].y);
          }
          ctx.stroke();
        }
        
        // 전자 그리기
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // 전자 표시
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, 6, 0, 2 * Math.PI);
        ctx.stroke();
      });
      
      // FD 내의 전자들
      fdCharges.forEach(charge => {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(charge.x, charge.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
    
    // 정보 패널
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 200, 120);
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`VTG 전압: ${vtgVoltage.toFixed(1)}V`, 20, 30);
    ctx.fillText(`Reset 전압: ${resetVoltage.toFixed(1)}V`, 20, 50);
    ctx.fillText(`PD 전하: ${charges.length}`, 20, 70);
    ctx.fillText(`FD 전하: ${fdCharges.length}`, 20, 90);
    ctx.fillText(`전송 상태: ${vtgVoltage > 2 ? 'ON' : 'OFF'}`, 20, 110);
    
    // 전송 상태 표시
    if (vtgVoltage > 2) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
      ctx.fillRect(vtgX - 5, vtgY - 5, vtgWidth + 10, vtgHeight + 10);
      
      // 전송 화살표
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pdX + pdWidth - 10, pdY + pdHeight/2);
      ctx.lineTo(fdX + 10, fdY + fdHeight/2);
      ctx.stroke();
      
      // 화살표 머리
      ctx.beginPath();
      ctx.moveTo(fdX + 10, fdY + fdHeight/2);
      ctx.lineTo(fdX + 5, fdY + fdHeight/2 - 5);
      ctx.lineTo(fdX + 5, fdY + fdHeight/2 + 5);
      ctx.closePath();
      ctx.fillStyle = '#ffff00';
      ctx.fill();
    }
  };

  // 애니메이션 루프
  useEffect(() => {
    if (isRunning) {
      const animate = () => {
        setTime(prev => prev + 16);
        generatePhotoCharges();
        updateCharges(16);
        render();
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      render();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, vtgVoltage, resetVoltage, showElectrons, showFieldLines, showPotential, transferSpeed, lightIntensity, charges, fdCharges, time]);

  // 초기 설정
  useEffect(() => {
    render();
  }, []);

  // 파라미터 변경 시 렌더링
  useEffect(() => {
    render();
  }, [vtgVoltage, resetVoltage, showElectrons, showFieldLines, showPotential]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setCharges([]);
    setFdCharges([]);
    setTransferProgress(0);
  };

  const handleTransfer = () => {
    setVtgVoltage(vtgVoltage > 2 ? 0 : 3.3);
  };

  // FD 리셋 기능 추가
  const handleFdReset = () => {
    setFdCharges([]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-900 text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">CMOS 픽셀 전하 전송 시뮬레이터</h1>
        <p className="text-gray-300">포토다이오드에서 플로팅 확산으로의 전하 전송 과정을 시뮬레이션합니다.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시뮬레이션 영역 */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="border border-gray-600 rounded bg-black"
            />
          </div>
        </div>

        {/* 제어 패널 */}
        <div className="space-y-4">
          {/* 시뮬레이션 제어 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              시뮬레이션 제어
            </h3>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleStart}
                disabled={isRunning}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                시작
              </button>
              <button
                onClick={handleStop}
                disabled={!isRunning}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded flex items-center justify-center gap-2"
              >
                <Pause className="w-4 h-4" />
                정지
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </button>
            </div>

            <button
              onClick={handleTransfer}
              className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 mb-2 ${
                vtgVoltage > 2 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              <Zap className="w-4 h-4" />
              {vtgVoltage > 2 ? 'VTG OFF' : 'VTG ON'}
            </button>

            <button
              onClick={handleFdReset}
              className="w-full px-4 py-2 rounded flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <RotateCcw className="w-4 h-4" />
              FD 리셋
            </button>
          </div>

          {/* 전압 제어 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">전압 제어</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  VTG 전압: {vtgVoltage.toFixed(1)}V
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={vtgVoltage}
                  onChange={(e) => setVtgVoltage(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-400 mt-1">
                  임계값: 2.0V (전송 시작)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Reset 전압: {resetVoltage.toFixed(1)}V
                </label>
                <input
                  type="range"
                  min="2.5"
                  max="5"
                  step="0.1"
                  value={resetVoltage}
                  onChange={(e) => setResetVoltage(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  광 강도: {lightIntensity}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={lightIntensity}
                  onChange={(e) => setLightIntensity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  전송 속도: {transferSpeed}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={transferSpeed}
                  onChange={(e) => setTransferSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 표시 옵션 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              표시 옵션
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showPotential}
                  onChange={(e) => setShowPotential(e.target.checked)}
                  className="w-4 h-4"
                />
                전위 분포 맵
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showFieldLines}
                  onChange={(e) => setShowFieldLines(e.target.checked)}
                  className="w-4 h-4"
                />
                전기장 벡터
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showElectrons}
                  onChange={(e) => setShowElectrons(e.target.checked)}
                  className="w-4 h-4"
                />
                전하 이동 경로
              </label>
            </div>
          </div>

          {/* 상태 정보 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">픽셀 상태</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>VTG 전압:</span>
                <span className={vtgVoltage > 2 ? 'text-green-400' : 'text-red-400'}>
                  {vtgVoltage.toFixed(1)}V
                </span>
              </div>
              <div className="flex justify-between">
                <span>전송 상태:</span>
                <span className={vtgVoltage > 2 ? 'text-green-400' : 'text-gray-400'}>
                  {vtgVoltage > 2 ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>PD 전하:</span>
                <span className="text-blue-400">{charges.length}</span>
              </div>
              <div className="flex justify-between">
                <span>FD 전하:</span>
                <span className="text-yellow-400">{fdCharges.length}</span>
              </div>
              <div className="flex justify-between">
                <span>광 강도:</span>
                <span>{lightIntensity}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 설명 */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">CMOS 픽셀 구조 설명</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-400 mb-2">포토다이오드 (PD)</h4>
            <p>입사 광자를 전자-정공 쌍으로 변환합니다. 생성된 전자들이 공핍층에 축적됩니다.</p>
          </div>
          <div>
            <h4 className="font-medium text-red-400 mb-2">수직 전송 게이트 (VTG)</h4>
            <p>2V 이상의 전압이 인가되면 PD의 전하를 FD로 전송하는 통로 역할을 합니다.</p>
          </div>
          <div>
            <h4 className="font-medium text-yellow-400 mb-2">플로팅 확산 (FD)</h4>
            <p>전송된 전하를 임시 저장하고 전압으로 변환하는 감지 노드입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMOSPixelSimulator;