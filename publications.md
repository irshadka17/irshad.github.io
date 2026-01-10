---
layout: default
title: Publications
---

# Publications

<p>This page loads publication metadata directly from DOIs.  
Update <code>assets/dois.txt</code> to add new papers.</p>

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

// Fetch citation count from OpenAlex
async function fetchOpenAlex(doi) {
  const url = `https://api.openalex.org/works/doi:${encodeURIComponent(doi)}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.cited_by_count || 0;
}

let publications = []; // store all publications

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
    // Year filter
    const yearMatch = (yearValue === 'all' || pub.year == yearValue);

    // Search filter
    const searchMatch =
      pub.title.toLowerCase().includes(searchValue) ||
      pub.authors.toLowerCase().includes(searchValue) ||
      pub.journal.toLowerCase().includes(searchValue);

    return yearMatch && searchMatch;
  });

  // Sorting
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

  // Render
  const container = document.getElementById('pub-container');
  container.innerHTML = filtered.map(renderPublication).join('');
}

// Main loader
async function loadPublications() {
  const container = document.getElementById('pub-container');
  container.innerHTML = '<p>Loading…</p>';

  const dois = await loadDOIs();
  publications = [];

  const years = new Set();

  for (const doi of dois) {
    try {
      const meta = await fetchCrossRef(doi);
      const citations = await fetchOpenAlex(doi);

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
        citations,
        doi
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

  // Initial render
  applyFilters();
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
</style>
