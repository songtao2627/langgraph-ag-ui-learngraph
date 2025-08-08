/**
 * 粒子系统学习实验室
 * 提供分步骤的学习和实践环境
 */

import { useState } from 'react';
import type { FC } from 'react';
import { SimpleParticleDemo } from './SimpleParticleDemo';
import { AdvancedParticleDemo } from './AdvancedParticleDemo';

interface LessonProps {
  title: string;
  description: string;
  code: string;
  concepts: string[];
}

const lessons: LessonProps[] = [
  {
    title: "第1课：Canvas基础",
    description: "学习Canvas API的基本使用方法",
    code: `// 获取Canvas和绘图上下文
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// 设置Canvas尺寸
canvas.width = 800;
canvas.height = 600;

// 绘制一个圆
ctx.beginPath();
ctx.arc(100, 100, 50, 0, Math.PI * 2);
ctx.fillStyle = 'blue';
ctx.fill();`,
    concepts: [
      "Canvas元素的获取和设置",
      "2D绘图上下文的使用",
      "基本图形绘制方法",
      "颜色和样式设置"
    ]
  },
  {
    title: "第2课：动画循环",
    description: "理解requestAnimationFrame和动画循环",
    code: `let x = 0;

function animate() {
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 更新位置
  x += 2;
  if (x > canvas.width) x = 0;
  
  // 绘制对象
  ctx.beginPath();
  ctx.arc(x, 100, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // 请求下一帧
  requestAnimationFrame(animate);
}

animate(); // 开始动画`,
    concepts: [
      "requestAnimationFrame的使用",
      "动画循环的基本结构",
      "画布清除和重绘",
      "位置更新逻辑"
    ]
  },
  {
    title: "第3课：粒子对象",
    description: "创建粒子类和基本属性",
    code: `interface Particle {
  x: number;      // X坐标
  y: number;      // Y坐标
  vx: number;     // X方向速度
  vy: number;     // Y方向速度
  size: number;   // 大小
  color: string;  // 颜色
}

// 创建粒子
function createParticle(): Particle {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    size: Math.random() * 5 + 2,
    color: \`hsl(\${Math.random() * 360}, 70%, 60%)\`
  };
}`,
    concepts: [
      "粒子数据结构设计",
      "随机数生成技巧",
      "HSL颜色模式",
      "对象创建函数"
    ]
  },
  {
    title: "第4课：物理运动",
    description: "实现粒子的物理运动和碰撞",
    code: `function updateParticle(particle: Particle) {
  // 更新位置
  particle.x += particle.vx;
  particle.y += particle.vy;
  
  // 边界碰撞检测
  if (particle.x <= 0 || particle.x >= canvas.width) {
    particle.vx *= -1; // 反弹
  }
  if (particle.y <= 0 || particle.y >= canvas.height) {
    particle.vy *= -1;
  }
  
  // 应用摩擦力
  particle.vx *= 0.99;
  particle.vy *= 0.99;
  
  // 应用重力
  particle.vy += 0.1;
}`,
    concepts: [
      "位置和速度的关系",
      "边界碰撞检测",
      "能量损失模拟",
      "重力效果实现"
    ]
  },
  {
    title: "第5课：粒子连线",
    description: "实现粒子间的连线效果",
    code: `function drawConnections(particles: Particle[]) {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      
      // 计算距离
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 距离小于阈值时绘制连线
      if (distance < 100) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        // 根据距离设置透明度
        const opacity = (100 - distance) / 100;
        ctx.strokeStyle = \`rgba(255, 255, 255, \${opacity})\`;
        ctx.stroke();
      }
    }
  }
}`,
    concepts: [
      "双重循环遍历",
      "距离计算公式",
      "条件渲染",
      "透明度动态调整"
    ]
  },
  {
    title: "第6课：性能优化",
    description: "学习粒子系统的性能优化技巧",
    code: `// 对象池模式
class ParticlePool {
  private pool: Particle[] = [];
  
  get(): Particle {
    return this.pool.pop() || this.createNew();
  }
  
  release(particle: Particle) {
    this.pool.push(particle);
  }
  
  private createNew(): Particle {
    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, color: '' };
  }
}

// 空间分割优化
function spatialHash(particles: Particle[], cellSize: number) {
  const grid = new Map<string, Particle[]>();
  
  particles.forEach(particle => {
    const cellX = Math.floor(particle.x / cellSize);
    const cellY = Math.floor(particle.y / cellSize);
    const key = \`\${cellX},\${cellY}\`;
    
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(particle);
  });
  
  return grid;
}`,
    concepts: [
      "对象池模式",
      "内存管理优化",
      "空间分割算法",
      "碰撞检测优化"
    ]
  }
];

export const ParticleLearningLab: FC = () => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [activeDemo, setActiveDemo] = useState<'simple' | 'advanced' | 'none'>('none');

  const lesson = lessons[currentLesson];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            🌟 粒子系统学习实验室
          </h1>
          <p className="text-gray-300 text-lg">从零开始学习Canvas粒子动画系统</p>
        </div>

        {/* 课程导航 */}
        <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📚 课程进度</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {lessons.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentLesson(index)}
                className={`p-3 rounded-xl font-medium transition-all duration-200 ${
                  currentLesson === index
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                第{index + 1}课
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 课程内容 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentLesson + 1}
              </div>
              <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
            </div>
            
            <p className="text-gray-300 mb-6">{lesson.description}</p>

            {/* 核心概念 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">🎯 核心概念</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lesson.concepts.map((concept, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <span className="text-blue-400">•</span>
                    <span className="text-blue-200 text-sm">{concept}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 代码示例 */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">💻 代码示例</h3>
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{lesson.code}</code>
                </pre>
              </div>
            </div>

            {/* 导航按钮 */}
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
                disabled={currentLesson === 0}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
              >
                ← 上一课
              </button>
              
              <button
                onClick={() => setCurrentLesson(Math.min(lessons.length - 1, currentLesson + 1))}
                disabled={currentLesson === lessons.length - 1}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all"
              >
                下一课 →
              </button>
            </div>
          </div>

          {/* 实践演示 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">🚀 实践演示</h2>
            
            {/* 演示选择 */}
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => setActiveDemo('simple')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeDemo === 'simple'
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                基础演示
              </button>
              <button
                onClick={() => setActiveDemo('advanced')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeDemo === 'advanced'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                高级演示
              </button>
              <button
                onClick={() => setActiveDemo('none')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeDemo === 'none'
                    ? 'bg-gray-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                隐藏演示
              </button>
            </div>

            {/* 演示内容 */}
            {activeDemo === 'simple' && (
              <div className="bg-gray-900 rounded-xl p-4">
                <SimpleParticleDemo />
              </div>
            )}

            {activeDemo === 'advanced' && (
              <div className="bg-gray-900 rounded-xl p-4">
                <AdvancedParticleDemo />
              </div>
            )}

            {activeDemo === 'none' && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">🎯</div>
                <p>选择一个演示来查看粒子系统的实际效果</p>
              </div>
            )}
          </div>
        </div>

        {/* 学习资源 */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">📖 扩展学习资源</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
              <h3 className="text-lg font-bold text-blue-300 mb-2">📚 理论基础</h3>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Canvas API 完整文档</li>
                <li>• 计算机图形学基础</li>
                <li>• 数学物理公式</li>
                <li>• 动画原理与实现</li>
              </ul>
            </div>
            
            <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
              <h3 className="text-lg font-bold text-green-300 mb-2">🛠️ 实践项目</h3>
              <ul className="text-green-200 text-sm space-y-1">
                <li>• 烟花爆炸效果</li>
                <li>• 星空背景动画</li>
                <li>• 流体模拟系统</li>
                <li>• 交互式粒子画板</li>
              </ul>
            </div>
            
            <div className="bg-purple-500/20 rounded-xl p-4 border border-purple-500/30">
              <h3 className="text-lg font-bold text-purple-300 mb-2">🚀 进阶技术</h3>
              <ul className="text-purple-200 text-sm space-y-1">
                <li>• WebGL 3D粒子系统</li>
                <li>• GPU加速计算</li>
                <li>• 物理引擎集成</li>
                <li>• VR/AR粒子效果</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 练习挑战 */}
        <div className="mt-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-500/30">
          <h2 className="text-2xl font-bold text-yellow-300 mb-4">🏆 挑战练习</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold text-yellow-200 mb-3">初级挑战</h3>
              <ul className="text-yellow-100 text-sm space-y-2">
                <li>• 实现粒子的颜色渐变效果</li>
                <li>• 添加鼠标跟随功能</li>
                <li>• 创建不同形状的粒子</li>
                <li>• 实现粒子的生命周期</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-orange-200 mb-3">高级挑战</h3>
              <ul className="text-orange-100 text-sm space-y-2">
                <li>• 实现粒子间的引力/斥力</li>
                <li>• 添加碰撞检测和反应</li>
                <li>• 创建粒子发射器系统</li>
                <li>• 实现粒子的群体行为</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};