<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CDS (Correlated Double Sampling) 시뮬레이터</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .theory-section {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            border-left: 5px solid #667eea;
        }

        .theory-section h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }

        .theory-section p {
            line-height: 1.6;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }

        .controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .control-group {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            border: 2px solid #e9ecef;
        }

        .control-group h3 {
            color: #495057;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }

        .control-item {
            margin-bottom: 15px;
        }

        .control-item label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #495057;
        }

        .control-item input[type="range"] {
            width: 100%;
            height: 8px;
            border-radius: 5px;
            background: #ddd;
            outline: none;
            -webkit-appearance: none;
        }

        .control-item input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .control-item input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #667eea;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .value-display {
            background: #667eea;
            color: white;
            padding: 5px 10px;
            border-radius: 8px;
            font-weight: bold;
            display: inline-block;
            margin-top: 5px;
        }

        .simulation-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }

        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 2px solid #e9ecef;
        }

        .chart-title {
            text-align: center;
            font-size: 1.3rem;
            font-weight: bold;
            margin-bottom: 20px;
            color: #495057;
        }

        canvas {
            border: 1px solid #dee2e6;
            border-radius: 10px;
            width: 100%;
            height: 300px;
        }

        .results-section {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
        }

        .results-section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }

        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .result-item {
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .result-item h3 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.1rem;
        }

        .result-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: #667eea;
        }

        .result-unit {
            font-size: 0.9rem;
            color: #6c757d;
        }

        .start-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
            margin: 20px auto;
            display: block;
        }

        .start-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
        }

        .start-button:active {
            transform: translateY(0);
        }

        .animation-indicator {
            text-align: center;
            margin: 20px 0;
            font-size: 1.1rem;
            color: #667eea;
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .animation-indicator.active {
            opacity: 1;
        }

        @media (max-width: 768px) {
            .simulation-area {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .header p {
                font-size: 1rem;
            }
            
            .controls {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CDS (Correlated Double Sampling) 시뮬레이터</h1>
            <p>이미지 센서의 노이즈 저감 기술을 시각적으로 체험해보세요</p>
        </div>

        <div class="content">
            <div class="theory-section">
                <h2>🔬 CDS 기술 원리</h2>
                <p><strong>Reset Noise:</strong> 픽셀이 리셋될 때 발생하는 랜덤 노이즈로, kTC 노이즈라고도 불립니다.</p>
                <p><strong>Signal + Noise:</strong> 광신호와 노이즈가 함께 측정된 값입니다.</p>
                <p><strong>CDS 과정:</strong> (Signal + Noise) - Reset Noise = Clean Signal</p>
                <p>이 과정을 통해 공통 노이즈 성분을 제거하여 신호의 순도를 높입니다.</p>
            </div>

            <div class="controls">
                <div class="control-group">
                    <h3>📊 신호 설정</h3>
                    <div class="control-item">
                        <label>광신호 강도 (Signal Level)</label>
                        <input type="range" id="signalLevel" min="0" max="1000" value="500">
                        <span class="value-display" id="signalValue">500</span>
                    </div>
                    <div class="control-item">
                        <label>노출 시간 (Exposure Time)</label>
                        <input type="range" id="exposureTime" min="1" max="100" value="50">
                        <span class="value-display" id="exposureValue">50 ms</span>
                    </div>
                </div>

                <div class="control-group">
                    <h3>🎯 노이즈 설정</h3>
                    <div class="control-item">
                        <label>Reset Noise 레벨</label>
                        <input type="range" id="resetNoise" min="5" max="50" value="20">
                        <span class="value-display" id="resetNoiseValue">20</span>
                    </div>
                    <div class="control-item">
                        <label>Read Noise 레벨</label>
                        <input type="range" id="readNoise" min="1" max="20" value="5">
                        <span class="value-display" id="readNoiseValue">5</span>
                    </div>
                    <div class="control-item">
                        <label>온도 (Temperature)</label>
                        <input type="range" id="temperature" min="20" max="80" value="40">
                        <span class="value-display" id="temperatureValue">40°C</span>
                    </div>
                </div>
            </div>

            <button class="start-button" onclick="startSimulation()">🚀 CDS 시뮬레이션 시작</button>
            
            <div class="animation-indicator" id="animationIndicator">
                📈 실시간 데이터 처리 중...
            </div>

            <div class="simulation-area">
                <div class="chart-container">
                    <div class="chart-title">Reset Noise 측정</div>
                    <canvas id="resetChart"></canvas>
                </div>
                <div class="chart-container">
                    <div class="chart-title">Signal + Noise 측정</div>
                    <canvas id="signalChart"></canvas>
                </div>
            </div>

            <div class="simulation-area">
                <div class="chart-container">
                    <div class="chart-title">CDS 결과 (Clean Signal)</div>
                    <canvas id="cdsChart"></canvas>
                </div>
                <div class="chart-container">
                    <div class="chart-title">노이즈 비교</div>
                    <canvas id="comparisonChart"></canvas>
                </div>
            </div>

            <div class="results-section">
                <h2>📊 측정 결과</h2>
                <div class="results-grid">
                    <div class="result-item">
                        <h3>Reset Noise RMS</h3>
                        <div class="result-value" id="resetNoiseRMS">0</div>
                        <div class="result-unit">LSB</div>
                    </div>
                    <div class="result-item">
                        <h3>Signal + Noise RMS</h3>
                        <div class="result-value" id="signalNoiseRMS">0</div>
                        <div class="result-unit">LSB</div>
                    </div>
                    <div class="result-item">
                        <h3>CDS 결과 RMS</h3>
                        <div class="result-value" id="cdsResultRMS">0</div>
                        <div class="result-unit">LSB</div>
                    </div>
                    <div class="result-item">
                        <h3>노이즈 저감 효과</h3>
                        <div class="result-value" id="noiseReduction">0</div>
                        <div class="result-unit">%</div>
                    </div>
                    <div class="result-item">
                        <h3>SNR 개선</h3>
                        <div class="result-value" id="snrImprovement">0</div>
                        <div class="result-unit">dB</div>
                    </div>
                    <div class="result-item">
                        <h3>Dynamic Range</h3>
                        <div class="result-value" id="dynamicRange">0</div>
                        <div class="result-unit">dB</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let animationId;
        let isAnimating = false;
        let dataPoints = [];
        let currentFrame = 0;
        const maxDataPoints = 100;

        // 컨트롤 요소들
        const controls = {
            signalLevel: document.getElementById('signalLevel'),
            exposureTime: document.getElementById('exposureTime'),
            resetNoise: document.getElementById('resetNoise'),
            readNoise: document.getElementById('readNoise'),
            temperature: document.getElementById('temperature')
        };

        // 차트 캔버스들
        const charts = {
            reset: document.getElementById('resetChart'),
            signal: document.getElementById('signalChart'),
            cds: document.getElementById('cdsChart'),
            comparison: document.getElementById('comparisonChart')
        };

        // 컨텍스트 가져오기
        const contexts = {};
        Object.keys(charts).forEach(key => {
            contexts[key] = charts[key].getContext('2d');
        });

        // 값 표시 업데이트
        function updateValueDisplays() {
            document.getElementById('signalValue').textContent = controls.signalLevel.value;
            document.getElementById('exposureValue').textContent = controls.exposureTime.value + ' ms';
            document.getElementById('resetNoiseValue').textContent = controls.resetNoise.value;
            document.getElementById('readNoiseValue').textContent = controls.readNoise.value;
            document.getElementById('temperatureValue').textContent = controls.temperature.value + '°C';
        }

        // 이벤트 리스너 추가
        Object.values(controls).forEach(control => {
            control.addEventListener('input', updateValueDisplays);
        });

        // 초기 값 표시
        updateValueDisplays();

        // 캔버스 크기 설정
        function setupCanvas() {
            Object.values(charts).forEach(canvas => {
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
            });
        }

        // 윈도우 리사이즈 처리
        window.addEventListener('resize', setupCanvas);
        setupCanvas();

        // 노이즈 생성 함수
        function generateNoise(amplitude, type = 'gaussian') {
            if (type === 'gaussian') {
                let u = 0, v = 0;
                while(u === 0) u = Math.random(); // 0 배제
                while(v === 0) v = Math.random();
                const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
                return z * amplitude;
            } else {
                return (Math.random() - 0.5) * 2 * amplitude;
            }
        }

        // 데이터 생성
        function generateData() {
            const signalLevel = parseFloat(controls.signalLevel.value);
            const exposureTime = parseFloat(controls.exposureTime.value) / 100;
            const resetNoiseLevel = parseFloat(controls.resetNoise.value);
            const readNoiseLevel = parseFloat(controls.readNoise.value);
            const temperature = parseFloat(controls.temperature.value);

            // 온도에 따른 dark current 영향
            const darkCurrent = (temperature - 20) * 0.5;
            
            // 신호 계산
            const actualSignal = signalLevel * exposureTime + darkCurrent;
            
            // 노이즈 생성
            const resetNoise = generateNoise(resetNoiseLevel);
            const readNoise = generateNoise(readNoiseLevel);
            const shotNoise = generateNoise(Math.sqrt(Math.max(actualSignal, 1)));
            
            // 측정값들
            const resetMeasurement = resetNoise + readNoise;
            const signalMeasurement = actualSignal + resetNoise + readNoise + shotNoise;
            const cdsResult = signalMeasurement - resetMeasurement;
            const actualCleanSignal = actualSignal + shotNoise;

            return {
                resetNoise: resetMeasurement,
                signalNoise: signalMeasurement,
                cdsResult: cdsResult,
                cleanSignal: actualCleanSignal,
                actualSignal: actualSignal,
                noiseComponents: {
                    reset: Math.abs(resetNoise),
                    read: Math.abs(readNoise),
                    shot: Math.abs(shotNoise)
                }
            };
        }

        // 차트 그리기
        function drawChart(ctx, data, title, color, showNoise = true) {
            const canvas = ctx.canvas;
            const width = canvas.width;
            const height = canvas.height;

            // 배경 클리어
            ctx.clearRect(0, 0, width, height);

            // 그리드 그리기
            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 1;
            
            // 수직 그리드
            for (let i = 0; i <= 10; i++) {
                const x = (width / 10) * i;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            
            // 수평 그리드
            for (let i = 0; i <= 10; i++) {
                const y = (height / 10) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            if (data.length === 0) return;

            // 데이터 범위 계산
            const minVal = Math.min(...data);
            const maxVal = Math.max(...data);
            const range = maxVal - minVal;
            const padding = range * 0.1;

            // 데이터 점 그리기
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let i = 0; i < data.length; i++) {
                const x = (width / (maxDataPoints - 1)) * i;
                const y = height - ((data[i] - minVal + padding) / (range + 2 * padding)) * height;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();

            // 현재 값 표시
            if (data.length > 0) {
                const currentValue = data[data.length - 1];
                const x = (width / (maxDataPoints - 1)) * (data.length - 1);
                const y = height - ((currentValue - minVal + padding) / (range + 2 * padding)) * height;
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 2 * Math.PI);
                ctx.fill();

                // 값 텍스트
                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(currentValue.toFixed(1), x, y - 10);
            }

            // 평균선 그리기
            if (data.length > 10) {
                const average = data.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, data.length);
                const avgY = height - ((average - minVal + padding) / (range + 2 * padding)) * height;
                
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(0, avgY);
                ctx.lineTo(width, avgY);
                ctx.stroke();
                ctx.setLineDash([]);

                // 평균값 표시
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '12px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`평균: ${average.toFixed(1)}`, width - 10, avgY - 5);
            }
        }

        // 비교 차트 그리기
        function drawComparisonChart(ctx, resetData, signalData, cdsData) {
            const canvas = ctx.canvas;
            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // 그리드
            ctx.strokeStyle = '#e9ecef';
            ctx.lineWidth = 1;
            
            for (let i = 0; i <= 10; i++) {
                const x = (width / 10) * i;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            
            for (let i = 0; i <= 10; i++) {
                const y = (height / 10) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            if (resetData.length === 0) return;

            // 데이터 범위 계산
            const allData = [...resetData, ...signalData, ...cdsData];
            const minVal = Math.min(...allData);
            const maxVal = Math.max(...allData);
            const range = maxVal - minVal;
            const padding = range * 0.1;

            // 선 그리기 함수
            function drawLine(data, color, lineWidth = 2) {
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                
                for (let i = 0; i < data.length; i++) {
                    const x = (width / (maxDataPoints - 1)) * i;
                    const y = height - ((data[i] - minVal + padding) / (range + 2 * padding)) * height;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            }

            // 각 신호 그리기
            drawLine(resetData, '#ff6b6b', 1);
            drawLine(signalData, '#4ecdc4', 1);
            drawLine(cdsData, '#45b7d1', 3);

            // 범례
            const legendY = 20;
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(10, legendY, 15, 3);
            ctx.fillStyle = '#333';
            ctx.fillText('Reset Noise', 30, legendY + 5);
            
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(10, legendY + 20, 15, 3);
            ctx.fillStyle = '#333';
            ctx.fillText('Signal + Noise', 30, legendY + 25);
            
            ctx.fillStyle = '#45b7d1';
            ctx.fillRect(10, legendY + 40, 15, 3);
            ctx.fillStyle = '#333';
            ctx.fillText('CDS Result', 30, legendY + 45);
        }

        // 통계 계산
        function calculateStatistics(data) {
            if (data.length === 0) return { rms: 0, mean: 0, std: 0 };
            
            const mean = data.reduce((a, b) => a + b, 0) / data.length;
            const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
            const std = Math.sqrt(variance);
            const rms = Math.sqrt(data.reduce((a, b) => a + b * b, 0) / data.length);
            
            return { rms, mean, std };
        }

        // 결과 업데이트
        function updateResults() {
            if (dataPoints.length === 0) return;

            const resetData = dataPoints.map(d => d.resetNoise);
            const signalData = dataPoints.map(d => d.signalNoise);
            const cdsData = dataPoints.map(d => d.cdsResult);

            const resetStats = calculateStatistics(resetData);
            const signalStats = calculateStatistics(signalData);
            const cdsStats = calculateStatistics(cdsData);

            // 결과 표시
            document.getElementById('resetNoiseRMS').textContent = resetStats.rms.toFixed(1);
            document.getElementById('signalNoiseRMS').textContent = signalStats.rms.toFixed(1);
            document.getElementById('cdsResultRMS').textContent = cdsStats.rms.toFixed(1);

            // 노이즈 저감 효과
            const noiseReduction = ((resetStats.rms - cdsStats.rms) / resetStats.rms * 100);
            document.getElementById('noiseReduction').textContent = noiseReduction.toFixed(1);

            // SNR 개선
            const originalSNR = 20 * Math.log10(Math.abs(signalStats.mean) / signalStats.std);
            const improvedSNR = 20 * Math.log10(Math.abs(cdsStats.mean) / cdsStats.std);
            const snrImprovement = improvedSNR - originalSNR;
            document.getElementById('snrImprovement').textContent = snrImprovement.toFixed(1);

            // Dynamic Range
            const dynamicRange = 20 * Math.log10(parseFloat(controls.signalLevel.value) / cdsStats.rms);
            document.getElementById('dynamicRange').textContent = dynamicRange.toFixed(1);
        }

        // 애니메이션 프레임
        function animate() {
            if (!isAnimating) return;

            const newData = generateData();
            dataPoints.push(newData);

            if (dataPoints.length > maxDataPoints) {
                dataPoints.shift();
            }

            // 차트 그리기
            const resetData = dataPoints.map(d => d.resetNoise);
            const signalData = dataPoints.map(d => d.signalNoise);
            const cdsData = dataPoints.map(d => d.cdsResult);

            drawChart(contexts.reset, resetData, 'Reset Noise', '#ff6b6b');
            drawChart(contexts.signal, signalData, 'Signal + Noise', '#4ecdc4');
            drawChart(contexts.cds, cdsData, 'CDS Result', '#45b7d1');
            drawComparisonChart(contexts.comparison, resetData, signalData, cdsData);

            // 결과 업데이트
            updateResults();

            currentFrame++;
            animationId = requestAnimationFrame(animate);
        }

        // 시뮬레이션 시작/중지
        function startSimulation() {
            const button = document.querySelector('.start-button');
            const indicator = document.getElementById('animationIndicator');
            
            if (isAnimating) {
                // 중지
                isAnimating = false;
                cancelAnimationFrame(animationId);
                button.textContent = '🚀 CDS 시뮬레이션 시작';
                indicator.classList.remove('active');
            } else {
                // 시작
                isAnimating = true;
                dataPoints = [];
                currentFrame = 0;
                button.textContent = '⏹️ 시뮬레이션 중지';
                indicator.classList.add('active');
                animate();
            }
        }

        // 초기 설정
        setupCanvas();
    </script>
</body>
</html>