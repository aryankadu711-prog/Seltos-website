// Configuration
const frameCount = 32;
const canvas = document.getElementById('car-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const loaderProgress = document.getElementById('loader-progress');
const loaderPercentage = document.getElementById('loader-percentage');
const scrollContainer = document.getElementById('hero-animation-section');

// Performance Tuning
const easing = 0.07; // Scrub inertia coefficient
let targetFrame = 0;
let currentFrame = 0;
const images = [];
let loadedCount = 0;
let isLoaded = false;

// Preload Image Assets
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `./ezgif-8c79d97518f51df0-jpg/ezgif-frame-${frameNum}.jpg`;
      
      img.onload = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / frameCount) * 100);
        loaderProgress.style.width = `${progress}%`;
        loaderPercentage.textContent = `${progress}%`;
        
        if (loadedCount === frameCount) {
          isLoaded = true;
          resolve();
        }
      };
      
      img.onerror = () => {
        console.warn(`Failed to load frame ${frameNum}`);
        loadedCount++;
        if (loadedCount === frameCount) {
          isLoaded = true;
          resolve();
        }
      };
      
      images.push(img);
    }
  });
}

// Draw Image to fit canvas (contain aspect ratio alignment with black fill)
function drawFrame(frameIndex) {
  const img = images[frameIndex];
  if (!img || !img.complete) return;

  // Clear context
  ctx.fillStyle = '#0B0B0C';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight, drawX, drawY;

  if (canvasRatio > imgRatio) {
    // Canvas is wider than image
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgRatio;
    drawX = (canvas.width - drawWidth) / 2;
    drawY = 0;
  } else {
    // Canvas is taller than image
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgRatio;
    drawX = 0;
    drawY = (canvas.height - drawHeight) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// Adjust Canvas sizing for screen resolution (Retina Support)
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Redraw active state immediately
  drawFrame(Math.min(frameCount - 1, Math.max(0, Math.round(currentFrame))));
}

// Main Animation Loop
function tick() {
  const diff = targetFrame - currentFrame;
  
  if (Math.abs(diff) > 0.001) {
    currentFrame += diff * easing;
    const activeFrame = Math.min(frameCount - 1, Math.max(0, Math.round(currentFrame)));
    drawFrame(activeFrame);
  } else if (currentFrame !== targetFrame) {
    currentFrame = targetFrame;
    const activeFrame = Math.min(frameCount - 1, Math.max(0, Math.round(currentFrame)));
    drawFrame(activeFrame);
  }

  requestAnimationFrame(tick);
}

// Sync Scroll Effects (Frame rendering, overlays, opacity, etc.)
function syncScrollEffects(scrollTop) {
  // Fade out scroll prompt as user scrolls
  const scrollPrompt = document.getElementById('scroll-prompt');
  if (scrollPrompt) {
    if (scrollTop > 20) {
      scrollPrompt.classList.add('fade-out');
    } else {
      scrollPrompt.classList.remove('fade-out');
    }
  }

  // Calculate maximum height the canvas sticks
  const scrollContainerHeight = scrollContainer.offsetHeight;
  const winHeight = window.innerHeight;
  const maxCanvasScroll = scrollContainerHeight - winHeight;
  
  if (maxCanvasScroll > 0) {
    const scrollPercent = Math.min(1, Math.max(0, scrollTop / maxCanvasScroll));
    targetFrame = scrollPercent * (frameCount - 1);
    
    // Typographic overlay & vignette fading (0% to 30% lock, 30% to 60% fade, >60% hide)
    const heroOverlay = document.getElementById('hero-text-overlay');
    const visibilityShield = document.getElementById('text-visibility-shield');
    
    if (heroOverlay || visibilityShield) {
      let opacity = 1;
      let display = 'flex';
      
      if (scrollPercent <= 0.3) {
        opacity = 1;
        display = 'flex';
      } else if (scrollPercent <= 0.6) {
        opacity = 1 - ((scrollPercent - 0.3) / 0.3);
        display = 'flex';
      } else {
        opacity = 0;
        display = 'none';
      }
      
      if (heroOverlay) {
        heroOverlay.style.opacity = opacity;
        heroOverlay.style.transform = `translateY(${-scrollTop * 0.35}px)`;
        heroOverlay.style.display = display;
      }
      
      if (visibilityShield) {
        visibilityShield.style.opacity = opacity;
        visibilityShield.style.display = (display === 'flex') ? 'block' : 'none';
      }
    }
  } else {
    targetFrame = 0;
  }
}

// Track Scroll to Target Frame (pins within the .scroll-container height)
window.addEventListener('scroll', () => {
  if (!isLoaded) return;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  syncScrollEffects(scrollTop);
});

// Initialize on Load
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Setup fade-in observer for sections
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
  };
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const fadeSections = document.querySelectorAll('.fade-in-section');
  fadeSections.forEach(section => {
    observer.observe(section);
  });
  
  preloadImages().then(() => {
    // Hide loader with a sleek transition
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.visibility = 'hidden';
      document.body.classList.remove('loading');
      
      // Prevent wild spin on refresh by syncing initial scroll position
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      syncScrollEffects(scrollTop);
      currentFrame = targetFrame;
      
      // Draw frame
      drawFrame(Math.round(currentFrame));
      
      // Start the RAF interpolation loop
      requestAnimationFrame(tick);
    }, 1000);
  });
});
