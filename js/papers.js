// List of paper files - add new papers here
const PAPER_FILES = [
  'paper1.json',
  'paper2.json',
  'paper3.json',
  'paper4.json',
  'paper5.json',
  'paper6.json'
];

async function loadPapers() {
  const papers = [];
  for (const file of PAPER_FILES) {
    try {
      const response = await fetch(`papers/${file}`);
      if (response.ok) {
        papers.push(await response.json());
      }
    } catch (e) {
      console.warn(`Could not load ${file}`);
    }
  }
  return papers;
}

function renderPaperHTML(paper) {
  const authors = paper.authors.map(a => {
    const name = typeof a === 'string' ? a : a.name;
    const url = typeof a === 'object' ? a.url : null;
    const isHighlight = name === paper.authorHighlight;
    
    let html = isHighlight ? `<strong>${name}</strong>` : name;
    if (url) {
      html = `<a href="${url}" target="_blank" class="author-link">${html}</a>`;
    }
    return html;
  }).join(', ');
  
  const links = Object.entries(paper.links || {}).map(([type, url]) => 
    `<a href="${url}" target="_blank">[${type.charAt(0).toUpperCase() + type.slice(1)}]</a>`
  ).join(' ');

  return `
    <div class="paper">
      <p class="paper-title">
        <a href="${paper.links?.paper || '#'}" target="_blank">${paper.title}</a>
      </p>
      <p class="paper-authors">${authors}</p>
      <p class="paper-venue">${paper.venue}, ${paper.year}</p>
      <p class="paper-links">${links}</p>
    </div>
  `;
}

// For homepage - show only featured papers
async function renderFeaturedPapers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const papers = await loadPapers();
  const featured = papers.filter(p => p.featured);
  
  container.innerHTML = featured.map(renderPaperHTML).join('');
}

// For publications page - show all papers grouped by year
async function renderAllPapers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const papers = await loadPapers();
  
  // Group by year
  const byYear = {};
  papers.forEach(p => {
    const year = p.year.toString();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(p);
  });
  
  // Sort years (Preprint last, then descending)
  const years = Object.keys(byYear).sort((a, b) => {
    if (a === 'Preprint') return 1;
    if (b === 'Preprint') return -1;
    return parseInt(b) - parseInt(a);
  });
  
  let html = '';
  for (const year of years) {
    const label = year === 'Preprint' ? 'Preprints' : year;
    html += `<h2>${label}</h2>`;
    html += byYear[year].map(renderPaperHTML).join('');
  }
  
  container.innerHTML = html;
}

