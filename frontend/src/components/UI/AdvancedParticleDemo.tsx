/**
 * 高级粒子系统演示
 * 展示更复杂的粒子效果和物理模拟
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { FC } from 'react';

// 高级粒子接口
interface AdvancedParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number; // 加速度
  ay: number;
  size: number;
  mass: number; // 质量
  life: number; // 生命值
  maxLife: number;
  color: { r: number; g: number; b: number };
  shape: 'circle' | 'square' | 'triangle' | 'star';
  rotation: number;
  rotationSpeed: number;
}

// 力场类型
type ForceField = {
  x: number;
  y: number;
  strength: number;
  radius: number;
  type: 'attract' | 'repel' | 'vortex';
};

export const AdvancedParticleDemo: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<AdvancedParticle[]>([]);
  const forceFieldsRef = useRef<ForceField[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  
  // 控制参数
  const [config, setConfig] = useState({
    particleCount: 100,
    gravity: 0.1,
    friction: 0.99,
    enablePhysics: true,
    enableForceFields: true,
    enableTrails: true,
    particleShape: 'circle' as const,
    colorMode: 'rainbow' as 'rainbow' | 'fire' | 'ice' | 'electric'
  });

  const [isRunning, setIsRunning] = useState(true);
  const [stats, setStats] = useState({ fps: 0, particleCount: 0 });

  // 创建粒子
  const createParticle = useCallback((x?: number, y?: number): AdvancedParticle => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not found');

    const life = Math.random() * 300 + 100;
    
    return {
      x: x ?? Math.random() * canvas.width,
      y: y ?? Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      ax: 0,
      ay: 0,
      size: Math.random() * 3 + 1,
      mass: Math.random() * 2 + 0.5,
      life,
      maxLife: life,
      color: getParticleColor(config.colorMode),
      shape: config.particleShape,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    };
  }, [config.colorMode, config.particleShape]);

  // 获取粒子颜色
  const getParticleColor = (mode: string) => {
    switch (mode) {
      case 'fire':
        return {
          r: 255,
          g: Math.random() * 100 + 100,
          b: Math.random() * 50
        };
      case 'ice':
        return {
          r: Math.random() * 100,
          g: Math.random() * 100 + 150,
          b: 255
        };
      case 'electric':
        return {
          r: Math.random() * 255,
          g: Math.random() * 255,
          b: 255
        };
      default: // rainbow
        const hue = Math.random() * 360;
        return hslToRgb(hue, 70, 60);
    }
  };

  // HSL转RGB
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    return {
      r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
    };
  };

  // 应用物理效果
  const applyPhysics = (particle: AdvancedParticle, canvas: HTMLCanvasElement) => {
    if (!config.enablePhysics) return;

    // 重力
    particle.ay += config.gravity * 0.01;

    // 力场影响
    if (config.enableForceFields) {
      forceFieldsRef.current.forEach(field => {
        const dx = field.x - particle.x;
        const dy = field.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < field.radius && distance > 0) {
          const force = field.strength / (distance * distance) * particle.mass;
          const angle = Math.atan2(dy, dx);

          switch (field.type) {
            case 'attract':
              particle.ax += Math.cos(angle) * force;
              particle.ay += Math.sin(angle) * force;
              break;
            case 'repel':
              particle.ax -= Math.cos(angle) * force;
              particle.ay -= Math.sin(angle) * force;
              break;
            case 'vortex':
              const perpAngle = angle + Math.PI / 2;
              particle.ax += Math.cos(perpAngle) * force * 0.5;
              particle.ay += Math.sin(perpAngle) * force * 0.5;
              break;
          }
        }
      });
    }

    // 更新速度
    particle.vx += particle.ax;
    particle.vy += particle.ay;

    // 摩擦力
    particle.vx *= config.friction;
    particle.vy *= config.friction;

    // 重置加速度
    particle.ax = 0;
    particle.ay = 0;

    // 更新位置
    particle.x += particle.vx;
    particle.y += particle.vy;

    // 边界处理
    if (particle.x < 0) {
      particle.x = 0;
      particle.vx *= -0.8;
    }
    if (particle.x > canvas.width) {
      particle.x = canvas.width;
      particle.vx *= -0.8;
    }
    if (particle.y < 0) {
      particle.y = 0;
      particle.vy *= -0.8;
    }
    if (particle.y > canvas.height) {
      particle.y = canvas.height;
      particle.vy *= -0.8;
    }

    // 更新旋转
    particle.rotation += particle.rotationSpeed;

    // 生命值递减
    particle.life--;
  };

  // 绘制粒子
  const drawParticle = (ctx: CanvasRenderingContext2D, particle: AdvancedParticle) => {
    const alpha = particle.life / particle.maxLife;
    const { r, g, b } = particle.color;
    
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = alpha;

    // 设置颜色
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.strokeStyle = `rgb(${Math.min(r + 50, 255)}, ${Math.min(g + 50, 255)}, ${Math.min(b + 50, 255)})`;

    // 绘制不同形状
    switch (particle.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        ctx.strokeRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -particle.size);
        ctx.lineTo(-particle.size, particle.size);
        ctx.lineTo(particle.size, particle.size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;

      case 'star':
        drawStar(ctx, 0, 0, 5, particle.size, particle.size * 0.5);
        ctx.fill();
        ctx.stroke();
        break;
    }

    ctx.restore();
  };

  // 绘制星形
  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  // 绘制力场
  const drawForceField = (ctx: CanvasRenderingContext2D, field: ForceField) => {
    ctx.save();
    ctx.globalAlpha = 0.3;
    
    const gradient = ctx.createRadialGradient(field.x, field.y, 0, field.x, field.y, field.radius);
    
    switch (field.type) {
      case 'attract':
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        break;
      case 'repel':
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        break;
      case 'vortex':
        gradient.addColorStop(0, 'rgba(0, 0, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');
        break;
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
    ctx.fill();

    // 绘制中心点
    ctx.globalAlpha = 1;
    ctx.fillStyle = field.type === 'attract' ? 'green' : field.type === 'repel' ? 'red' : 'blue';
    ctx.beginPath();
    ctx.arc(field.x, field.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // 鼠标事件处理
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseRef.current.isDown = true;
    
    // 添加力场
    const field: ForceField = {
      x: mouseRef.current.x,
      y: mouseRef.current.y,
      strength: e.shiftKey ? -50 : e.ctrlKey ? 30 : 50,
      radius: 100,
      type: e.shiftKey ? 'repel' : e.ctrlKey ? 'vortex' : 'attract'
    };
    
    forceFieldsRef.current.push(field);
  };

  const handleMouseUp = () => {
    mouseRef.current.isDown = false;
  };

  // 主动画循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // 初始化粒子
    particlesRef.current = [];
    for (let i = 0; i < config.particleCount; i++) {
      particlesRef.current.push(createParticle());
    }

    let lastTime = 0;
    let frameCount = 0;
    let fpsTime = 0;

    const animate = (currentTime: number) => {
      if (!isRunning) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // FPS计算
      frameCount++;
      fpsTime += deltaTime;
      if (fpsTime >= 1000) {
        setStats(prev => ({ ...prev, fps: Math.round(frameCount * 1000 / fpsTime) }));
        frameCount = 0;
        fpsTime = 0;
      }

      // 清除画布
      if (config.enableTrails) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // 更新和绘制粒子
      particlesRef.current = particlesRef.current.filter(particle => {
        applyPhysics(particle, canvas);
        drawParticle(ctx, particle);
        return particle.life > 0;
      });

      // 补充新粒子
      while (particlesRef.current.length < config.particleCount) {
        particlesRef.current.push(createParticle());
      }

      // 绘制力场
      forceFieldsRef.current.forEach(field => {
        drawForceField(ctx, field);
      });

      // 更新统计
      setStats(prev => ({ ...prev, particleCount: particlesRef.current.length }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [config, isRunning, createParticle]);

  // 清除力场
  const clearForceFields = () => {
    forceFieldsRef.current = [];
  };

  // 爆炸效果
  const createExplosion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = Math.random() * 10 + 5;
      const particle = createParticle(centerX, centerY);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 200;
      particle.maxLife = 200;
      particlesRef.current.push(particle);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-2xl">
      <h2 className="text-2xl font-bold text-white mb-4">🚀 高级粒子系统演示</h2>
      
      {/* 控制面板 */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">粒子数量: {config.particleCount}</label>
          <input
            type="range"
            min="10"
            max="200"
            value={config.particleCount}
            onChange={(e) => setConfig(prev => ({ ...prev, particleCount: Number(e.target.value) }))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">重力: {config.gravity}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.gravity}
            onChange={(e) => setConfig(prev => ({ ...prev, gravity: Number(e.target.value) }))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">摩擦力: {config.friction}</label>
          <input
            type="range"
            min="0.9"
            max="1"
            step="0.001"
            value={config.friction}
            onChange={(e) => setConfig(prev => ({ ...prev, friction: Number(e.target.value) }))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm text-gray-300 mb-2">粒子形状</label>
          <select
            value={config.particleShape}
            onChange={(e) => setConfig(prev => ({ ...prev, particleShape: e.target.value as any }))}
            className="w-full bg-gray-700 text-white rounded px-2 py-1"
          >
            <option value="circle">圆形</option>
            <option value="square">方形</option>
            <option value="triangle">三角形</option>
            <option value="star">星形</option>
          </select>
        </div>
      </div>

      {/* 开关控制 */}
      <div className="mb-6 flex flex-wrap gap-4">
        {[
          { key: 'enablePhysics', label: '物理效果' },
          { key: 'enableForceFields', label: '力场' },
          { key: 'enableTrails', label: '轨迹效果' }
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center text-white">
            <input
              type="checkbox"
              checked={config[key as keyof typeof config] as boolean}
              onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
              className="mr-2"
            />
            {label}
          </label>
        ))}
      </div>

      {/* 颜色模式 */}
      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-2">颜色模式</label>
        <div className="flex gap-2">
          {['rainbow', 'fire', 'ice', 'electric'].map(mode => (
            <button
              key={mode}
              onClick={() => setConfig(prev => ({ ...prev, colorMode: mode as any }))}
              className={`px-4 py-2 rounded-lg font-medium ${
                config.colorMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {mode === 'rainbow' ? '彩虹' : mode === 'fire' ? '火焰' : mode === 'ice' ? '冰霜' : '电光'}
            </button>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="mb-6 flex gap-2">
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
          onClick={clearForceFields}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium"
        >
          清除力场
        </button>
        
        <button
          onClick={createExplosion}
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
        >
          爆炸效果
        </button>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="border border-gray-600 rounded-lg bg-black cursor-crosshair"
          style={{ width: '100%', maxWidth: '800px', height: '600px' }}
        />
        
        {/* 状态显示 */}
        <div className="absolute top-4 left-4 text-white text-sm bg-black/70 px-3 py-2 rounded-lg">
          <div>FPS: {stats.fps}</div>
          <div>粒子: {stats.particleCount}</div>
          <div>力场: {forceFieldsRef.current.length}</div>
        </div>

        {/* 操作提示 */}
        <div className="absolute bottom-4 left-4 text-white text-xs bg-black/70 px-3 py-2 rounded-lg">
          <div>• 点击: 添加吸引力场</div>
          <div>• Shift+点击: 添加排斥力场</div>
          <div>• Ctrl+点击: 添加漩涡力场</div>
        </div>
      </div>
    </div>
  );
};