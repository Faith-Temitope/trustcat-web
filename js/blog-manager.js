// Blog content management
const BlogManager = (function() {
  // Local blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "Understanding Your Cat's Body Language",
      date: "2025-11-06",
      author: "Dr. Whiskers",
      image: "https://placekitten.com/800/400",
      excerpt: "Learn to understand what your cat is telling you through their tail positions, ear movements, and facial expressions.",
      content: "Cats communicate primarily through body language. A tail held high indicates confidence and greeting, while a puffed tail shows fear or aggression..."
    },
    {
      id: 2,
      title: "The Benefits of Indoor Cat Enrichment",
      date: "2025-11-05",
      author: "Feline Specialist Sarah",
      image: "https://placekitten.com/801/400",
      excerpt: "Discover how to create an engaging indoor environment that keeps your cat mentally and physically stimulated.",
      content: "Indoor cats need environmental enrichment to stay healthy and happy. Consider adding climbing spaces, hiding spots, and interactive toys..."
    },
    {
      id: 3,
      title: "Nutrition Guide: What Your Cat Really Needs",
      date: "2025-11-04",
      author: "Nutritionist Mark",
      image: "https://placekitten.com/802/400",
      excerpt: "A comprehensive guide to feline nutrition and choosing the right diet for your cat.",
      content: "Cats are obligate carnivores, meaning they require a diet rich in animal protein. Understanding their nutritional needs is crucial..."
    }
  ];

  // Initialize blog
  function initBlog() {
    const container = document.getElementById('blog-posts');
    if (!container) return;

    // Render posts
    blogPosts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'blog-post card';
      article.innerHTML = `
        <div class="post-image">
          <img src="${post.image}" alt="${post.title}" loading="lazy">
        </div>
        <div class="post-content">
          <div class="post-meta">
            <span class="post-date">${new Date(post.date).toLocaleDateString()}</span>
            <span class="post-author">By ${post.author}</span>
          </div>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <button class="btn btn-outline read-more" data-id="${post.id}">Read More</button>
        </div>
      `;
      container.appendChild(article);
    });

    // Wire up read more buttons
    container.querySelectorAll('.read-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const post = blogPosts.find(p => p.id === Number(btn.dataset.id));
        if (post) showPost(post);
      });
    });
  }

  // Show full post
  function showPost(post) {
    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.innerHTML = `
      <div class="modal-content">
        <button class="btn-close">&times;</button>
        <img src="${post.image}" alt="${post.title}" style="width:100%;border-radius:12px;margin-bottom:1rem">
        <h2>${post.title}</h2>
        <div class="post-meta" style="margin-bottom:1rem">
          <span class="post-date">${new Date(post.date).toLocaleDateString()}</span>
          <span class="post-author">By ${post.author}</span>
        </div>
        <div class="post-full-content">
          ${post.content}
        </div>
      </div>
    `;

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);

    // Close handlers
    dialog.querySelector('.btn-close').addEventListener('click', () => {
      document.body.removeChild(dialog);
      document.body.removeChild(backdrop);
    });
    backdrop.addEventListener('click', () => {
      document.body.removeChild(dialog);
      document.body.removeChild(backdrop);
    });
  }

  return { init: initBlog };
})();