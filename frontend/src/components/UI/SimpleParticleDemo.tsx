/**
 * 简化版粒子系统演示
 * 用于学习Canvas动画的基础概念
 */

import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';

// 简化的粒子接口
interface SimpleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export const SimpleParticleDemo: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<SimpleParticle[]>([]);
  
  // 控制参数
  const [particleCount, setParticleCount] = useState(20);
  const [speed, setSpeed] = useState(1);
  const [showConnections, setShowConnections] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置Canvas尺寸
    const resizeCanvas = () => {
      canvas.width = 800;
      canvas.height = 400;
    };

    resizeCanvas();

    // 初始化粒子
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          size: Math.random() * 4 + 2,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
      }
    };

    initParticles();

    // 动画循环
    const animate = () => {
      if (!isRunning) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // 清除画布
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // 半透明黑色，创建轨迹效果
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 边界反弹
        if (particle.x <= 0 || particle.x >= canvas.width) {
          particle.vx *= -1;
        }
        if (particle.y <= 0 || particle.y >= canvas.height) {
          particle.vy *= -1;
        }

        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();

        // 绘制连线
        if (showConnections) {
          particlesRef.current.slice(index + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - distance / 100) * 0.5})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          });
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, speed, showConnections, isRunning]);

  // 重新初始化粒子
  const resetParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      });
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-4">🌟 粒子系统学习演示</h2>
      
      {/* 控制面板 */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">粒子数量: {particleCount}</label>
          <input
            type="range"
            min="5"
            max="50"
            value={particleCount}
            onChange={(e) => setParticleCount(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">速度: {speed}</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={showConnections}
              onChange={(e) => setShowConnections(e.target.checked)}
              className="mr-2"
            />
            显示连线
          </label>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? '暂停' : '开始'}
          </button>
          
          <button
            onClick={resetParticles}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            重置
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-600 rounded-lg bg-black"
          style={{ width: '100%', maxWidth: '800px', height: '400px' }}
        />
        
        {/* 状态指示器 */}
        <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-2 rounded-lg">
          <div>粒子数: {particleCount}</div>
          <div>状态: {isRunning ? '运行中' : '已暂停'}</div>
          <div>连线: {showConnections ? '开启' : '关闭'}</div>
        </div>
      </div>

      {/* 代码说明 */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-3">💡 核心代码解析</h3>
        <div className="space-y-3 text-sm">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-green-400 font-mono mb-1">// 1. 粒子位置更新</div>
            <div className="text-gray-300 font-mono">
              particle.x += particle.vx;<br/>
              particle.y += particle.vy;
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-green-400 font-mono mb-1">// 2. 边界碰撞检测</div>
            <div className="text-gray-300 font-mono">
              if (particle.x &lt;= 0 || particle.x &gt;= canvas.width) &#123;<br/>
              &nbsp;&nbsp;particle.vx *= -1; // 反转速度<br/>
              &#125;
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-green-400 font-mono mb-1">// 3. 距离计算（连线判断）</div>
            <div className="text-gray-300 font-mono">
              const dx = particle1.x - particle2.x;<br/>
              const dy = particle1.y - particle2.y;<br/>
              const distance = Math.sqrt(dx * dx + dy * dy);
            </div>
          </div>
        </div>
      </div>

      {/* 学习提示 */}
      <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-bold mb-2">🎓 学习建议</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• 调整粒子数量，观察性能变化</li>
          <li>• 修改速度参数，看粒子运动效果</li>
          <li>• 开关连线功能，理解距离计算</li>
          <li>• 尝试修改颜色和大小算法</li>
          <li>• 实验不同的边界反弹逻辑</li>
        </ul>
      </div>
    </div>
  );
};