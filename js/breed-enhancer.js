// Breeds Enhancement Module
(function() {
  // State management
  const state = {
    breeds: [],
    viewMode: 'grid',
    filters: {
      origin: 'all',
      size: 'all',
      temperament: 'all'
    },
    comparison: {
      active: false,
      slots: [null, null]
    },
    favorites: JSON.parse(localStorage.getItem('trustcat_breed_favs') || '[]')
  };

  // Initialize breeds features
  function initBreedFeatures() {
    initViewModes();
    initFilters();
    initComparisonMode();
    wireBreedActions();
    loadFilters();
  }

  // Initialize view modes
  function initViewModes() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.viewMode = e.currentTarget.dataset.view;
        renderBreeds();
      });
    });
  }

  // Initialize filters
  function initFilters() {
    ['origin', 'size', 'temperament'].forEach(filter => {
      document.getElementById(`${filter}-filter`)?.addEventListener('change', e => {
        state.filters[filter] = e.target.value;
        renderBreeds();
      });
    });
  }

  // Load filter options from breeds data
  function loadFilters() {
    const origins = new Set();
    const temperaments = new Set();

    state.breeds.forEach(breed => {
      if (breed.origin) origins.add(breed.origin);
      if (breed.temperament) {
        breed.temperament.split(',').forEach(t => temperaments.add(t.trim()));
      }
    });

    // Populate origin filter
    const originSelect = document.getElementById('origin-filter');
    if (originSelect) {
      Array.from(origins).sort().forEach(origin => {
        const option = document.createElement('option');
        option.value = origin.toLowerCase();
        option.textContent = origin;
        originSelect.appendChild(option);
      });
    }

    // Populate temperament filter
    const temperamentSelect = document.getElementById('temperament-filter');
    if (temperamentSelect) {
      Array.from(temperaments).sort().forEach(temperament => {
        const option = document.createElement('option');
        option.value = temperament.toLowerCase();
        option.textContent = temperament;
        temperamentSelect.appendChild(option);
      });
    }
  }

  // Initialize comparison mode
  function initComparisonMode() {
    const compareBtn = document.getElementById('compare-mode');
    if (!compareBtn) return;

    compareBtn.addEventListener('click', () => {
      state.comparison.active = !state.comparison.active;
      compareBtn.classList.toggle('active');
      
      document.getElementById('breeds-list').style.display = 
        state.comparison.active ? 'none' : '';
      document.getElementById('breeds-comparison').style.display = 
        state.comparison.active ? 'block' : 'none';
      
      if (!state.comparison.active) {
        state.comparison.slots = [null, null];
        renderComparison();
      }
    });

    // Wire slot selection
    document.querySelectorAll('.comparison-slots .slot').forEach((slot, idx) => {
      slot.addEventListener('click', () => {
        if (!state.comparison.slots[idx]) {
          showBreedSelector(breed => {
            state.comparison.slots[idx] = breed;
            renderComparison();
          });
        }
      });
    });
  }

  // Show breed selector modal
  function showBreedSelector(onSelect) {
    const modal = document.getElementById('breed-select-modal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (!modal || !backdrop) return;

    // Populate breed list
    const list = modal.querySelector('.breed-list');
    list.innerHTML = '';
    state.breeds.forEach(breed => {
      const item = document.createElement('div');
      item.className = 'breed-row';
      item.innerHTML = `
        <img src="${breed.image?.url || ''}" alt="${breed.name}">
        <div class="breed-info">
          <strong>${breed.name}</strong>
          <div class="small">${breed.origin || ''}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        onSelect(breed);
        closeModal();
      });
      list.appendChild(item);
    });

    // Wire search
    const search = modal.querySelector('.breed-search');
    search.value = '';
    search.addEventListener('input', e => {
      const query = e.target.value.toLowerCase();
      list.querySelectorAll('.breed-row').forEach(row => {
        const name = row.querySelector('strong').textContent.toLowerCase();
        row.style.display = name.includes(query) ? '' : 'none';
      });
    });

    modal.style.display = 'block';
    backdrop.style.display = 'block';
  }

  // Close modal
  function closeModal() {
    document.getElementById('breed-select-modal').style.display = 'none';
    document.querySelector('.modal-backdrop').style.display = 'none';
  }

  // Render breeds in current view mode
  function renderBreeds() {
    const container = document.getElementById('breeds-list');
    if (!container) return;

    // Apply filters
    let breeds = state.breeds.filter(breed => {
      if (state.filters.origin !== 'all' && 
          breed.origin?.toLowerCase() !== state.filters.origin) {
        return false;
      }
      if (state.filters.size !== 'all') {
        const weight = Number(breed.weight?.metric?.split('-')[1] || 0);
        switch(state.filters.size) {
          case 'small': if (weight > 4) return false; break;
          case 'medium': if (weight <= 4 || weight > 8) return false; break;
          case 'large': if (weight <= 8) return false; break;
        }
      }
      if (state.filters.temperament !== 'all' && 
          !breed.temperament?.toLowerCase().includes(state.filters.temperament)) {
        return false;
      }
      return true;
    });

    // Apply search if exists
    const search = document.getElementById('breeds-search')?.value.toLowerCase();
    if (search) {
      breeds = breeds.filter(b => 
        b.name.toLowerCase().includes(search) || 
        b.temperament?.toLowerCase().includes(search)
      );
    }

    // Clear container
    container.innerHTML = '';
    container.className = `breeds-${state.viewMode}`;

    // Render based on view mode
    breeds.forEach(breed => {
      const el = document.createElement('div');
      
      switch(state.viewMode) {
        case 'grid':
          el.className = 'breed-card';
          el.innerHTML = `
            <img class="breed-image" src="${breed.image?.url || ''}" alt="${breed.name}">
            <div class="breed-info">
              <h4>${breed.name}</h4>
              <div class="breed-meta">
                <span>${breed.origin || ''}</span>
                <span>${breed.weight?.metric || ''} kg</span>
              </div>
              <p class="small">${breed.temperament || ''}</p>
              <div class="breed-actions">
                <button class="btn btn-outline btn-details" data-id="${breed.id}">
                  Details
                </button>
                <button class="btn btn-outline btn-favorite" data-id="${breed.id}">
                  ${state.favorites.includes(breed.id) ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          `;
          break;

        case 'list':
          el.className = 'breed-row';
          el.innerHTML = `
            <img src="${breed.image?.url || ''}" alt="${breed.name}">
            <div class="breed-info">
              <h4>${breed.name}</h4>
              <div class="small">${breed.origin || ''} • ${breed.temperament || ''}</div>
            </div>
            <div class="breed-actions">
              <button class="btn btn-outline btn-details" data-id="${breed.id}">
                Details
              </button>
              <button class="btn btn-outline btn-favorite" data-id="${breed.id}">
                ${state.favorites.includes(breed.id) ? '❤️' : '🤍'}
              </button>
            </div>
          `;
          break;

        case 'cards':
          el.className = 'card';
          el.innerHTML = `
            <div class="breed-header">
              <h4>${breed.name}</h4>
              <button class="btn btn-outline btn-favorite" data-id="${breed.id}">
                ${state.favorites.includes(breed.id) ? '❤️' : '🤍'}
              </button>
            </div>
            <p>${breed.description || ''}</p>
            <div class="breed-meta">
              <span>Origin: ${breed.origin || ''}</span>
              <span>Weight: ${breed.weight?.metric || ''} kg</span>
            </div>
            <button class="btn btn-outline btn-details" data-id="${breed.id}">
              See Details
            </button>
          `;
          break;
      }

      container.appendChild(el);
    });

    // Wire buttons
    container.querySelectorAll('.btn-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const breed = state.breeds.find(b => b.id === btn.dataset.id);
        if (breed) showBreedDetails(breed);
      });
    });

    container.querySelectorAll('.btn-favorite').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleFavorite(btn.dataset.id);
        btn.textContent = state.favorites.includes(btn.dataset.id) ? '❤️' : '🤍';
      });
    });
  }

  // Show breed details
  function showBreedDetails(breed) {
    const detail = document.getElementById('breed-detail');
    if (!detail) return;

    detail.querySelector('.detail-header').innerHTML = `
      <h3>${breed.name}</h3>
      <div class="breed-meta">
        <span>${breed.origin || ''}</span>
        <span>${breed.weight?.metric || ''} kg</span>
      </div>
    `;

    detail.querySelector('.detail-content').innerHTML = `
      <p>${breed.description || ''}</p>
      
      <div class="detail-images">
        ${breed.image ? `<img src="${breed.image.url}" alt="${breed.name}">` : ''}
      </div>

      <div class="detail-stats">
        <div class="stat-row">
          <span class="stat-label">Temperament</span>
          <span>${breed.temperament || ''}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Life Span</span>
          <span>${breed.life_span || ''} years</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Weight</span>
          <span>${breed.weight?.metric || ''} kg</span>
        </div>
        ${breed.adaptability ? `
          <div class="stat-row">
            <span class="stat-label">Adaptability</span>
            <span>${'⭐'.repeat(breed.adaptability)}</span>
          </div>
        ` : ''}
        ${breed.affection_level ? `
          <div class="stat-row">
            <span class="stat-label">Affection</span>
            <span>${'⭐'.repeat(breed.affection_level)}</span>
          </div>
        ` : ''}
      </div>

      <div class="detail-actions">
        <button class="btn btn-outline btn-favorite" data-id="${breed.id}">
          ${state.favorites.includes(breed.id) ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>
        ${state.comparison.active ? `
          <button class="btn btn-outline btn-compare" data-id="${breed.id}">
            Compare This Breed
          </button>
        ` : ''}
      </div>
    `;

    // Wire buttons
    detail.querySelector('.btn-favorite')?.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      toggleFavorite(id);
      e.currentTarget.textContent = state.favorites.includes(id) ? 
        'Remove from Favorites' : 'Add to Favorites';
    });

    detail.querySelector('.btn-compare')?.addEventListener('click', () => {
      const emptySlot = state.comparison.slots.findIndex(s => !s);
      if (emptySlot !== -1) {
        state.comparison.slots[emptySlot] = breed;
        renderComparison();
      }
    });

    // Fetch more images
    fetchBreedImages(breed.id);
  }

  // Fetch additional breed images
  async function fetchBreedImages(breedId) {
    try {
      const res = await fetch(`https://api.thecatapi.com/v1/images/search?breed_id=${breedId}&limit=4`);
      if (!res.ok) return;
      
      const images = await res.json();
      const container = document.querySelector('.detail-images');
      
      images.forEach(img => {
        const imgEl = document.createElement('img');
        imgEl.src = img.url;
        imgEl.alt = 'Additional breed image';
        container.appendChild(imgEl);
      });
    } catch (e) {
      console.warn('Failed to fetch additional images:', e);
    }
  }

  // Toggle breed favorite status
  function toggleFavorite(breedId) {
    const idx = state.favorites.indexOf(breedId);
    if (idx === -1) {
      state.favorites.push(breedId);
      showToast('Added to favorites');
    } else {
      state.favorites.splice(idx, 1);
      showToast('Removed from favorites');
    }
    localStorage.setItem('trustcat_breed_favs', JSON.stringify(state.favorites));
    }

    // Show toast notification
    function showToast(message) {
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      document.body.appendChild(toast);
    
      // Remove toast after animation
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2000);
  }

  // Render comparison view
  function renderComparison() {
    const container = document.getElementById('breeds-comparison');
    if (!container) return;

    // Update slots
    container.querySelectorAll('.slot').forEach((slot, idx) => {
      const breed = state.comparison.slots[idx];
      if (breed) {
        slot.innerHTML = `
          <div class="breed-card">
            <img class="breed-image" src="${breed.image?.url || ''}" alt="${breed.name}">
            <h4>${breed.name}</h4>
            <button class="btn btn-outline btn-remove">Change</button>
          </div>
        `;
        slot.querySelector('.btn-remove').addEventListener('click', () => {
          state.comparison.slots[idx] = null;
          renderComparison();
        });
      } else {
        slot.innerHTML = `
          <div class="placeholder">
            <p>Select a breed to compare</p>
            <button class="btn btn-outline">Choose Breed</button>
          </div>
        `;
      }
    });

    // Show comparison if both slots filled
    const details = container.querySelector('.comparison-details');
    if (state.comparison.slots[0] && state.comparison.slots[1]) {
      const [breed1, breed2] = state.comparison.slots;
      details.innerHTML = `
        <div class="compare-row">
          <div class="label">${breed1.weight?.metric || ''} kg</div>
          <div class="small">Weight</div>
          <div class="label">${breed2.weight?.metric || ''} kg</div>
        </div>
        <div class="compare-row">
          <div class="label">${breed1.life_span || ''}</div>
          <div class="small">Life Span</div>
          <div class="label">${breed2.life_span || ''}</div>
        </div>
        <div class="compare-row">
          <div class="label">${'⭐'.repeat(breed1.adaptability || 0)}</div>
          <div class="small">Adaptability</div>
          <div class="label">${'⭐'.repeat(breed2.adaptability || 0)}</div>
        </div>
        <div class="compare-row">
          <div class="label">${'⭐'.repeat(breed1.affection_level || 0)}</div>
          <div class="small">Affection</div>
          <div class="label">${'⭐'.repeat(breed2.affection_level || 0)}</div>
        </div>
        <div class="compare-row">
          <div class="label">${'⭐'.repeat(breed1.energy_level || 0)}</div>
          <div class="small">Energy</div>
          <div class="label">${'⭐'.repeat(breed2.energy_level || 0)}</div>
        </div>
      `;
    } else {
      details.innerHTML = '<p class="small">Select two breeds to compare their characteristics</p>';
    }
  }

  // Wire breed actions
  function wireBreedActions() {
    // Close modal on backdrop click
    document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
  }

  // Initialize state from API
  async function initBreeds(breeds) {
    state.breeds = breeds;
    loadFilters();
    renderBreeds();
  }

  // Expose public API
  window.BreedEnhancer = {
    init: initBreedFeatures,
    initBreeds,
    toggleComparisonMode: () => {
      const btn = document.getElementById('compare-mode');
      if (btn) btn.click();
    }
  };
})();