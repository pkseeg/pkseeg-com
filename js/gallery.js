// List of gallery update files - add new updates here
const GALLERY_FILES = [
  'update1.json',
  'update2.json',
  'update3.json'
];

async function loadGalleryUpdates() {
  const updates = [];
  for (const file of GALLERY_FILES) {
    try {
      const response = await fetch(`gallery/${file}`);
      if (response.ok) {
        updates.push(await response.json());
      }
    } catch (e) {
      console.warn(`Could not load ${file}`);
    }
  }
  // Sort by sortDate descending
  return updates.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
}

function renderUpdateHTML(update) {
  let photosHTML = '';
  
  if (update.photos && update.photos.length > 0) {
    const photoItems = update.photos.map(photo => 
      `<img src="${photo}" alt="${update.title}">`
    ).join('');
    photosHTML = `<div class="photo-grid">${photoItems}</div>`;
  } else {
    // Show placeholder if no photos
    photosHTML = `
      <div class="photo-grid">
        <div class="photo-placeholder"><span>Add photos</span></div>
      </div>
    `;
  }

  return `
    <div class="update">
      <span class="update-date">${update.date}</span>
      <h3>${update.title}</h3>
      <p>${update.description}</p>
      ${photosHTML}
    </div>
  `;
}

async function renderGallery(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const updates = await loadGalleryUpdates();
  container.innerHTML = updates.map(renderUpdateHTML).join('');
}

