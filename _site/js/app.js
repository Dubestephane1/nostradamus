// js/app.js
const centurySelect = document.getElementById('centurySelect');
const quatrainSelect = document.getElementById('quatrainSelect');
const loadBtn = document.getElementById('loadBtn');
const randomBtn = document.getElementById('randomBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const quatrainSection = document.getElementById('quatrainSection');
const quatrainTitle = document.getElementById('quatrainTitle');
const frenchText = document.getElementById('frenchText');
const englishText = document.getElementById('englishText');
const interpretationText = document.getElementById('interpretationText');

let currentData = {}; // Stores loaded century

// Global for search data
let quatrainsData = [];
let fuse = null; // Fuse index

// Function to load all century JSONs and build search index
async function loadAllQuatrainsForSearch() {
  const centuries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Adjust if you have extras
  for (let c = 1; c <= centuries.length; c++) {
    try {
      // FIXED: Match your main loader's path
      const response = await fetch(`js/data/century${c}.json`);
      if (!response.ok) throw new Error(`Century ${c} not found`);
      const centuryData = await response.json();
      Object.entries(centuryData).forEach(([quatrainNum, qData]) => {
        quatrainsData.push({
          id: `${c}:${quatrainNum}`,
          century: c,
          quatrain: parseInt(quatrainNum),
          french: qData.french.join(' '), // Flatten array for search
          english: qData.english.join(' '),
          interpretation: qData.interpretation,
          video: qData.video || '',
          image: qData.image || ''
        });
      });
    } catch (error) {
      console.warn(`Century ${c} JSON load failed:`, error); // Graceful if a file's missing
    }
  }

  // Build Fuse index once all loaded
  fuse = new Fuse(quatrainsData, {
    keys: ['french', 'english', 'interpretation'],
    threshold: 0.3, // Fuzzy tolerance
    includeScore: true,
    ignoreLocation: true
  });

  console.log(`Search ready: ${quatrainsData.length} quatrains indexed!`);
}

// Helper: Your existing loadQuatrain, or add if missing
function loadQuatrain(id) {
  const [century, quatrain] = id.split(':');
  centurySelect.value = century;
  // FIXED: Trigger the change event to load century first
  centurySelect.dispatchEvent(new Event('change'));
  setTimeout(() => { // Wait for async load
    quatrainSelect.value = quatrain;
    displayQuatrain();
  }, 300);
  searchInput.value = ''; // Clear search
  searchResults.classList.add('hidden');
}

// MOVED: Timeline observer setup (once on load, not per display)
function initTimelineObserver() {
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in'); // Your CSS: opacity:0 to 1
      }
    });
  });
  document.querySelectorAll('.timeline-event').forEach(el => timelineObserver.observe(el));
}

// Load quatrain (unchanged, but timeline observer removed)
function displayQuatrain() {
  const century = centurySelect.value;
  const quatrainNum = quatrainSelect.value;
  const quatrain = currentData[quatrainNum];
  if (!quatrain) return;

  // Update title
  quatrainTitle.textContent = `Century ${century} - Quatrain ${quatrainNum}`;

  // Clear previous content
  frenchText.innerHTML = '';
  englishText.innerHTML = '';

  // Display French and English lines
  quatrain.french.forEach((line, index) => {
    const frenchP = document.createElement('p');
    frenchP.textContent = line;
    frenchP.className = 'quatrain-line';
    frenchText.appendChild(frenchP);

    const englishP = document.createElement('p');
    englishP.textContent = quatrain.english[index];
    englishP.className = 'quatrain-line';
    englishText.appendChild(englishP);
  });

  // Display interpretation
  interpretationText.textContent = quatrain.interpretation;

  // Handle video
  const videoEmbedContainer = document.getElementById('videoEmbedContainer');
  const videoEmbed = document.getElementById('videoEmbed');
  
  if (quatrain.video) {
    let embedUrl = quatrain.video;
    
    // Handle standard YouTube URLs
    if (embedUrl.includes('youtube.com/watch?v=')) {
      const videoId = embedUrl.split('v=')[1].split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtu.be short URLs
    else if (embedUrl.includes('youtu.be/')) {
      const videoId = embedUrl.split('youtu.be/')[1].split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    videoEmbed.src = embedUrl;
    videoEmbedContainer.classList.remove('hidden');
  } else {
    videoEmbed.src = '';
    videoEmbedContainer.classList.add('hidden');
  }

  // Handle image
  const quatrainImageContainer = document.getElementById('quatrainImageContainer');
  const quatrainImage = document.getElementById('quatrainImage');
  
  if (quatrain.image) {
    quatrainImage.src = `images/${quatrain.image}`;
    quatrainImage.alt = `Image for Quatrain ${quatrainNum}`;
    quatrainImageContainer.classList.remove('hidden');
  } else {
    quatrainImage.src = '';
    quatrainImageContainer.classList.add('hidden');
  }

  // Show the section
  quatrainSection.classList.remove('hidden');
  quatrainSection.scrollIntoView({ behavior: 'smooth' });

  // Update navigation buttons
  updateNavigationButtons(century, quatrainNum);
}

// WRAPPED: All init in DOMContentLoaded for safety/order
document.addEventListener('DOMContentLoaded', () => {
  loadAllQuatrainsForSearch(); // Load search index
  initTimelineObserver(); // Set timeline once

  // Populate centuries
  for (let i = 1; i <= 10; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Century ${i}`;
    centurySelect.appendChild(opt);
  }

  // Load century data
  centurySelect.addEventListener('change', async () => {
    const century = centurySelect.value;
    quatrainSelect.innerHTML = '<option>Select Quatrain</option>';
    quatrainSelect.disabled = true;
    loadBtn.disabled = true;

    if (!century) return;

    try {
      const res = await fetch(`js/data/century${century}.json`);
      if (!res.ok) throw new Error('Century not found');
      currentData = await res.json();

      // Populate quatrains
      Object.keys(currentData).sort((a, b) => a - b).forEach(num => {
        const opt = document.createElement('option');
        opt.value = num;
        opt.textContent = `Quatrain ${num}`;
        quatrainSelect.appendChild(opt);
      });
      quatrainSelect.disabled = false;
    } catch (err) {
      alert('Failed to load century data. Check console.');
      console.error(err);
    }
  });

  // Enable load button
  quatrainSelect.addEventListener('change', () => {
    loadBtn.disabled = !quatrainSelect.value;
  });

  // Load quatrain — navigate to dedicated quatrain page
  loadBtn.addEventListener('click', () => {
    const century = centurySelect.value;
    const quatrainNumber = quatrainSelect.value;
    if (!century || !quatrainNumber) return;
    window.location.href = `/c${century}/q${quatrainNumber.toString().padStart(3, '0')}/`;
  });
  quatrainSelect.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const century = centurySelect.value;
      const quatrainNumber = quatrainSelect.value;
      if (century && quatrainNumber) {
        window.location.href = `/c${century}/q${quatrainNumber.toString().padStart(3, '0')}/`;
      }
    }
  });
});

// Random (unchanged)
randomBtn.addEventListener('click', () => {
  const centuries = Array.from({length: 10}, (_, i) => i + 1);
  const randomCentury = centuries[Math.floor(Math.random() * centuries.length)];
  
  centurySelect.value = randomCentury;
  centurySelect.dispatchEvent(new Event('change'));
  
  setTimeout(() => {
    const quatrains = Object.keys(currentData);
    const randomQ = quatrains[Math.floor(Math.random() * quatrains.length)];
    quatrainSelect.value = randomQ;
    displayQuatrain();
  }, 300);
});

// Previous Quatrain (unchanged, but add updateNavigationButtons if missing below)
prevBtn.addEventListener('click', () => {
  const currentQuatrain = parseInt(quatrainSelect.value);
  const quatrains = Object.keys(currentData).map(Number).sort((a, b) => a - b);
  const currentIndex = quatrains.indexOf(currentQuatrain);
  
  if (currentIndex > 0) {
    // Go to previous quatrain in current century
    quatrainSelect.value = quatrains[currentIndex - 1];
    displayQuatrain();
  } else {
    // Go to previous century, last quatrain
    const currentCentury = parseInt(centurySelect.value);
    if (currentCentury > 1) {
      centurySelect.value = currentCentury - 1;
      centurySelect.dispatchEvent(new Event('change'));
      setTimeout(() => {
        const newQuatrains = Object.keys(currentData).map(Number).sort((a, b) => a - b);
        quatrainSelect.value = newQuatrains[newQuatrains.length - 1];
        displayQuatrain();
      }, 300);
    }
  }
});

// Next Quatrain (unchanged)
nextBtn.addEventListener('click', () => {
  const currentQuatrain = parseInt(quatrainSelect.value);
  const quatrains = Object.keys(currentData).map(Number).sort((a, b) => a - b);
  const currentIndex = quatrains.indexOf(currentQuatrain);
  
  if (currentIndex < quatrains.length - 1) {
    // Go to next quatrain in current century
    quatrainSelect.value = quatrains[currentIndex + 1];
    displayQuatrain();
  } else {
    // Go to next century, first quatrain
    const currentCentury = parseInt(centurySelect.value);
    if (currentCentury < 10) {
      centurySelect.value = currentCentury + 1;
      centurySelect.dispatchEvent(new Event('change'));
      setTimeout(() => {
        const newQuatrains = Object.keys(currentData).map(Number).sort((a, b) => a - b);
        quatrainSelect.value = newQuatrains[0];
        displayQuatrain();
      }, 300);
    }
  }
});

// Modal functionality (unchanged)
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModalBtn = document.getElementById('closeModal');
const quatrainImage = document.getElementById('quatrainImage');

quatrainImage.addEventListener('click', () => {
  if (quatrainImage.src) {
    modalImage.src = quatrainImage.src;
    modalImage.alt = quatrainImage.alt;
    imageModal.classList.remove('hidden');
  }
});

closeModalBtn.addEventListener('click', () => {
  imageModal.classList.add('hidden');
});

imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    imageModal.classList.add('hidden');
  }
});

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// IMPROVED: Debounce search for perf (optional, but smooths rapid typing)
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (!fuse) return; // Wait for index to load
    const query = e.target.value.trim();
    searchResults.innerHTML = '';
    searchResults.classList.add('hidden');

    if (query.length < 2) return;

    const results = fuse.search(query);
    if (results.length > 0) {
      results.slice(0, 10).forEach(result => {
        const item = result.item;
        const quatrainUrl = `/c${item.century}/q${String(item.quatrain).padStart(3, '0')}/`;
        const resultDiv = document.createElement('div');
        resultDiv.className = 'p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 border border-amber-600';
        resultDiv.innerHTML = `
          <strong class="text-amber-300">Century ${item.century}, Quatrain ${item.quatrain}</strong><br>
          <small class="text-gray-400">${item.english.substring(0, 100)}...</small><br>
          <a href="${quatrainUrl}" class="text-amber-400 hover:underline block mt-1">View Full →</a>
        `;
        resultDiv.addEventListener('click', (e) => {
          if (!e.target.closest('a')) window.location.href = quatrainUrl;
        });
        searchResults.appendChild(resultDiv);
      });
      searchResults.classList.remove('hidden');
    } else {
      searchResults.innerHTML = '<div class="p-3 text-gray-500 italic bg-gray-800 rounded-lg">No matches—try "comet" or "guerre"?</div>';
      searchResults.classList.remove('hidden');
    }
  }, 200); // 200ms debounce
});

// ADDED: updateNavigationButtons stub (if you call it but didn't define—toggle prev/next disable)
function updateNavigationButtons(century, quatrainNum) {
  const quatrains = Object.keys(currentData).map(Number).sort((a, b) => a - b);
  const currentIndex = quatrains.indexOf(parseInt(quatrainNum));
  prevBtn.disabled = currentIndex === 0 && parseInt(century) === 1;
  nextBtn.disabled = currentIndex === quatrains.length - 1 && parseInt(century) === 10;
}
