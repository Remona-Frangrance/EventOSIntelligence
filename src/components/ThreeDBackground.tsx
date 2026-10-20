"use client";

import { useEffect, useRef } from "react";

export default function ThreeDBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse tracking for 3D parallax
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 3D Nodes in space
    const particleCount = 75;
    const particles: {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      size: number;
      speedZ: number;
      color: string;
      alpha: number;
    }[] = [];

    const colors = ["#c8f31d", "#22d3ee", "#8b5cf6", "#f43f5e", "#fbbf24"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100,
        baseX: (Math.random() - 0.5) * width * 1.5,
        baseY: (Math.random() - 0.5) * height * 1.5,
        size: Math.random() * 2.5 + 1.2,
        speedZ: Math.random() * 0.8 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.3,
      });
    }

    // 3D Rotating Polyhedral Wireframes
    let angle = 0;

    const render = () => {
      // Smooth mouse lerp
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      const offsetX = (mouseX - width / 2) * 0.15;
      const offsetY = (mouseY - height / 2) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Perspective constant
      const fov = 450;
      angle += 0.006;

      // Draw particle connections and points in 3D projection
      const projected: { px: number; py: number; scale: number; p: (typeof particles)[0] }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z -= p.speedZ;
        if (p.z <= 10) {
          p.z = 800;
          p.x = (Math.random() - 0.5) * width * 1.5;
          p.y = (Math.random() - 0.5) * height * 1.5;
        }

        // Apply 3D parallax offset
        const curX = p.x - offsetX;
        const curY = p.y - offsetY;

        const scale = fov / (fov + p.z);
        const px = width / 2 + curX * scale;
        const py = height / 2 + curY * scale;

        projected.push({ px, py, scale, p });

        // Draw particle
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * scale * 1.5;
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw 3D distance connection lines
      ctx.lineWidth = 0.6;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            const lineAlpha = (1 - dist / 110) * 0.22 * projected[i].scale;
            ctx.strokeStyle = projected[i].p.color;
            ctx.globalAlpha = Math.max(0, lineAlpha);
            ctx.stroke();
          }
        }
      }

      // Draw floating 3D Wireframe Polyhedron in the top-right / hero background
      const cubeSize = 85;
      const cubeCenterX = width * 0.78 - offsetX * 0.8;
      const cubeCenterY = height * 0.32 - offsetY * 0.8;

      // 8 Vertices of a 3D Cube
      const vertices = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ];

      // Rotate around X and Y
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const cosB = Math.cos(angle * 0.7);
      const sinB = Math.sin(angle * 0.7);

      const transformed = vertices.map(([vx, vy, vz]) => {
        // Rotate Y
        let x1 = vx * cosA - vz * sinA;
        let z1 = vx * sinA + vz * cosA;
        // Rotate X
        let y2 = vy * cosB - z1 * sinB;
        let z2 = vy * sinB + z1 * cosB;

        const pScale = 300 / (300 + z2 * cubeSize * 0.5);
        return {
          x: cubeCenterX + x1 * cubeSize * pScale,
          y: cubeCenterY + y2 * cubeSize * pScale,
        };
      });

      // 12 edges of the 3D Cube
      const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0], // back
        [4, 5], [5, 6], [6, 7], [7, 4], // front
        [0, 4], [1, 5], [2, 6], [3, 7], // sides
      ];

      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#c8f31d";
      ctx.strokeStyle = "rgba(200, 243, 29, 0.4)";

      edges.forEach(([v1, v2]) => {
        ctx.beginPath();
        ctx.moveTo(transformed[v1].x, transformed[v1].y);
        ctx.lineTo(transformed[v2].x, transformed[v2].y);
        ctx.globalAlpha = 0.55;
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-65"
    />
  );
}
