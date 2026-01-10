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

<!-- Two-column layout -->
<div id="pub-layout" style="display: flex; gap: 2rem; align-items: flex-start;">

  <!-- LEFT COLUMN: Publications -->
  <div id="pub-left" style="flex: 3; min-width: 300px;">

    <!-- Search + Filters + Sort Controls -->
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

    <div id="pub-container">
      <p>Loading publications…</p>
    </div>

  </div>

  <!-- RIGHT COLUMN: Citation Timeline -->
  <div id="pub-right" style="flex: 2; min-width: 250px;">
    <canvas id="citationChart"></canvas>
  </div>

</div>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
// Load DOI list
async function loadDOIs() {
  const response = await fetch('{{ "/assets/dois.txt" | relative_url }}');
  const text = await response.text();
  return text.split('\n').map(d => d.trim()).filter(d => d.length > 0);
}

// Fetch metadata from CrossRef
async function fetchCrossRef(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const response = await fetch(url);
  return (await response.json()).message;
}

// Fetch citation count + history from OpenAlex
async function fetchOpenAlex(doi) {
  const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`;
  const response = await fetch(url);
  const data = await response.json();
  return {
    citations: data.cited_by_count || 0,
    history: data.counts_by_year || []
  };
}

let publications = []; // store all publications
let citationHistory = {}; // year → total citations

// Render publication card
function renderPublication(pub) {
  return `
    <div class="pub-card" data-year="${pub.year}" data-citations="${pub.citations}">
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

// Apply search + year filter + sort
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

  const container = document.getElementById('pub-container');
  container.innerHTML = filtered.map(renderPublication).join('');
}

// Draw citation timeline
function drawCitationChart() {
  const ctx = document.getElementById('citationChart').getContext('2d');

  const years = Object.keys(citationHistory).sort((a, b) => a - b);
  const counts = years.map(y => citationHistory[y]);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        data: counts,
        borderColor: '#007acc',
        backgroundColor: 'rgba(0, 122, 204, 0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: false } },
        y: { title: { display: false }, beginAtZero: true }
      }
    }
  });
}

// Main loader
async function loadPublications() {
  const container = document.getElementById('pub-container');
  container.innerHTML = '<p>Loading…</p>';

  const dois = await loadDOIs();
  publications = [];
  citationHistory = {};
  const years = new Set();

  for (const doi of dois) {
    try {
      const meta = await fetchCrossRef(doi);
      const openalex = await fetchOpenAlex(doi);

      const authors = meta.author
        ? meta.author.map(a => `${a.given} ${a.family}`).join(', ')
        : 'Unknown authors';

      const title = meta.title ? meta.title[0] : 'Untitled';
      const journal = meta['container-title'] ? meta['container-title'][0] : 'Unknown journal';
      const year = meta.issued ? meta.issued['date-parts'][0][0] : '—';
      const volume = meta.volume || '';
      const issue = meta.issue || '';
      const pages = meta.page || '';

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

      // Aggregate citation history
      openalex.history.forEach(entry => {
        const y = entry.year;
        const c = entry.cited_by_count;
        citationHistory[y] = (citationHistory[y] || 0) + c;
      });

    } catch (err) {
      container.innerHTML += `<p>Error loading DOI ${doi}</p>`;
    }
  }

  // Populate year dropdown
  const yearFilter = document.getElementById('yearFilter');
  [...years].sort((a, b) => b - a).forEach(y => {
    yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
  });

  applyFilters();
  drawCitationChart();
}

// Event listeners
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
@media (max-width: 900px) {
  #pub-layout {
    flex-direction: column;
  }
}
</style>
