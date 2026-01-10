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
<div style="display: flex; gap: 20px; margin-bottom: 3rem;">

  <!-- Left: Chart -->
  <div style="width: 50%; min-width: 300px;">
    <canvas id="citationChart"></canvas>
  </div>

  <!-- Right: Stats Table -->
  <div style="width: 50%; min-width: 300px;">
    <table id="citationStatsTable" style="width: 100%; border-collapse: collapse;">
      <!-- JS will fill this -->
    </table>
  </div>

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
<!-- ========================= -->
<!--   CONFERENCE PROCEEDINGS -->
<!-- ========================= -->

<h2 style="margin-top: 3rem;">Conference Proceedings & Publications</h2>
<div id="conferenceProceedings">
  <p>Loading conference proceedings…</p>
</div>

<!-- ========================= -->
<!--   CONFERENCE APPEARANCES -->
<!-- ========================= -->

<h2 style="margin-top: 3rem;">Appearances in National / International Conferences</h2>
<div id="conferenceAppearances">
  <p>Loading conference appearances…</p>
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

function renderPublication(pub, index) {
  return `
    <div class="pub-card" style="display: flex; gap: 16px; align-items: flex-start;">

      <!-- Number column -->
      <div style="
        width: 40px;
        text-align: right;
        font-weight: bold;
        font-size: 1.2em;
        padding-top: 4px;
      ">
        ${index + 1}.
      </div>

      <!-- Publication details column -->
      <div style="flex: 1;">
        <h3 style="margin-top: 0;">${pub.title}</h3>
        <p><strong>Authors:</strong> ${pub.authors}</p>
        <p><strong>Journal:</strong> ${pub.journal} (${pub.year})</p>
        <p>
          <strong>Volume:</strong> ${pub.volume || '—'}  
          <strong>Issue:</strong> ${pub.issue || '—'}  
          <strong>Pages:</strong> ${pub.pages || '—'}
        </p>
        <p><strong>Citations:</strong> ${pub.citations}</p>
        <p><a href="https://doi.org/${pub.doi}" target="_blank">DOI: ${pub.doi}</a></p>
      </div>

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
    filtered.map((pub, i) => renderPublication(pub, i)).join('');

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

// ------------------------------
// LOAD CITATION STATS TABLE
// ------------------------------
async function loadCitationStats() {
  const table = document.getElementById("citationStatsTable");

  try {
    const response = await fetch('{{ "/assets/citation_stats.txt" | relative_url }}');
    const text = await response.text();

    const rows = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.split(/[:,]/)); // supports "A: B" or "A,B"

    table.innerHTML = rows
      .map(([label, value]) => `
        <tr>
          <td style="padding: 6px; font-weight: bold; border-bottom: 1px solid #ddd;">${label}</td>
          <td style="padding: 6px; border-bottom: 1px solid #ddd;">${value}</td>
        </tr>
      `)
      .join("");

  } catch (err) {
    table.innerHTML = "<tr><td>Error loading stats</td></tr>";
  }
}
// ------------------------------
// LOAD TEXT FILE + NUMBERING + URL AUTO-LINKING
// ------------------------------
async function loadTextSection(url, elementId) {
  const container = document.getElementById(elementId);

  try {
    const response = await fetch(url);
    const text = await response.text();

    const rawLines = text
      .split("\n")
      .map(line => line.replace(/\r/g, "").trimEnd())
      .filter(line => line.length > 0);

    let entries = [];
    let current = [];

    rawLines.forEach(line => {
      // Continuation line if starts with "-", tab, or leading spaces
      if (/^[-\t ]/.test(line)) {
        current.push(line.replace(/^[-\t ]+/, "")); // remove leading markers
      } else {
        if (current.length > 0) entries.push(current);
        current = [line.trim()];
      }
    });

    if (current.length > 0) entries.push(current);

    const html = entries
      .map((entry, index) => {
        const main = entry[0];
        const subs = entry.slice(1);

        return `
          <div style="display: flex; gap: 12px; margin-bottom: 10px;">
            
            <!-- Number column -->
            <div style="
              width: 32px;
              text-align: right;
              font-weight: bold;
            ">
              ${index + 1}.
            </div>

            <!-- Text column -->
            <div style="flex: 1;">
              <div>${convertToLinks(main)}</div>

              ${
                subs
                  .map(
                    sub => `
                    <div>
                      ${convertToLinks(sub)}
                    </div>
                  `
                  )
                  .join("")
              }
            </div>

          </div>
        `;
      })
      .join("");

    container.innerHTML = html;

  } catch (err) {
    container.innerHTML = "<p>Error loading section.</p>";
  }
}

// ------------------------------
// Convert URLs and DOIs into styled clickable links
// ------------------------------
function convertToLinks(text) {
  // Detect DOI patterns
  const doiRegex = /\b10\.\d{4,9}\/[^\s]+/g;

  // Detect normal URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Convert DOI to clickable link but KEEP original text
  text = text.replace(doiRegex, doi => {
    const url = `https://doi.org/${doi}`;
    return `
      <a href="${url}" target="_blank" 
         style="color:#0066cc; text-decoration:underline;">
         ${doi} <span style="font-size:0.9em;">🔗</span>
      </a>
    `;
  });

  // Convert normal URLs to clickable links but KEEP original text
  text = text.replace(urlRegex, url => {
    return `
      <a href="${url}" target="_blank" 
         style="color:#0066cc; text-decoration:underline;">
         ${url} <span style="font-size:0.9em;">🔗</span>
      </a>
    `;
  });

  return text;
}
loadPublications();
loadTextSection('{{ "/assets/conference_proceedings.txt" | relative_url }}', "conferenceProceedings");
loadTextSection('{{ "/assets/conference_appearances.txt" | relative_url }}', "conferenceAppearances");  
loadCitationStats();  
</script>

<style>
.pub-card {
  margin-bottom: 1.5rem;
}
#controls select, #controls input {
  padding: 4px 8px;
}
</style>











