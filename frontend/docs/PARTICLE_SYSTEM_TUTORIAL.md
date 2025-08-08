# 🌟 动态粒子背景系统教程

## 📚 学习目标

通过这个教程，你将学会：
- Canvas API 的基础使用
- 粒子系统的数学原理
- 动画循环的实现
- 性能优化技巧
- React 中的 Canvas 集成

## 🎯 核心概念

### 1. 粒子系统基础

粒子系统是计算机图形学中的一个概念，用来模拟大量小对象的集合行为。

```typescript
// 粒子的基本属性
interface Particle {
  x: number;      // X坐标
  y: number;      // Y坐标
  vx: number;     // X方向速度
  vy: number;     // Y方向速度
  size: number;   // 粒子大小
  opacity: number; // 透明度
  color: string;  // 颜色
}
```

### 2. 数学原理

#### 位置更新
```typescript
// 每帧更新粒子位置
particle.x += particle.vx;  // 新位置 = 当前位置 + 速度
particle.y += particle.vy;
```

#### 边界碰撞检测
```typescript
// 碰撞边界时反弹
if (particle.x <= 0 || particle.x >= canvas.width) {
  particle.vx *= -1;  // 反转X方向速度
}
if (particle.y <= 0 || particle.y >= canvas.height) {
  particle.vy *= -1;  // 反转Y方向速度
}
```

#### 距离计算（连线系统）
```typescript
// 计算两点间距离（勾股定理）
const dx = particle1.x - particle2.x;
const dy = particle1.y - particle2.y;
const distance = Math.sqrt(dx * dx + dy * dy);
```

## 🛠️ 分步实现

### 第一步：基础Canvas设置

```typescript
import { useEffect, useRef } from 'react';

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置Canvas尺寸（重要：处理高DPI屏幕）
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // 设置实际像素尺寸
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // 缩放绘图上下文
      ctx.scale(dpr, dpr);
      
      // 设置CSS尺寸
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
};
```

### 第二步：创建粒子

```typescript
// 粒子初始化函数
const createParticle = (canvasWidth: number, canvasHeight: number): Particle => {
  return {
    // 随机位置
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    
    // 随机速度（-0.25 到 0.25）
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    
    // 随机大小（1-4像素）
    size: Math.random() * 3 + 1,
    
    // 随机透明度（0.2-0.7）
    opacity: Math.random() * 0.5 + 0.2,
    
    // 随机颜色
    color: colors[Math.floor(Math.random() * colors.length)]
  };
};

// 初始化所有粒子
const initParticles = (count: number) => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(canvas.offsetWidth, canvas.offsetHeight));
  }
  return particles;
};
```

### 第三步：动画循环

```typescript
const animate = () => {
  // 清除画布
  ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

  particles.forEach((particle, index) => {
    // 1. 更新位置
    updateParticle(particle);
    
    // 2. 绘制粒子
    drawParticle(ctx, particle);
    
    // 3. 绘制连线
    drawConnections(ctx, particle, particles.slice(index + 1));
  });

  // 请求下一帧
  requestAnimationFrame(animate);
};

// 开始动画
animate();
```

### 第四步：粒子更新逻辑

```typescript
const updateParticle = (particle: Particle, canvasWidth: number, canvasHeight: number) => {
  // 更新位置
  particle.x += particle.vx;
  particle.y += particle.vy;

  // 边界碰撞检测和反弹
  if (particle.x <= 0 || particle.x >= canvasWidth) {
    particle.vx *= -1;
    // 确保粒子在边界内
    particle.x = Math.max(0, Math.min(canvasWidth, particle.x));
  }
  
  if (particle.y <= 0 || particle.y >= canvasHeight) {
    particle.vy *= -1;
    particle.y = Math.max(0, Math.min(canvasHeight, particle.y));
  }
};
```

### 第五步：绘制函数

```typescript
// 绘制单个粒子
const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  
  // 设置颜色和透明度
  const alpha = Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
  ctx.fillStyle = `${particle.color}${alpha}`;
  
  ctx.fill();
};

// 绘制粒子间连线
const drawConnections = (
  ctx: CanvasRenderingContext2D, 
  particle: Particle, 
  otherParticles: Particle[]
) => {
  otherParticles.forEach(otherParticle => {
    const dx = particle.x - otherParticle.x;
    const dy = particle.y - otherParticle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 只在距离小于100像素时绘制连线
    if (distance < 100) {
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(otherParticle.x, otherParticle.y);
      
      // 根据距离计算透明度（距离越远越透明）
      const opacity = (1 - distance / 100) * 0.3;
      const alpha = Math.floor(opacity * 255).toString(16).padStart(2, '0');
      
      ctx.strokeStyle = `${particle.color}${alpha}`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  });
};
```

## 🚀 高级优化技巧

### 1. 性能优化

```typescript
// 使用对象池避免频繁创建对象
class ParticlePool {
  private pool: Particle[] = [];
  
  get(): Particle {
    return this.pool.pop() || this.createParticle();
  }
  
  release(particle: Particle) {
    this.pool.push(particle);
  }
  
  private createParticle(): Particle {
    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, opacity: 0, color: '' };
  }
}

// 使用 OffscreenCanvas 在 Web Worker 中渲染
const worker = new Worker('particle-worker.js');
worker.postMessage({ particles, canvasWidth, canvasHeight });
```

### 2. 视觉效果增强

```typescript
// 添加粒子轨迹效果
const drawParticleWithTrail = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  // 绘制轨迹
  ctx.beginPath();
  ctx.moveTo(particle.x - particle.vx * 10, particle.y - particle.vy * 10);
  ctx.lineTo(particle.x, particle.y);
  ctx.strokeStyle = `${particle.color}40`; // 低透明度
  ctx.lineWidth = particle.size * 0.5;
  ctx.stroke();
  
  // 绘制粒子本体
  drawParticle(ctx, particle);
};

// 添加鼠标交互
const addMouseInteraction = (canvas: HTMLCanvasElement, particles: Particle[]) => {
  let mouseX = 0;
  let mouseY = 0;
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    
    // 鼠标附近的粒子会被吸引
    particles.forEach(particle => {
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        const force = (100 - distance) / 100 * 0.01;
        particle.vx += (dx / distance) * force;
        particle.vy += (dy / distance) * force;
      }
    });
  });
};
```

### 3. 响应式设计

```typescript
// 根据屏幕尺寸调整粒子数量
const getOptimalParticleCount = (width: number, height: number): number => {
  const area = width * height;
  const density = 0.00005; // 每平方像素的粒子密度
  return Math.min(Math.max(Math.floor(area * density), 20), 100);
};

// 根据设备性能调整帧率
const getOptimalFrameRate = (): number => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEnd = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  if (isMobile || isLowEnd) {
    return 30; // 低端设备使用30fps
  }
  return 60; // 高端设备使用60fps
};
```

## 🎨 创意变化

### 1. 不同的粒子形状

```typescript
// 绘制不同形状的粒子
const drawShapedParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  ctx.save();
  ctx.translate(particle.x, particle.y);
  ctx.rotate(Date.now() * 0.001 + particle.x * 0.01);
  
  switch (particle.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'square':
      ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
      break;
      
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(0, -particle.size);
      ctx.lineTo(-particle.size, particle.size);
      ctx.lineTo(particle.size, particle.size);
      ctx.closePath();
      ctx.fill();
      break;
  }
  
  ctx.restore();
};
```

### 2. 物理效果

```typescript
// 添加重力效果
const applyGravity = (particle: Particle) => {
  particle.vy += 0.001; // 重力加速度
};

// 添加风力效果
const applyWind = (particle: Particle, time: number) => {
  const windStrength = Math.sin(time * 0.001) * 0.002;
  particle.vx += windStrength;
};

// 添加摩擦力
const applyFriction = (particle: Particle) => {
  particle.vx *= 0.999;
  particle.vy *= 0.999;
};
```

## 🔧 调试技巧

```typescript
// 添加调试信息
const drawDebugInfo = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
  ctx.fillStyle = 'white';
  ctx.font = '12px monospace';
  ctx.fillText(`Particles: ${particles.length}`, 10, 20);
  ctx.fillText(`FPS: ${Math.round(1000 / deltaTime)}`, 10, 40);
  
  // 显示粒子ID和速度
  particles.forEach((particle, index) => {
    ctx.fillText(`${index}`, particle.x + 5, particle.y - 5);
    ctx.strokeStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(particle.x + particle.vx * 100, particle.y + particle.vy * 100);
    ctx.stroke();
  });
};
```

## 📱 移动端优化

```typescript
// 检测设备能力
const getDeviceCapabilities = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  return {
    supportsOffscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    maxTextureSize: ctx ? ctx.canvas.width : 2048,
    devicePixelRatio: window.devicePixelRatio || 1,
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
};

// 自适应配置
const getAdaptiveConfig = () => {
  const capabilities = getDeviceCapabilities();
  
  return {
    particleCount: capabilities.isMobile ? 20 : 50,
    maxConnections: capabilities.isMobile ? 3 : 5,
    animationSpeed: capabilities.isMobile ? 0.5 : 1,
    enableTrails: !capabilities.isMobile
  };
};
```

这个粒子系统展示了Canvas动画的核心概念：数学计算、渲染循环、性能优化。通过理解这些基础，你可以创建更复杂的视觉效果！