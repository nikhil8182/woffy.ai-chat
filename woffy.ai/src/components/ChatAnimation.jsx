import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

const ChatAnimation = () => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    // Create a new p5 instance
    const sketch = (p) => {
      // Just a few simple particles
      let particles = [];
      
      // Set up canvas
      p.setup = () => {
        // Create canvas that fills the container
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.style('position', 'absolute');
        canvas.style('top', '0');
        canvas.style('left', '0');
        canvas.style('z-index', '0');
        canvas.style('pointer-events', 'none');
        
        // Initialize minimal particles
        for (let i = 0; i < 10; i++) {
          particles.push(new MinimalParticle(p));
        }
      };
      
      // Draw function runs on every frame
      p.draw = () => {
        p.clear();
        
        // Update and display all particles
        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].update();
          particles[i].display();
          
          // Remove particles that are finished
          if (particles[i].isDead()) {
            particles.splice(i, 1);
          }
        }
        
        // Occasionally add new particles
        if (p.random(1) < 0.03 && particles.length < 15) {
          particles.push(new MinimalParticle(p));
        }
      };
      
      // Resize canvas when window is resized
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
      
      // Minimal particle class
      class MinimalParticle {
        constructor(p) {
          this.p = p;
          this.reset();
        }
        
        reset() {
          // Random position (start from edges)
          const edge = Math.floor(this.p.random(4)); // 0: top, 1: right, 2: bottom, 3: left
          
          if (edge === 0) { // Top
            this.x = this.p.random(this.p.width);
            this.y = -10;
            this.vy = this.p.random(0.1, 0.3);
            this.vx = this.p.random(-0.1, 0.1);
          } else if (edge === 1) { // Right
            this.x = this.p.width + 10;
            this.y = this.p.random(this.p.height);
            this.vx = this.p.random(-0.3, -0.1);
            this.vy = this.p.random(-0.1, 0.1);
          } else if (edge === 2) { // Bottom
            this.x = this.p.random(this.p.width);
            this.y = this.p.height + 10;
            this.vy = this.p.random(-0.3, -0.1);
            this.vx = this.p.random(-0.1, 0.1);
          } else { // Left
            this.x = -10;
            this.y = this.p.random(this.p.height);
            this.vx = this.p.random(0.1, 0.3);
            this.vy = this.p.random(-0.1, 0.1);
          }
          
          // Minimal appearance
          this.size = this.p.random(4, 8);
          
          // More visible but still subtle color
          this.alpha = this.p.random(35, 65);
          this.color = this.p.color(212, 175, 55, this.alpha);
          
          // Long lifetime
          this.lifetime = this.p.random(600, 1200);
          this.age = 0;
        }
        
        update() {
          // Move slowly
          this.x += this.vx;
          this.y += this.vy;
          
          // Age
          this.age++;
          
          // Fade out when near end of life
          if (this.age > this.lifetime * 0.7) {
            this.alpha = this.p.map(this.age, this.lifetime * 0.7, this.lifetime, this.alpha, 0);
            this.color = this.p.color(212, 175, 55, this.alpha);
          }
          
          // Die when off screen
          if (this.x < -50 || this.x > this.p.width + 50 || 
              this.y < -50 || this.y > this.p.height + 50) {
            this.age = this.lifetime; // Mark for removal
          }
        }
        
        display() {
          // Just a simple dot
          this.p.noStroke();
          this.p.fill(this.color);
          this.p.circle(this.x, this.y, this.size);
          
          // Enhanced glow
          const glowColor = this.p.color(212, 175, 55, this.alpha * 0.4);
          this.p.fill(glowColor);
          this.p.circle(this.x, this.y, this.size * 2.5);
        }
        
        isDead() {
          return this.age >= this.lifetime;
        }
      }
    };
    
    // Create the p5 instance with the sketch
    let p5Instance = new p5(sketch, canvasRef.current);
    
    // Cleanup function to remove the instance when component unmounts
    return () => {
      p5Instance.remove();
    };
  }, []);
  
  return <div ref={canvasRef} className="chat-animation-container"></div>;
};

export default ChatAnimation;
