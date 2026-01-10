---
layout: default
title: Publications
---

# Publications
### Peer Reviewed Journal Publications

<!--
This page loads publication metadata directly from DOIs.
Update assets/dois.txt to add new papers.
-->

<!-- Citation Timeline at Top -->
<div style="margin-bottom: 3rem;">
  <canvas id="citationChart"></canvas>
</div>

<!-- Controls -->
<div id="controls" style="margin-bottom: 1.5rem;">

  <!-- Search -->
  <label><strong>Search:</strong></label>
  <input type="text" id="searchInput" placeholder="Search title, author, journal…" style="padding: 4px 8px; width: 250px;">

  <!-- Year Filter -->
  <label style="margin-left: 1rem;"><strong>Year:</strong></label>
  <select id="yearFilter">
    <option value="all">All Years</option>
  </select>

  <!-- Sort -->
  <label style="margin-left: 1rem;"><strong>Sort by:</strong></label>
  <select id="sortSelect">
    <option value="year-desc">Year (newest first)</option>
    <option value="year-asc">Year (oldest first)</option>
    <option value="citations-desc">Citations (high → low)</option>
    <option value="citations-asc">Citations (low → high)</option>
    <option value="title-asc">Title (A → Z)</option>
    <option value="title-desc">Title (Z → A)</option>
  </select>

</div>

<!-- Publications -->
<div id="pub-container">
  <p>Loading publications…</p>
</div>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// ------------------------------
// CONFIG
// ------------------------------
const CACHE_DURATION_HOURS = 24; // cache expires after 24 hours

// ------------------------------
// CACHE HELPERS
// ------------------------------
function getCacheKey(doi) {
  return `pubcache_${doi}`;
}

function loadFromCache(doi) {
  const key = getCacheKey(doi);
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    if (ageHours > CACHE_DURATION_HOURS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveToCache(doi, crossref, openalex) {
  const key = getCacheKey(doi);
  localStorage.setItem(key, JSON.stringify({
    crossref,
    openalex,
    timestamp: Date.now()
  }));
}

// ------------------------------
// API FETCHERS WITH CACHING
// ------------------------------
async function fetchPublicationData(doi) {
  const cached = loadFromCache(doi);
  if (cached) return cached;

  const crossref = await fetchCrossRef(doi);
  const openalex = await fetchOpenAlex(doi);

  saveToCache(doi, crossref, openalex);
  return { crossref, openalex };
}

// ------------------------------
// RAW API CALLS
// ------------------------------
async function loadDOIs() {
  const response = await fetch('{{ "/assets/dois.txt" | relative_url }}');
  const text = await response.text();
  return text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
}

async function fetchCrossRef(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const response = await fetch(url);
  return (await response.json()).message;
}

async function fetchOpenAlex(doi) {
  const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`;
  const response = await fetch(url);
  const data = await response.json();
  return {
    citations: data.cited_by_count || 0,
    history: data.counts_by_year || []
  };
}

// ------------------------------
// RENDERING + FILTERING
// ------------------------------
let publications = [];
let citationHistory = {};

function renderPublication(pub) {
  return `
    <div class="pub-card">
      <h3>${pub.title}</h3>
      <p><strong>Authors:</strong> ${pub.authors}</p>
      <p><strong>Journal:</strong> ${pub.journal} (${pub.year})</p>
      <p><strong>Volume:</strong> ${pub.volume || '—'}  
         <strong>Issue:</strong> ${pub.issue || '—'}  
         <strong>Pages:</strong> ${pub.pages || '—'}</p>
      <p><strong>Citations:</strong> ${pub.citations}</p>
      <p><a href="https://doi.org/${pub.doi}" target="_blank">DOI: ${pub.doi}</a></p>
    </div>
    <hr>
  `;
}

function applyFilters() {
  const yearValue = document.getElementById('yearFilter').value;
  const searchValue = document.getElementById('searchInput').value.toLowerCase();
  const sortValue = document.getElementById('sortSelect').value;

  let filtered = publications.filter(pub => {
    const yearMatch = (yearValue === 'all' || pub.year == yearValue);
    const searchMatch =
      pub.title.toLowerCase().includes(searchValue) ||
      pub.authors.toLowerCase().includes(searchValue) ||
      pub.journal.toLowerCase().includes(searchValue);
    return yearMatch && searchMatch;
  });

  filtered.sort((a, b) => {
    switch (sortValue) {
      case 'year-desc': return b.year - a.year;
      case 'year-asc': return a.year - b.year;
      case 'citations-desc': return b.citations - a.citations;
      case 'citations-asc': return a.citations - b.citations;
      case 'title-asc': return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
    }
  });

  document.getElementById('pub-container').innerHTML =
    filtered.map(renderPublication).join('');
}

// ------------------------------
// DUAL‑AXIS CHART
// ------------------------------
function drawCitationChart() {
  const ctx = document.getElementById('citationChart').getContext('2d');

  const years = Object.keys(citationHistory).sort((a, b) => a - b);
  const citationCounts = years.map(y => citationHistory[y]);

  // Count publications per year
  const pubCounts = years.map(y =>
    publications.filter(p => p.year == y).length
  );

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Citations per Year',
          data: citationCounts,
          borderColor: '#007acc',
          backgroundColor: 'rgba(0, 122, 204, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Publications per Year',
          data: pubCounts,
          borderColor: '#cc5500',
          backgroundColor: 'rgba(204, 85, 0, 0.2)',
          fill: false,
          tension: 0.3,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      plugins: { legend: { display: true }},
      scales: {
        x: { title: { display: true, text: 'Year' }},
        y: { 
          title: { display: true, text: 'Citations per Year' },
          beginAtZero: true,
          position: 'left'
        },
        y1: {
          title: { display: true, text: 'Publications per Year' },
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// ------------------------------
// MAIN LOADER
// ------------------------------
async function loadPublications() {
  const container = document.getElementById('pub-container');
  container.innerHTML = '<p>Loading…</p>';

  const dois = await loadDOIs();
  publications = [];
  citationHistory = {};
  const years = new Set();

  for (const doi of dois) {
    try {
      const { crossref, openalex } = await fetchPublicationData(doi);

      const authors = crossref.author
        ? crossref.author.map(a => `${a.given} ${a.family}`).join(', ')
        : 'Unknown authors';

      const title = crossref.title ? crossref.title[0] : 'Untitled';
      const journal = crossref['container-title'] ? crossref['container-title'][0] : 'Unknown journal';
      const year = crossref.issued ? crossref.issued['date-parts'][0][0] : '—';
      const volume = crossref.volume || '';
      const issue = crossref.issue || '';
      const pages = crossref.page || '';

      years.add(year);

      publications.push({
        title,
        authors,
        journal,
        year,
        volume,
        issue,
        pages,
        citations: openalex.citations,
        doi
      });

      openalex.history.forEach(entry => {
        const y = entry.year;
        const c = entry.cited_by_count;
        citationHistory[y] = (citationHistory[y] || 0) + c;
      });

    } catch (err) {
      container.innerHTML += `<p>Error loading DOI ${doi}</p>`;
    }
  }

  const yearFilter = document.getElementById('yearFilter');
  [...years].sort((a, b) => b - a).forEach(y => {
    yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
  });

  applyFilters();
  drawCitationChart();
}

// ------------------------------
// EVENT LISTENERS
// ------------------------------
document.getElementById('yearFilter').addEventListener('change', applyFilters);
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('sortSelect').addEventListener('change', applyFilters);

loadPublications();
</script>

<style>
.pub-card {
  margin-bottom: 1.5rem;
}
#controls select, #controls input {
  padding: 4px 8px;
}
</style>
