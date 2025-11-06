// Main UI logic: render facts, images, breeds, and quiz
(function(){
  // Toast utility
  function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  // update nav state
  function updateNav(){
    // header may be dynamically injected; handle multiple possible nav ids
    if(window.Auth && window.Auth.isAuthenticated()){
      document.querySelectorAll('#nav-login, #nav-login-2, #nav-login-3, #nav-login-4, #nav-login-5').forEach(n=>n?.classList?.add('hidden'));
      document.querySelectorAll('#nav-profile, #nav-profile-2, #nav-profile-3, #nav-profile-4, #nav-profile-5').forEach(n=>n?.classList?.remove('hidden'));
    } else {
      document.querySelectorAll('#nav-login, #nav-login-2, #nav-login-3, #nav-login-4, #nav-login-5').forEach(n=>n?.classList?.remove('hidden'));
      document.querySelectorAll('#nav-profile, #nav-profile-2, #nav-profile-3, #nav-profile-4, #nav-profile-5').forEach(n=>n?.classList?.add('hidden'));
    }
  }

  // load modular includes (header/footer)
  async function loadIncludes(){
    const includes = document.querySelectorAll('[data-include]');
    await Promise.all(Array.from(includes).map(async el=>{
      const name = el.getAttribute('data-include');
      try{
        const res = await fetch(`includes/${name}.html`);
        if(res.ok){ el.innerHTML = await res.text(); } else { console.warn('Include not found', name); }
        // After loading includes, update nav state
        updateNav();
      }catch(err){ console.warn('Failed to load include', name, err); }
    }));
  }

  // simple auth gate for interactive pages
  function enforceAuthIfNeeded(){
    // pages that require auth: facts, gallery, breeds, trivia, profile
    if(document.getElementById('facts-list') || document.getElementById('image-grid') || document.getElementById('breeds-list') || document.getElementById('quiz-area') || document.getElementById('profile-info')){
      // if not authenticated, redirect to login
      if(window.Auth && !window.Auth.isAuthenticated()){
        window.location.href = 'login.html?r=' + encodeURIComponent(window.location.pathname + window.location.search);
      }
    }
  }

  // Breeds (fetch from TheCatAPI, search, load more, select breed)
  function renderBreeds(){
    const el = document.getElementById('breeds-list');
    if(!el) return;

    window._breedsState = window._breedsState || { items: [], visible: null, query: '' };
    const state = window._breedsState;

    async function fetchBreeds(){
      try{
        const res = await fetch('https://api.thecatapi.com/v1/breeds');
        if(res.ok){ 
          const json = await res.json(); 
          state.items = json.map(b=>({ 
            id: b.id, 
            name: b.name, 
            origin: b.origin, 
            temperament: b.temperament, 
            life_span: b.life_span, 
            description: b.description 
          })); 
          return;
        }
      }catch(e){ 
        console.warn('Failed to fetch breeds', e); 
        showToast('Failed to fetch breeds. Using demo data.');
      }
      state.items = window.DemoData?.breeds || [];
    }

    function render(){
      el.innerHTML = '';
      let items = state.items.slice();
      const q = (state.query || '').trim().toLowerCase();
      if(q){ 
        items = items.filter(i=> 
          (i.name||'').toLowerCase().includes(q) || 
          (i.temperament||'').toLowerCase().includes(q)
        ); 
      }

      const showCountBtn = document.querySelector('button[data-count].active');
      let showCount = null;
      if(showCountBtn){ 
        const v = showCountBtn.getAttribute('data-count'); 
        showCount = v === 'all' ? null : Number(v); 
      }

      let visible = state.visible != null ? state.visible : (showCount == null ? items.length : showCount);
      visible = Math.min(visible, items.length);

      for(let i=0;i<visible;i++){
        const b = items[i];
        const card = document.createElement('article'); 
        card.className='card';
        card.innerHTML = `
          <h4><a href="#" class="breed-select" data-id="${b.id}">${b.name}</a></h4>
          <p class='small'>${b.origin || ''} • ${b.life_span || ''}</p>
          <p>${b.description ? (b.description.length>120? b.description.slice(0,120)+'...': b.description) : ''}</p>
        `;
        el.appendChild(card);
      }

      if(visible < items.length){ 
        const more = document.createElement('div'); 
        more.className='small'; 
        more.textContent = `${items.length - visible} more breeds available — use Load more to reveal.`; 
        el.appendChild(more); 
      }

      // wire selection
      el.querySelectorAll('.breed-select').forEach(a=>a.addEventListener('click', async e=>{
        e.preventDefault(); 
        if(!window.Auth?.isAuthenticated()){ 
          showToast('Please login to view breed details'); 
          setTimeout(()=>window.location.href='login.html',700); 
          return; 
        }
        
        const id = e.currentTarget.dataset.id; 
        const detail = document.getElementById('breed-detail'); 
        if(!detail) return; 
        
        const breed = state.items.find(x=>x.id===id) || { name: id };
        detail.innerHTML = `
          <h3>${breed.name}</h3>
          <p class='small'>${breed.origin || ''} • ${breed.life_span || ''}</p>
          <p>${breed.description || ''}</p>
          <div id='breed-images' style='margin-top:0.75rem' class='image-grid'></div>
        `;
        
        // fetch images for breed
        try{
          const res = await fetch(`https://api.thecatapi.com/v1/images/search?breed_id=${id}&limit=6`);
          if(res.ok){ 
            const imgs = await res.json(); 
            const container = document.getElementById('breed-images'); 
            imgs.forEach(img=>{ 
              const d = document.createElement('div'); 
              d.innerHTML = `<img src='${img.url}' alt='${breed.name}'/>`;
              container.appendChild(d); 
            }); 
          }
        }catch(e){ 
          console.warn('Failed to load breed images', e);
          showToast('Failed to load breed images');
        }
      }));
    }

    // Initial load
    (async ()=>{ 
      if(!state.items.length){ 
        await fetchBreeds(); 
      } 
      render(); 
    })();

    // wire controls
    document.getElementById('breeds-refresh')?.addEventListener('click', async ()=>{ 
      showToast('Refreshing breeds'); 
      state.items = []; 
      await fetchBreeds(); 
      state.visible = null; 
      render(); 
    });

    document.getElementById('breeds-loadmore')?.addEventListener('click', ()=>{ 
      const active = document.querySelector('button[data-count].active');
      const inc = active ? 
        (active.getAttribute('data-count') === 'all' ? 10 : Number(active.getAttribute('data-count'))) : 
        3;
      state.visible = (state.visible || 0) + inc;
      render(); 
    });

    document.getElementById('breeds-search')?.addEventListener('input', e=>{ 
      state.query = e.target.value; 
      state.visible = null; 
      render(); 
    });

    document.querySelectorAll('button[data-count]').forEach(b=>
      b.addEventListener('click', e=>{ 
        document.querySelectorAll('button[data-count]').forEach(x=>x.classList.remove('active')); 
        e.currentTarget.classList.add('active'); 
        state.visible = null; 
        render(); 
      })
    );
  }
  // Image gallery management
  function renderImages() {
    const el = document.getElementById('image-grid');
    if (!el) return;

    // persistent gallery state (supports load more)
    window._galleryState = window._galleryState || { images: [], visible: 12, perPage: 12 };
    const state = window._galleryState;

    async function loadImages() {
      try {
        // fetch a larger batch once and paginate in the UI
        const res = await fetch('https://api.thecatapi.com/v1/images/search?limit=50');
        if (res.ok) {
          const images = await res.json();
          state.images = images.map(img => ({ src: img.url, breed: img.breeds?.[0]?.name || '', tags: (img.tags || []).join(',') }));
          state.visible = state.perPage;
          renderGrid();
        }
      } catch (e) {
        console.warn('Failed to load images', e);
        showToast('Failed to load images');
      }
    }

    function renderGrid() {
      el.innerHTML = '';
      const list = state.images.slice(0, state.visible);
      list.forEach(img => {
        const div = document.createElement('div');
        div.innerHTML = `
          <img src="${img.src}" alt="Cat" data-breed="${img.breed}" data-tags="${img.tags}" />
          <div class="overlay">
            <button class="btn-fav" data-src="${img.src}">❤️</button>
          </div>
        `;
        el.appendChild(div);
      });

      // Show/hide Load More button
      const loadMoreBtn = document.getElementById('gallery-loadmore');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = state.visible < state.images.length ? '' : 'none';
      }
    }

    // Initial load (or re-render)
    if (!state.images.length) {
      loadImages();
    } else {
      renderGrid();
    }

    // Wire refresh button
    document.getElementById('gallery-refresh')?.addEventListener('click', () => {
      showToast('Refreshing gallery');
      state.images = [];
      loadImages();
    });

    // Wire load more
    document.getElementById('gallery-loadmore')?.addEventListener('click', () => {
      state.visible = Math.min(state.visible + state.perPage, state.images.length);
      renderGrid();
    });

    // Wire favorite buttons
    el.addEventListener('click', e => {
      if (!e.target.matches('.btn-fav')) return;

      if (!window.Auth?.isAuthenticated()) {
        showToast('Please login to favorite images');
        setTimeout(() => window.location.href = 'login.html', 700);
        return;
      }

      const src = e.target.dataset.src;
      const favs = JSON.parse(localStorage.getItem('trustcat_img_favs') || '[]');

      if (favs.includes(src)) {
        showToast('Already saved');
        return;
      }

      favs.push(src);
      localStorage.setItem('trustcat_img_favs', JSON.stringify(favs));
      showToast('Image favorited');
    });
  }

  // Facts management with enhanced features
  function renderFacts() {
    const el = document.getElementById('facts-list');
    if (!el) return;

    // Enhanced state for facts
    window._factsState = window._factsState || {
      page: 1,
      pageSize: 20,
      items: [],
      visible: null,
      query: '',
      sortBy: window.FactEnhancer?.SORT_OPTIONS.DATE,
      lengthFilter: window.FactEnhancer?.LENGTH_FILTERS.ALL
    };
    const state = window._factsState;

    // Add controls UI if not exists
    if (!document.querySelector('.facts-controls-enhanced')) {
      const controls = document.createElement('div');
      controls.className = 'facts-controls-enhanced';
      controls.innerHTML = `
        <div class="controls-row">
          <div class="control-group">
            <label>Sort by:</label>
            <select id="facts-sort">
              <option value="date">Date</option>
              <option value="length">Length</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
          <div class="control-group">
            <label>Length:</label>
            <select id="facts-length">
              <option value="all">All</option>
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>
          <div class="control-group">
            <button id="facts-print" class="btn btn-outline">Print View</button>
            <button id="facts-stats" class="btn btn-outline">Statistics</button>
          </div>
        </div>
        <div class="controls-row">
          <div class="search-group">
            <input type="text" id="facts-search" placeholder="Search facts..." />
            <button id="facts-refresh" class="btn">Refresh</button>
          </div>
        </div>
      `;
      el.parentNode.insertBefore(controls, el);

      // Wire enhanced controls
      document.getElementById('facts-sort')?.addEventListener('change', e => {
        state.sortBy = e.target.value;
        render();
      });

      document.getElementById('facts-length')?.addEventListener('change', e => {
        state.lengthFilter = e.target.value;
        render();
      });

      document.getElementById('facts-print')?.addEventListener('click', () => {
        const printWin = window.open('', '_blank');
        printWin.document.write(window.FactEnhancer.getPrintVersion(state.items));
        printWin.document.close();
        printWin.print();
      });

      document.getElementById('facts-stats')?.addEventListener('click', () => {
        const stats = window.FactEnhancer.stats.getStats();
        showStatsDialog(stats);
      });
    }

    async function fetchFacts() {
      try {
        const limit = 50; // fetch a moderate batch
        const res = await fetch(`https://catfact.ninja/facts?limit=${limit}&max_length=500`);
        if (res.ok) {
          const json = await res.json();
          
          // Create base facts
          let facts = json.data.map((f, i) => ({
            id: f._id || i,
            text: f.fact,
            title: f.fact.split('. ')[0],
            source: 'catfact.ninja',
            date: new Date().toISOString() // Add timestamp for new facts
          }));
          
          // Enhance facts with additional features
          if (window.FactEnhancer) {
            facts = window.FactEnhancer.enhance(facts);
          }
          
          state.items = facts;
          showToast('Facts updated successfully');
        }
      } catch (e) {
        console.warn('Failed to fetch facts API, using fallback', e);
        showToast('Failed to fetch facts. Using demo data.');
        
        // Use demo data with enhancements
        let facts = window.DemoData?.facts || [];
        if (window.FactEnhancer) {
          facts = window.FactEnhancer.enhance(facts);
        }
        state.items = facts;
      }
    }

    function render() {
      el.innerHTML = '';
      
      // Get filtered and sorted items
      let items = [...state.items];
      
      // Apply search filter
      const q = (state.query || '').trim().toLowerCase();
      if (q) {
        items = items.filter(i =>
          (i.title || '').toLowerCase().includes(q) ||
          (i.text || '').toLowerCase().includes(q)
        );
      }
      
      // Apply length filter if FactEnhancer is available
      if (window.FactEnhancer && state.lengthFilter) {
        items = window.FactEnhancer.filter(items, state.lengthFilter);
      }
      
      // Apply sorting if FactEnhancer is available
      if (window.FactEnhancer && state.sortBy) {
        items = window.FactEnhancer.sort(items, state.sortBy);
      }

      // Apply visibility limits
      const ctrl = document.querySelector('.facts-controls');
      let showCount = null;
      if (ctrl) {
        const sel = ctrl.querySelector('button.active');
        if (sel) {
          const v = sel.getAttribute('data-count');
          showCount = v === 'all' ? null : Number(v);
        }
      }

      let visible = state.visible || (showCount === null ? items.length : showCount);
      visible = Math.min(visible, items.length);

      // Render facts with enhanced features
      for (let i = 0; i < visible; i++) {
        const f = items[i];
        const card = document.createElement('article');
        card.className = 'card fade-in';
        
        // Record view in stats
        if (window.FactEnhancer) {
          window.FactEnhancer.stats.recordView(f.id);
        }
        
        card.innerHTML = `
          <div class="fact-header">
            <h4>${escapeHtml(f.title || 'Fact')}</h4>
            ${f.category ? `<span class="category-tag">${escapeHtml(f.category)}</span>` : ''}
          </div>
          <p>${escapeHtml(f.text)}</p>
          <div class="fact-meta">
            <span class="source">Source: ${escapeHtml(f.source || '')}</span>
            <span class="length">${f.text.length} characters</span>
            ${f.date ? `<span class="date">${new Date(f.date).toLocaleDateString()}</span>` : ''}
          </div>
          <div class="fact-actions">
            <button class='btn btn-outline fav' data-id='${f.id}'>
              <span class="icon">❤️</span> Favorite
            </button>
            <button class='btn btn-outline share' data-id='${f.id}' data-text='${escapeHtml(f.text)}'>
              <span class="icon">📤</span> Share
            </button>
            <button class='btn btn-outline copy' data-text='${escapeHtml(f.text)}'>
              <span class="icon">📋</span> Copy
            </button>
          </div>
        `;
        el.appendChild(card);
      }

      if (visible < items.length) {
        const more = document.createElement('div');
        more.className = 'facts-more small';
        more.innerHTML = `
          <p>${items.length - visible} more facts available</p>
          <button id="facts-loadmore" class="btn btn-outline">Load More</button>
        `;
        el.appendChild(more);
      }

      // Update stats display if available
      if (window.FactEnhancer) {
        const stats = window.FactEnhancer.stats.getStats();
        updateStatsDisplay(stats);
      }

      // Wire favorite buttons
      el.querySelectorAll('.fav').forEach(btn =>
        btn.addEventListener('click', e => {
          if (!window.Auth?.isAuthenticated()) {
            showToast('Please login to favorite facts');
            setTimeout(() => window.location.href = 'login.html', 700);
            return;
          }

          const id = e.currentTarget.dataset.id;
          const favs = JSON.parse(localStorage.getItem('trustcat_favs') || '[]');

          if (favs.includes(id)) {
            const idx = favs.indexOf(id);
            favs.splice(idx, 1);
            showToast('Removed from favorites');
          } else {
            favs.push(id);
            showToast('Added to favorites');
          }

          localStorage.setItem('trustcat_favs', JSON.stringify(favs));
        })
      );

      // Wire share buttons
      el.querySelectorAll('.share').forEach(btn =>
        btn.addEventListener('click', e => {
          const text = e.currentTarget.dataset.text;
          if (navigator.share) {
            navigator.share({
              title: 'TrustCat Fact',
              text: text,
              url: window.location.href
            }).catch(() => {
              // Fallback if share fails
              navigator.clipboard.writeText(text)
                .then(() => showToast('Copied to clipboard!'))
                .catch(() => showToast('Failed to copy'));
            });
          } else {
            navigator.clipboard.writeText(text)
              .then(() => showToast('Copied to clipboard!'))
              .catch(() => showToast('Failed to copy'));
          }
        })
      );
    }

    // Helper function for HTML escaping
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[c]);
    }

    // Initial load if empty
    (async () => {
      if (!state.items.length) {
        await fetchFacts();
      }
      render();
    })();

    // Wire controls
    document.getElementById('facts-refresh')?.addEventListener('click', async () => {
      showToast('Refreshing facts');
      state.items = [];
      await fetchFacts();
      state.visible = null;
      render();
    });

    document.getElementById('facts-loadmore')?.addEventListener('click', () => {
      const btn = document.querySelector('.facts-controls button.active');
      const increment = btn?.getAttribute('data-count') === 'all' ? 10 : Number(btn?.getAttribute('data-count') || 3);
      state.visible = Math.min((state.visible || 0) + increment, state.items.length);
      render();
    });

    document.getElementById('facts-search')?.addEventListener('input', e => {
      state.query = e.target.value;
      state.visible = null;
      render();
    });
  }

  // Quiz functionality
  function renderQuiz() {
    const el = document.getElementById('quiz-area');
    if (!el) return;

    let score = 0;
    let idx = 0;
    const start = Date.now();
    
    // Ensure we have quiz questions
    if (!window.DemoData) {
      window.DemoData = {};
    }
    
    // Default quiz questions if none exist
    if (!Array.isArray(window.DemoData.trivia) || window.DemoData.trivia.length === 0) {
      window.DemoData.trivia = [
        {
          question: 'How many hours do cats typically sleep per day?',
          options: ['8-10', '12-14', '16-20', '20-24'],
          correct: 2
        },
        {
          question: 'What is a group of cats called?',
          options: ['A pack', 'A clowder', 'A herd', 'A colony'],
          correct: 1
        },
        {
          question: 'Which sense is most developed in cats at birth?',
          options: ['Sight', 'Smell', 'Touch', 'Hearing'],
          correct: 2
        },
        {
          question: 'How far can cats jump in relation to their body length?',
          options: ['2x', '4x', '6x', '8x'],
          correct: 2
        },
        {
          question: 'What color are all kittens\' eyes at birth?',
          options: ['Blue', 'Green', 'Yellow', 'Brown'],
          correct: 0
        }
      ];
    }
    function showQuestion() {
      const q = window.DemoData?.trivia[idx];
      const total = window.DemoData?.trivia.length || 0;
      
      if (!q) {
        const total = window.DemoData?.trivia.length || 0;
        // If there are no questions at all, show friendly message and don't record an attempt
        if (!total) {
          el.innerHTML = `
            <div class="quiz-empty">
              <h3>No quiz available</h3>
              <p class="small">There are no quiz questions right now. Check back later or enable demo questions.</p>
              <button class="btn btn-primary" id="quiz-generate-demo">Generate Demo Quiz</button>
            </div>
          `;
          document.getElementById('quiz-generate-demo')?.addEventListener('click', () => {
            // generate simple demo questions from facts and restart
            const facts = window.DemoData?.facts || [];
            if (facts.length) {
              window.DemoData.trivia = facts.slice(0, 8).map((f) => ({ question: `True or False: ${f.title || f.text}`, options: ['True','False'], correct: 0 }));
              score = 0; idx = 0;
              showQuestion();
            } else {
              showToast('No demo facts available');
            }
          });
          return;
        }
        const took = Math.round((Date.now() - start) / 1000);
        
        // determine badge
        const pct = total ? Math.round((score/total)*100) : 0;
        let badge = 'bronze';
        if (pct >= 80) badge = 'gold'; else if (pct >= 50) badge = 'silver';

        // save badge to localStorage
        const badges = JSON.parse(localStorage.getItem('trustcat_badges') || '[]');
        badges.push({ id: Date.now(), badge, score, total, date: new Date().toISOString() });
        localStorage.setItem('trustcat_badges', JSON.stringify(badges));

        el.innerHTML = `
          <div class="quiz-result">
            <h3>Quiz Complete!</h3>
            <p>Your score: ${score}/${total} (${pct}%)</p>
            <p class="small">Time taken: ${took} seconds</p>
            <div style="margin:0.75rem 0">Badge awarded: <strong>${badge.toUpperCase()}</strong> ${badge==='gold'?'🏅':badge==='silver'?'🥈':'🥉'}</div>
            <a class='btn btn-primary' href='trivia.html' onclick='location.reload()'>Try Again</a>
          </div>
        `;

        // Save result if QuizStore available and total > 0
        if (window.QuizStore && total > 0) {
          const result = {
            score,
            total,
            date: new Date().toISOString(),
            took
          };
          window.QuizStore.saveResult(result);
        }

        renderQuizStats();
        return;
      }

      // render question with progress bar
      const totalQuestions = window.DemoData?.trivia.length || 0;
      const pct = totalQuestions ? Math.round((idx/totalQuestions)*100) : 0;
      el.innerHTML = `
        <div class="quiz-progress"><div class="quiz-progress-bar" style="width:${pct}%"></div></div>
        <div class="quiz-question">
          <h3>Question ${idx + 1} of ${totalQuestions}</h3>
          <p>${q.question}</p>
          <div class="quiz-options">
            ${q.options.map((opt, i) => `
              <button class="btn btn-outline option" data-i="${i}">${opt}</button>
            `).join('')}
          </div>
        </div>
      `;

      // Wire answer buttons
      el.querySelectorAll('.option').forEach(btn =>
        btn.addEventListener('click', e => {
          const answer = Number(e.currentTarget.dataset.i);
          const isCorrect = answer === q.correct;

          // Highlight correct/wrong answers
          e.currentTarget.classList.add(isCorrect ? 'correct' : 'wrong');
          if (!isCorrect) {
            el.querySelectorAll('.option')[q.correct].classList.add('correct');
          }

          if (isCorrect) {
            score++;
            showToast('Correct! 🎉');
          } else {
            showToast('Wrong answer');
          }

          // Disable all buttons after answer
          el.querySelectorAll('.option').forEach(b => b.disabled = true);

          // Move to next question after delay
          setTimeout(() => {
            idx++;
            showQuestion();
          }, 900);
        })
      );
    }

    // Start quiz
    showQuestion();
  }

  // AI chat integration
  function wireAIChat() {
    const input = document.getElementById('chat-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          const response = window.CatAI?.getResponse(input.value);
          if (response) {
            showToast(response);
          }
        }
      });
    }
  }

  function renderQuizStats() {
    const statsEl = document.getElementById('quiz-stats');
    if (!statsEl) return;

    const results = window.QuizStore?.getResults() || [];
    
    if (!results.length) {
      statsEl.innerHTML = '<p class="small">No quiz attempts yet.</p>';
      return;
    }

    const attempts = results.length;
    const avg = (results.reduce((s, r) => s + (r.score / r.total), 0) / attempts) * 100;
    const best = Math.max(...results.map(r => r.score));
    const fastest = Math.min(...results.map(r => r.took));

    statsEl.innerHTML = `
      <h4>Quiz Statistics</h4>
      <div class="stats-grid">
        <div>
          <span class="stat-label">Attempts</span>
          <span class="stat-value">${attempts}</span>
        </div>
        <div>
          <span class="stat-label">Average</span>
          <span class="stat-value">${avg.toFixed(1)}%</span>
        </div>
        <div>
          <span class="stat-label">Best Score</span>
          <span class="stat-value">${best}/${results[0].total}</span>
        </div>
        <div>
          <span class="stat-label">Fastest Time</span>
          <span class="stat-value">${fastest}s</span>
        </div>
      </div>
    `;
  }

  // Profile management
  function renderProfile() {
    // Profile info section
    const profileInfo = document.getElementById('profile-info');
    if (profileInfo) {
      const user = window.Auth?.getUser();
      const pic = localStorage.getItem('trustcat_profile_pic');
      profileInfo.innerHTML = `
        <div class="profile-header" style="display:flex;gap:1rem;align-items:center">
          <div class="avatar" style="width:84px;height:84px;border-radius:999px;overflow:hidden;background:#f1f5f9;display:flex;align-items:center;justify-content:center">
            ${pic ? `<img src="${pic}" alt="avatar" style="width:100%;height:100%;object-fit:cover">` : `<span class="small">${(user?.name||'U').slice(0,1)}</span>`}
          </div>
          <div>
            <h2 style="margin:0">${user?.name || 'User'}</h2>
            <p class='small' style="margin:0">${user?.email || ''}</p>
            <div style="margin-top:0.5rem">
              <input id="profile-pic-input" type="file" accept="image/*" />
              <button id="remove-profile-pic" class="btn btn-outline">Remove</button>
            </div>
          </div>
        </div>
        <div class="profile-activities small" style="margin-top:1rem"></div>
      `;

      // Wire profile pic upload
      const fileInput = document.getElementById('profile-pic-input');
      fileInput?.addEventListener('change', e => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          localStorage.setItem('trustcat_profile_pic', reader.result);
          renderProfile();
          showToast('Profile picture updated');
        };
        reader.readAsDataURL(f);
      });

      document.getElementById('remove-profile-pic')?.addEventListener('click', () => {
        localStorage.removeItem('trustcat_profile_pic');
        renderProfile();
      });
    }

    // Favorites section
    const favorites = document.getElementById('profile-favorites');
    if (favorites) {
      favorites.innerHTML = '';

      // Fetch saved facts
      const savedFacts = JSON.parse(localStorage.getItem('trustcat_favs') || '[]');
      savedFacts.forEach(id => {
        const fact = window.DemoData?.facts.find(x => String(x.id) === String(id));
        if (fact) {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h4>${escapeHtml(fact.title)}</h4>
            <p>${escapeHtml(fact.text)}</p>
            <button class="btn btn-small remove-fav" data-id="${fact.id}">Remove</button>
          `;
          favorites.appendChild(card);
        }
      });

      // Fetch saved images
      const savedImages = JSON.parse(localStorage.getItem('trustcat_img_favs') || '[]');
      savedImages.forEach(src => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <img src='${src}' style='width:100%;border-radius:8px' alt="Favorite cat"/>
          <button class="btn btn-small remove-img" data-src="${src}">Remove</button>
        `;
        favorites.appendChild(card);
      });

      // Wire remove buttons
      favorites.querySelectorAll('.remove-fav').forEach(btn =>
        btn.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id;
          const favs = JSON.parse(localStorage.getItem('trustcat_favs') || '[]');
          const idx = favs.indexOf(id);
          if (idx > -1) {
            favs.splice(idx, 1);
            localStorage.setItem('trustcat_favs', JSON.stringify(favs));
            e.currentTarget.closest('.card').remove();
            showToast('Removed from favorites');
          }
        })
      );

      favorites.querySelectorAll('.remove-img').forEach(btn =>
        btn.addEventListener('click', e => {
          const src = e.currentTarget.dataset.src;
          const favs = JSON.parse(localStorage.getItem('trustcat_img_favs') || '[]');
          const idx = favs.indexOf(src);
          if (idx > -1) {
            favs.splice(idx, 1);
            localStorage.setItem('trustcat_img_favs', JSON.stringify(favs));
            e.currentTarget.closest('.card').remove();
            showToast('Removed from favorites');
          }
        })
      );
    }

    // Populate profile activities summary
    const activitiesEl = document.querySelector('.profile-activities');
    if (activitiesEl) {
      const savedFacts = JSON.parse(localStorage.getItem('trustcat_favs') || '[]');
      const savedImages = JSON.parse(localStorage.getItem('trustcat_img_favs') || '[]');
      const quizAttempts = window.QuizStore?.getResults() || [];
      activitiesEl.innerHTML = `
        <div style="display:flex;gap:1rem;flex-wrap:wrap">
          <div class="stat-card">Saved facts: <strong>${savedFacts.length}</strong></div>
          <div class="stat-card">Saved images: <strong>${savedImages.length}</strong></div>
          <div class="stat-card">Quiz attempts: <strong>${quizAttempts.length}</strong></div>
        </div>
      `;

      // Show badges earned
      const badges = JSON.parse(localStorage.getItem('trustcat_badges') || '[]');
      if (badges.length) {
        const wrap = document.createElement('div');
        wrap.style.marginTop = '0.75rem';
        wrap.innerHTML = '<h4>Badges</h4>' +
          `<div class="badge-list">${badges.slice(-6).map(b=>`<span class="badge">${b.badge==='gold'? '🏅': b.badge==='silver'? '🥈':'🥉'} ${b.badge}</span>`).join('')}</div>`;
        activitiesEl.appendChild(wrap);
      }
    }

    // Quiz summary for profile
    const quizSummary = document.getElementById('profile-quiz');
    if (quizSummary) {
      const results = window.QuizStore?.getResults() || [];
      if (!results.length) {
        quizSummary.innerHTML = '<p class="small">No quiz attempts yet.</p>';
      } else {
        const attempts = results.length;
        const avg = (results.reduce((s, r) => s + (r.score / r.total), 0) / attempts) * 100;
        const best = Math.max(...results.map(r => r.score));
        
        quizSummary.innerHTML = `
          <h3>Quiz History</h3>
          <div class="quiz-stats">
            <p class='small'>
              Total attempts: ${attempts}<br/>
              Average score: ${avg.toFixed(1)}%<br/>
              Best score: ${best}/${results[0].total}
            </p>
          </div>
          <div class="quiz-history">
            ${results.slice(0, 5).map(r => `
              <div class="history-item">
                <span>${new Date(r.date).toLocaleDateString()}</span>
                <span>${r.score}/${r.total}</span>
                <span>${r.took}s</span>
              </div>
            `).join('')}
          </div>
        `;
      }
    }
  }

  // Authentication management
  function wireLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const pass = document.getElementById('password').value;
      
      const result = window.Auth?.login(email, pass);
      
      if (result?.ok) {
        showToast('Signed in successfully');
        updateNav();
        
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('r') || 'profile.html';
        
        setTimeout(() => window.location.href = redirect, 700);
      } else {
        showToast(result?.message || 'Login failed');
      }
    });

    // Wire demo button
    const demoBtn = document.getElementById('demo-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        document.getElementById('email').value = 'demo@trustcat.test';
        document.getElementById('password').value = 'password';
      });
    }
  }

  function wireLogout() {
    const logoutLink = document.getElementById('logout-link');
    if (!logoutLink) return;

    logoutLink.addEventListener('click', e => {
      e.preventDefault();
      window.Auth?.logout();
      showToast('Signed out successfully');
      updateNav();
      setTimeout(() => window.location.href = 'index.html', 400);
    });
  }

  // Wire navigation between pages
  function wireNavigation() {
    const nextBtns = document.querySelectorAll('[data-next-page]');
    nextBtns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const nextPage = e.currentTarget.dataset.nextPage;
        window.location.href = nextPage;
      });
    });
  }

  // Initialize the application
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Load includes first
      await loadIncludes();
      updateNav();

      // Wire facts controls
      document.querySelectorAll('.facts-controls button').forEach(btn => {
        btn.addEventListener('click', e => {
          document.querySelectorAll('.facts-controls button').forEach(x => x.classList.remove('active'));
          e.currentTarget.classList.add('active');
          renderFacts();
        });
      });

      // Initialize all components
      renderFacts();
      renderImages();
      renderBreeds();
      renderQuiz();
      renderQuizStats();
      renderProfile();
      wireLogin();
      wireLogout();
      wireNavigation();

      // Wire Get the App button
      // Wire Get the App button and footer app links
      const playUrl = 'https://play.google.com/store/apps';
      const msUrl = 'https://www.microsoft.com/store/apps';
      document.getElementById('get-app')?.addEventListener('click', e => {
        e.preventDefault();
        window.open(playUrl, '_blank');
      });
      document.getElementById('playstore-link')?.addEventListener('click', e => { e.preventDefault(); window.open(playUrl, '_blank'); });
      document.getElementById('msstore-link')?.addEventListener('click', e => { e.preventDefault(); window.open(msUrl, '_blank'); });

      // Footer subscribe
      document.getElementById('footer-sub')?.addEventListener('click', () => {
        const email = document.getElementById('footer-email')?.value;
        if (!email || !email.includes('@')) { showToast('Please enter a valid email'); return; }
        showToast('Subscribed — demo only');
      });

      // Dog lovers link - direct to adoption site
      document.getElementById('dog-link')?.addEventListener('click', e => {
        window.open('https://dog-adopt-sand.vercel.app', '_blank');
      });

      // Populate Fact of the Day on homepage
      const factCard = document.getElementById('fact-day-card');
      if (factCard) {
        (async () => {
          try {
            // prefer FactEnhancer if available
            let fact = window.DemoData?.facts?.[0];
            if (window.FactEnhancer && window._factsState?.items?.length) {
              fact = window._factsState.items[0];
            } else {
              // try fetch from catfact.ninja
              const res = await fetch('https://catfact.ninja/fact');
              if (res.ok) {
                const j = await res.json();
                fact = { title: j.fact.split('. ')[0], text: j.fact };
              }
            }
            factCard.innerHTML = '';
            const h4 = document.createElement('h4');
            h4.textContent = fact?.title || 'Cat Fact';
            const p = document.createElement('p');
            p.textContent = fact?.text || '';
            factCard.appendChild(h4);
            factCard.appendChild(p);
          } catch (e) {
            factCard.innerHTML = '<p class="small">Unable to load fact of the day.</p>';
          }
        })();
      }

      // Enforce authentication if needed
      enforceAuthIfNeeded();

    } catch (error) {
      console.error('Initialization error:', error);
      showToast('Failed to initialize application');
    }
  });

})();
