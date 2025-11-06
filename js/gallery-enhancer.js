// Gallery Enhancement Module
(function() {
  // State management
  const state = {
    images: [],
    currentIndex: 0,
    filters: {
      size: 'all',
      type: 'all',
      category: 'all'
    },
    slideshow: {
      active: false,
      interval: null,
      delay: 3000 // 3 seconds
    }
  };

  // Initialize gallery features
  function initGalleryFeatures() {
    initFilters();
    initLightbox();
    initSlideshow();
    wireDownloadButtons();
    wireShareButtons();
  }

  // Initialize filters
  function initFilters() {
    ['size', 'type', 'category'].forEach(filter => {
      document.getElementById(`${filter}-filter`)?.addEventListener('change', e => {
        state.filters[filter] = e.target.value;
        applyFilters();
      });
    });
  }

  // Apply current filters
  function applyFilters() {
    const grid = document.getElementById('image-grid');
    if (!grid) return;

    Array.from(grid.children).forEach(item => {
      const img = item.querySelector('img');
      if (!img) return;

      let show = true;
      const size = img.naturalWidth * img.naturalHeight;

      // Size filter
      if (state.filters.size !== 'all') {
        switch(state.filters.size) {
          case 'small': show = size < 500000; break;
          case 'medium': show = size >= 500000 && size < 1000000; break;
          case 'large': show = size >= 1000000; break;
        }
      }

      // Type filter
      if (show && state.filters.type !== 'all') {
        const isAnimated = img.src.endsWith('.gif');
        show = (state.filters.type === 'animated') === isAnimated;
      }

      // Category filter (based on tags or breed info)
      if (show && state.filters.category !== 'all') {
        const tags = img.dataset.tags || '';
        show = tags.includes(state.filters.category);
      }

      item.style.display = show ? '' : 'none';
    });
  }

  // Lightbox functionality
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const backdrop = document.querySelector('.modal-backdrop');
    if (!lightbox || !backdrop) return;

    // Close lightbox
    document.querySelector('.lightbox .btn-close')?.addEventListener('click', () => {
      lightbox.style.display = 'none';
      backdrop.style.display = 'none';
    });

    // Navigate images
    document.querySelector('.lightbox .btn-prev')?.addEventListener('click', () => {
      navigateImage(-1);
    });

    document.querySelector('.lightbox .btn-next')?.addEventListener('click', () => {
      navigateImage(1);
    });

    // Open lightbox on image click
    document.getElementById('image-grid')?.addEventListener('click', e => {
      const img = e.target.closest('img');
      if (!img) return;

      const images = Array.from(document.querySelectorAll('#image-grid img'));
      state.currentIndex = images.indexOf(img);
      showLightbox(img.src);
    });
  }

  // Show lightbox with image
  function showLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const backdrop = document.querySelector('.modal-backdrop');
    if (!lightbox || !backdrop) return;

    const img = lightbox.querySelector('img');
    if (img) {
      img.src = src;
      img.onload = () => {
        lightbox.style.display = 'flex';
        backdrop.style.display = 'block';
        updateLightboxInfo(img);
      };
    }
  }

  // Update lightbox image info
  function updateLightboxInfo(img) {
    const info = document.querySelector('.lightbox-info');
    if (!info) return;

    const dimensions = `${img.naturalWidth} × ${img.naturalHeight}px`;
    const breed = img.dataset.breed || 'Unknown breed';

    info.querySelector('.dimensions').textContent = dimensions;
    info.querySelector('.breed').textContent = breed;
  }

  // Navigate between images
  function navigateImage(direction) {
    const images = Array.from(document.querySelectorAll('#image-grid img'));
    state.currentIndex = (state.currentIndex + direction + images.length) % images.length;
    showLightbox(images[state.currentIndex].src);
  }

  // Slideshow functionality
  function initSlideshow() {
    const controls = document.getElementById('slideshow-controls');
    if (!controls) return;

    document.getElementById('gallery-slideshow')?.addEventListener('click', toggleSlideshow);
    const pauseBtn = controls.querySelector('.btn-pause');
    pauseBtn?.addEventListener('click', toggleSlideshow);
    controls.querySelector('.btn-prev')?.addEventListener('click', () => navigateImage(-1));
    controls.querySelector('.btn-next')?.addEventListener('click', () => navigateImage(1));
    controls.querySelector('.btn-exit')?.addEventListener('click', stopSlideshow);

    // Allow Esc to exit slideshow / lightbox
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.slideshow.active) stopSlideshow();
        const lb = document.getElementById('lightbox');
        if (lb && lb.style.display !== 'none') { lb.style.display = 'none'; document.querySelector('.modal-backdrop').style.display = 'none'; }
      }
    });
  }

  // Toggle slideshow
  function toggleSlideshow() {
    const controls = document.getElementById('slideshow-controls');
    if (!controls) return;

    if (state.slideshow.active) {
      stopSlideshow();
    } else {
      startSlideshow();
    }
  }

  // Start slideshow
  function startSlideshow() {
    const controls = document.getElementById('slideshow-controls');
    if (!controls) return;

    state.slideshow.active = true;
    controls.style.display = 'flex';
    document.getElementById('gallery-slideshow').textContent = 'Stop Slideshow';
    // Update pause button label
    const pauseBtn = controls.querySelector('.btn-pause');
    if (pauseBtn) pauseBtn.textContent = 'Pause';

    // Show first image in lightbox
    const firstImage = document.querySelector('#image-grid img');
    if (firstImage) {
      state.currentIndex = 0;
      showLightbox(firstImage.src);
    }

    // Start automatic progression
    state.slideshow.interval = setInterval(() => {
      navigateImage(1);
    }, state.slideshow.delay);
  }

  // Stop slideshow
  function stopSlideshow() {
    const controls = document.getElementById('slideshow-controls');
    if (!controls) return;

    state.slideshow.active = false;
    controls.style.display = 'none';
    clearInterval(state.slideshow.interval);
    document.getElementById('gallery-slideshow').textContent = 'Start Slideshow';
    // Reset pause button label
    const pauseBtn = controls.querySelector('.btn-pause');
    if (pauseBtn) pauseBtn.textContent = 'Pause';

    // Close lightbox safely
    const lb = document.getElementById('lightbox');
    if (lb) lb.style.display = 'none';
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  }

  // Wire download buttons
  function wireDownloadButtons() {
    document.querySelectorAll('.btn-download').forEach(btn => {
      btn.addEventListener('click', async e => {
        const img = document.querySelector('.lightbox img');
        if (!img) return;

        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cat-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          showToast('Image downloaded successfully');
        } catch (error) {
          console.error('Download failed:', error);
          showToast('Failed to download image');
        }
      });
    });
    // Open in new tab
    document.querySelectorAll('.btn-open-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const img = document.querySelector('.lightbox img');
        if (img) window.open(img.src, '_blank');
      });
    });
  }

  // Wire share buttons
  function wireShareButtons() {
    document.querySelectorAll('.btn-share').forEach(btn => {
      btn.addEventListener('click', async () => {
        const img = document.querySelector('.lightbox img');
        if (!img) return;

        try {
          if (navigator.share) {
            await navigator.share({
              title: 'Check out this cat!',
              text: 'Found this cute cat on TrustCat',
              url: img.src
            });
          } else {
            await navigator.clipboard.writeText(img.src);
            showToast('Image URL copied to clipboard');
          }
        } catch (error) {
          console.warn('Share failed:', error);
          showToast('Failed to share image');
        }
      });
    });
  }

  // Expose public API
  window.GalleryEnhancer = {
    init: initGalleryFeatures,
    toggleSlideshow,
    applyFilters
  };
})();