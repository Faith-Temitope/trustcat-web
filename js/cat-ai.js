// Cat AI Chat Assistant
const CatAI = (function() {
  // Knowledge base for cat-related queries
  const knowledgeBase = {
    // Interactive greetings
    'hello': 'Hello! I\'m CatAI, your feline knowledge assistant. Ask me anything about cats! Try asking about breeds, behavior, or fun facts!',
    'hi': 'Hi there! I\'m CatAI, ready to answer your cat questions! Want to learn something fascinating about cats?',
    'help': 'I can answer questions about cat behavior, health, breeds, and general facts. Try these topics: "colors", "hunting", "intelligence", "age", or "senses"!',
    
    // Emotions and personality
    'happy': 'Cats show happiness through purring, soft meows, relaxed posture, and slow blinking. Try slow blinking back at your cat - it\'s like a kitty kiss!',
    'sad': 'Cats can feel sad or depressed. Signs include hiding, loss of appetite, or excessive sleeping. Always consult a vet if behavior changes suddenly.',
    'angry': 'An angry cat may swish their tail, flatten ears, or growl. Give them space and time to calm down. Never punish a cat for showing these emotions.',
    'personality': 'Each cat has a unique personality! Some are outgoing, others shy. Some love water, others hate it. Environment and early experiences shape their character.',
    
    // Advanced behaviors
    'hunting': 'Cats are natural hunters with incredible skills! They can: \n- Jump 6x their length\n- Run at 30mph\n- Hear ultrasonic sounds\n- See in 1/6th the light humans need',
    'intelligence': 'Cats are highly intelligent! They can:\n- Understand 25-35 words\n- Solve puzzles\n- Remember solutions for years\n- Learn by observation\n- Manipulate simple mechanisms',
    'communication': 'Cats communicate through:\n- Vocalizations (25+ sounds)\n- Body language\n- Scent marking\n- Facial expressions\n- Tail positions',
    
    // Colors and patterns
    'colors': 'Cat coat colors include:\n- Black (most adopted)\n- White (often deaf if blue-eyed)\n- Orange (80% male)\n- Calico (99.9% female)\n- Tabby (most common pattern)\n- Color-point (like Siamese)',
    'pattern': 'Common cat patterns are:\n- Tabby (striped)\n- Tortoiseshell\n- Calico (tri-color)\n- Bicolor\n- Color-point\n- Ticked\nEach has unique genetics!',
    'eyes': 'Cat eye colors can be:\n- Gold\n- Green\n- Blue\n- Copper\n- Orange\n- Odd-eyed (different colors)\nThe color develops as they grow!',
    
    // Anatomy facts
    'skeleton': 'Cats have:\n- 230+ bones (humans have 206)\n- Flexible spine (can rotate 180°)\n- No collarbone (fit through small spaces)\n- Powerful leg muscles\n- Shock-absorbing paw pads',
    'senses': 'Cat senses are incredible:\n- See in 1/6th the light we need\n- Hear ultrasonic sounds\n- Sense earthquakes before they happen\n- Feel changes in air pressure\n- Smell 14x better than humans',
    'whiskers': 'Whiskers are amazing tools:\n- Work as measuring devices\n- Detect air currents\n- Show emotional state\n- Help with balance\n- Can grow back if damaged',
    
    // Life stages
    'kitten': 'Kitten development:\n0-2 weeks: Eyes open\n3-4 weeks: Walking\n4-8 weeks: Social learning\n8-12 weeks: Ready for adoption\n3-6 months: High energy\n6-12 months: Adolescence',
    'adult': 'Adult cats (1-7 years):\n- Need 2-3 meals daily\n- Sleep 16-20 hours\n- Should play 10-15 min several times daily\n- Regular vet checks\n- Maintain stable routine',
    'senior': 'Senior cats (7+ years):\n- Need more vet checks\n- May need special diet\n- Often more affectionate\n- Sleep more\n- May need help grooming',
    
    // Diet specifics
    'diet': 'Cats need:\n- High protein (meat-based)\n- Taurine (essential amino acid)\n- Fresh water\n- Small frequent meals\n- Age-appropriate food\nNever feed dogs food to cats!',
    'treats': 'Safe cat treats:\n- Commercial cat treats\n- Small bits of cooked meat\n- Some cats like plain yogurt\n- Catnip (most cats love it!)\nAvoid human food unless approved by vet.',
    'water': 'Cats need fresh water daily:\n- Many prefer running water\n- Some like wide bowls\n- Keep away from food\n- Change water daily\n- Consider a cat fountain',
    
    // Exercise and enrichment
    'play': 'Best cat toys:\n- Wand toys (supervised)\n- Laser pointers (end with catchable toy)\n- Crinkle balls\n- Catnip toys\n- Puzzle feeders\nRotate toys to keep interest!',
    'exercise': 'Indoor exercise ideas:\n- Cat trees\n- Window perches\n- Play tunnels\n- Climbing shelves\n- Interactive toys\nAim for several play sessions daily!',
    'enrichment': 'Mental stimulation:\n- Food puzzles\n- Training sessions\n- New toys\n- Exploring boxes\n- Window watching\n- Supervised outdoor time',
    
    // Behavior keywords
    'sleep': 'Cats sleep 16-20 hours a day to conserve energy. This is normal feline behavior!',
    'purr': 'Cats purr for many reasons - when happy, stressed, or even healing. The frequency (25-150Hz) can promote healing!',
    'meow': 'Cats mainly meow to communicate with humans, not other cats. Each cat develops a unique "language" with their owner!',
    'scratch': 'Scratching is natural behavior for cats - it marks territory, exercises muscles, and maintains claw health.',
    'knead': 'Kneading (making biscuits) is a behavior from kittenhood when nursing. It shows contentment and trust!',
    
    // Health keywords
    'food': 'Cats are obligate carnivores and need meat protein. Always provide fresh water and high-quality cat food.',
    'vet': 'Regular vet check-ups are important! Cats should visit annually for vaccinations and health checks.',
    'spay': 'Spaying/neutering is recommended for cats\' health and controlling the pet population.',
    'vaccine': 'Core vaccines for cats include: rabies, feline distemper (FVRCP), and feline leukemia (for outdoor cats).',
    'weight': 'The average adult cat should weigh 8-10 pounds. Obesity can lead to health issues.',
    
    // Care keywords
    'litter': 'Keep litter boxes clean and provide one box per cat plus one extra. Place them in quiet, accessible areas.',
    'groom': 'Regular grooming helps prevent hairballs and strengthens your bond with your cat.',
    'play': 'Daily play sessions are important for exercise and mental stimulation. Use toys that mimic prey movement.',
    'water': 'Cats need fresh water daily. Some prefer running water from fountains.',
    'indoor': 'Indoor cats typically live longer, safer lives than outdoor cats.',
    
    // Fun facts
    'whiskers': 'Cat whiskers are as wide as their body - they\'re used to measure if spaces are wide enough to pass through!',
    'jump': 'Cats can jump up to 6 times their length and always land on their feet due to the "righting reflex".',
    'speed': 'Cats can run at speeds up to 30 mph in short bursts.',
    'night': 'Cats can see in light six times dimmer than what humans need, thanks to special eye structures.',
    'memory': 'Cats have excellent long-term memory and can remember people and experiences for years.',
    
    // Social keywords
    'friend': 'Cats can form strong bonds with humans and other pets. Early socialization is key!',
    'alone': 'Most cats are fine alone for 8-12 hours but appreciate companionship. Consider two cats if you\'re away often.',
    'family': 'Cats can be great family pets! Supervise interactions with young children and teach gentle handling.',
    'stress': 'Cats can get stressed by changes in routine, new pets, or moving. Provide safe spaces and maintain routines.',
    'love': 'Cats show affection through purring, slow blinks, head bumps, and following you around.',
    
    // Breed-related
    'breed': 'There are over 40 recognized cat breeds, each with unique characteristics!',
    'siamese': 'Siamese cats are known for being vocal, intelligent, and social. They often bond strongly with one person.',
    'persian': 'Persian cats are gentle, quiet cats known for their long coat and flat face. They need regular grooming.',
    'maine': 'Maine Coons are large, gentle giants known as the "dogs of the cat world" for their friendly nature.',
    'ragdoll': 'Ragdolls are large, gentle cats known for going limp when held. They\'re great with families!',
    
    // Training
    'train': 'Cats can be trained using positive reinforcement! Clicker training works well for many cats.',
    'clicker': 'Clicker training marks desired behaviors instantly. Always follow the click with a treat!',
    'leash': 'Some cats can be leash-trained! Start indoor training early and be patient.',
    'scratch post': 'Provide multiple scratching posts of different materials. Reward use with treats and praise.',
    'litter train': 'Most cats naturally use litter boxes. Keep them clean and easily accessible.',
    
    // Emergency keywords
    'emergency': 'If your cat shows sudden behavior changes, stops eating, or seems ill, contact a vet immediately!',
    'sick': 'Signs of illness include: changes in appetite/thirst, lethargy, hiding, vomiting, or litter box changes.',
    'toxic': 'Common toxins: lilies, chocolate, onions, garlic, cleaning products. Call vet if ingested!',
    'hurt': 'If your cat is injured, stay calm and contact a vet. Keep a pet first-aid kit handy.',
    'help': 'For emergencies, contact your vet or find a 24-hour emergency vet clinic.',
    
    // Scientific facts
    'science': 'Cat science facts:\n- Share 90% DNA with humans\n- Can make 100 different sounds\n- Purr at healing frequencies\n- See UV light\n- Have unique nose prints like human fingerprints',
    'brain': 'Cat brain facts:\n- Similar structure to humans\n- 300 million neurons\n- Sleep cycles like humans\n- Dream during REM sleep\n- Excellent memory',
    'evolution': 'Cat evolution:\n- Descended from African wildcats\n- Domesticated ~9000 years ago\n- Helped protect grain storage\n- Spread globally via ships\n- Now 600+ million worldwide',
    
    // History and culture
    'history': 'Cats in history:\n- Worshipped in Ancient Egypt\n- Protected ships from rats\n- Considered magical in many cultures\n- Changed farming by controlling pests\n- Inspired countless artworks',
    'myths': 'Cat myths debunked:\n- Black cats aren\'t unlucky\n- Cats don\'t always land on feet\n- Milk isn\'t good for cats\n- They can be social and loyal\n- Indoor cats can be happy',
    'famous': 'Famous cats:\n- Grumpy Cat (internet sensation)\n- Trim (circumnavigated Australia)\n- Oscar (therapy cat)\n- Room 8 (school cat for 16 years)\n- Félicette (first cat in space)',
    
    // Modern life
    'technology': 'Cat tech innovations:\n- GPS trackers\n- Automated feeders\n- Smart litter boxes\n- Pet cameras\n- Interactive toys\n- Health monitoring devices',
    'apps': 'Useful cat apps:\n- Health trackers\n- Behavior monitors\n- Cat sound translators\n- Vet appointment managers\n- Pet photo organizers',
    'social': 'Cats on social media:\n- Most popular pet type\n- Millions of posts daily\n- Many celebrity cats\n- Growing influence\n- Educational content',
    
    // Environmental impact
    'environment': 'Cats and environment:\n- Keep rodent populations in check\n- Impact local wildlife if outdoor\n- Consider eco-friendly products\n- Use sustainable litter\n- Reduce pet waste',
    'eco': 'Eco-friendly cat care:\n- Biodegradable litter\n- Sustainable toys\n- Natural cleaning products\n- Bulk food to reduce packaging\n- Donate old supplies',
    'future': 'Future of cats:\n- Growing popularity\n- Better healthcare\n- Advanced nutrition\n- More indoor living\n- Increased lifespan',
    
    // Special needs
    'special': 'Special needs cats:\n- Can live full lives\n- Need extra care\n- Often very loving\n- Adapt well\n- Many resources available',
    'blind': 'Blind cats:\n- Navigate by whiskers\n- Learn house layout\n- Use other senses\n- Need consistent environment\n- Can live normally',
    'deaf': 'Deaf cats:\n- Often white with blue eyes\n- Very visual\n- Feel vibrations\n- Need visual signals\n- Can be trained with gestures'
  };

  // Function to find most relevant response
  function findBestMatch(query) {
    query = query.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    // Check for exact matches first
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (query.includes(key.toLowerCase())) {
        const score = key.length / query.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = value;
        }
      }
    }

    // If no match found, return default response
    return bestMatch || "I'm not sure about that, but I'd love to help you with questions about cat behavior, health, breeds, or care!";
  }

  // Load chat history from localStorage
  function loadChatHistory() {
    try {
      return JSON.parse(localStorage.getItem('catai_chat_history') || '[]');
    } catch (e) {
      console.warn('Failed to load chat history:', e);
      return [];
    }
  }

  // Save chat history to localStorage
  function saveChatHistory(messages) {
    try {
      localStorage.setItem('catai_chat_history', JSON.stringify(messages.slice(-50))); // Keep last 50 messages
    } catch (e) {
      console.warn('Failed to save chat history:', e);
    }
  }

  // Initialize chat interface
  function initChat() {
    const chatHTML = `
      <div id="cat-ai-chat" style="position:fixed;bottom:20px;right:20px;width:300px;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:1000;overflow:hidden;display:none">
        <div style="padding:12px;background:#0ea5e9;color:white;display:flex;justify-content:space-between;align-items:center">
          <span>CatAI Assistant</span>
          <div>
            <button id="clear-chat" style="background:none;border:none;color:white;cursor:pointer;margin-right:8px" title="Clear Chat">🗑️</button>
            <button id="close-cat-ai" style="background:none;border:none;color:white;cursor:pointer">&times;</button>
          </div>
        </div>
        <div id="chat-messages" style="height:300px;overflow-y:auto;padding:12px"></div>
        <div style="padding:12px;border-top:1px solid #e6eef6">
          <input type="text" id="chat-input" placeholder="Ask about cats..." style="width:100%;padding:8px;border:1px solid #e6eef6;border-radius:8px">
        </div>
      </div>
      <button id="open-cat-ai" style="position:fixed;bottom:20px;right:20px;background:#0ea5e9;color:white;border:none;border-radius:999px;padding:12px 20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">🐱</span> Ask About Cats
      </button>
    `;

    // Add chat interface to page
    const div = document.createElement('div');
    div.innerHTML = chatHTML;
    document.body.appendChild(div);

    // Wire up chat functionality
    const chatDiv = document.getElementById('cat-ai-chat');
    const openBtn = document.getElementById('open-cat-ai');
    const closeBtn = document.getElementById('close-cat-ai');
    const input = document.getElementById('chat-input');
    const messages = document.getElementById('chat-messages');

    // Toggle chat visibility
    openBtn.addEventListener('click', () => {
      chatDiv.style.display = 'block';
      openBtn.style.display = 'none';
      input.focus();
    });

    closeBtn.addEventListener('click', () => {
      chatDiv.style.display = 'none';
      openBtn.style.display = 'block';
    });

    // Handle input
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        // Add user message
        addMessage('user', input.value);
        
        // Get and add AI response
        const response = findBestMatch(input.value);
        addMessage('ai', response);
        
        // Clear input
        input.value = '';
      }
    });

    // Helper to add messages
    function addMessage(type, text, skipSave = false) {
      const div = document.createElement('div');
      div.style.marginBottom = '8px';
      div.style.padding = '8px 12px';
      div.style.borderRadius = '12px';
      div.style.maxWidth = '80%';
      div.style.animation = 'fadeIn 0.3s ease';
      
      if (type === 'user') {
        div.style.backgroundColor = '#f1f5f9';
        div.style.marginLeft = 'auto';
      } else {
        div.style.backgroundColor = '#e6eef6';
      }
      
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;

      // Save to history if needed
      if (!skipSave) {
        const history = loadChatHistory();
        history.push({ type, text, timestamp: new Date().toISOString() });
        saveChatHistory(history);
      }
    }

    // Load chat history
    const history = loadChatHistory();
    if (history.length > 0) {
      history.forEach(msg => addMessage(msg.type, msg.text, true));
    } else {
      addMessage('ai', 'Hi! I\'m CatAI, your feline knowledge assistant. Ask me anything about cats!');
    }

    // Wire clear chat button
    document.getElementById('clear-chat')?.addEventListener('click', () => {
      messages.innerHTML = '';
      localStorage.removeItem('catai_chat_history');
      addMessage('ai', 'Chat history cleared. How can I help you?');
    });

    // Restore chat state
    const wasOpen = localStorage.getItem('catai_chat_open') === 'true';
    if (wasOpen) {
      chatDiv.style.display = 'block';
      openBtn.style.display = 'none';
    }

    // Remember chat state
    window.addEventListener('beforeunload', () => {
      localStorage.setItem('catai_chat_open', chatDiv.style.display === 'block');
    });
  }

  // Public API
  return {
    init: initChat,
    getResponse: findBestMatch
  };
})();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
  CatAI.init();
});