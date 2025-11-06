// Fact Enhancement Module
(function() {
  // Constants for sorting and filtering
  const SORT_OPTIONS = {
    DATE: 'date',
    LENGTH: 'length',
    ALPHA: 'alpha'
  };

  const LENGTH_FILTERS = {
    ALL: 'all',
    SHORT: 'short',  // < 100 chars
    MEDIUM: 'medium', // 100-200 chars
    LONG: 'long'     // > 200 chars
  };

  // Enhance facts list with additional features
  function enhanceFactsList(facts) {
    facts = facts.map(fact => ({
      ...fact,
      length: fact.text?.length || 0,
      date: fact.date || new Date().toISOString(),
      category: getCategory(fact.text)
    }));
    return facts;
  }

  // Sort facts by different criteria
  function sortFacts(facts, sortBy = SORT_OPTIONS.DATE) {
    return [...facts].sort((a, b) => {
      switch(sortBy) {
        case SORT_OPTIONS.LENGTH:
          return (a.text?.length || 0) - (b.text?.length || 0);
        case SORT_OPTIONS.ALPHA:
          return (a.text || '').localeCompare(b.text || '');
        case SORT_OPTIONS.DATE:
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
  }

  // Filter facts by length
  function filterFactsByLength(facts, lengthFilter = LENGTH_FILTERS.ALL) {
    if (lengthFilter === LENGTH_FILTERS.ALL) return facts;
    
    return facts.filter(fact => {
      const len = fact.text?.length || 0;
      switch(lengthFilter) {
        case LENGTH_FILTERS.SHORT: return len < 100;
        case LENGTH_FILTERS.MEDIUM: return len >= 100 && len <= 200;
        case LENGTH_FILTERS.LONG: return len > 200;
        default: return true;
      }
    });
  }

  // Get fact category based on content
  function getCategory(text) {
    const lowerText = (text || '').toLowerCase();
    if (lowerText.includes('kitten') || lowerText.includes('baby')) return 'Kittens';
    if (lowerText.includes('health') || lowerText.includes('medical')) return 'Health';
    if (lowerText.includes('behavior') || lowerText.includes('habit')) return 'Behavior';
    if (lowerText.includes('history') || lowerText.includes('ancient')) return 'History';
    return 'General';
  }

  // Generate print-friendly version
  function getPrintVersion(facts) {
    return `
      <html>
        <head>
          <title>TrustCat Facts - Print Version</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            .fact { margin-bottom: 20px; page-break-inside: avoid; }
            .category { color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <h1>TrustCat Facts</h1>
          ${facts.map(fact => `
            <div class="fact">
              <p>${fact.text}</p>
              <p class="category">Category: ${fact.category}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  // Share fact via available methods
  async function shareFact(fact) {
    const text = fact.text;
    const url = window.location.href;
    const title = 'TrustCat - Interesting Cat Fact';

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return true;
      }
      
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${text}\n\nRead more at: ${url}`);
      return 'copied';
    } catch (err) {
      console.warn('Share failed:', err);
      return false;
    }
  }

  // Add stat tracking
  const stats = {
    viewed: new Set(),
    shared: new Set(),
    printed: new Set(),
    
    recordView(factId) {
      this.viewed.add(factId);
      this.save();
    },
    
    recordShare(factId) {
      this.shared.add(factId);
      this.save();
    },
    
    recordPrint(factId) {
      this.printed.add(factId);
      this.save();
    },
    
    getStats() {
      return {
        totalViewed: this.viewed.size,
        totalShared: this.shared.size,
        totalPrinted: this.printed.size,
        mostViewed: Array.from(this.viewed)
          .map(id => ({ id, count: this.getViewCount(id) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      };
    },
    
    getViewCount(factId) {
      return (localStorage.getItem(`fact_views_${factId}`) || 0) * 1;
    },
    
    save() {
      localStorage.setItem('trustcat_fact_stats', JSON.stringify({
        viewed: Array.from(this.viewed),
        shared: Array.from(this.shared),
        printed: Array.from(this.printed)
      }));
    },
    
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem('trustcat_fact_stats') || '{}');
        this.viewed = new Set(saved.viewed || []);
        this.shared = new Set(saved.shared || []);
        this.printed = new Set(saved.printed || []);
      } catch(e) {
        console.warn('Failed to load stats:', e);
      }
    }
  };

  // Initialize stats on load
  stats.load();

  // Expose public API
  window.FactEnhancer = {
    enhance: enhanceFactsList,
    sort: sortFacts,
    filter: filterFactsByLength,
    getPrintVersion,
    share: shareFact,
    stats,
    SORT_OPTIONS,
    LENGTH_FILTERS
  };
})();