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

// Load quatrain
loadBtn.addEventListener('click', displayQuatrain);
quatrainSelect.addEventListener('keydown', e => e.key === 'Enter' && displayQuatrain());

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

// Random
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

// Previous Quatrain
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

// Next Quatrain
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

// Modal functionality
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