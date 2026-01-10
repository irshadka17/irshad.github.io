document.addEventListener("DOMContentLoaded", () => {

// ===============================
//  CONFIGURATION
// ===============================
const CACHE_DURATION_HOURS = 24;

// ===============================
//  CACHE HELPERS
// ===============================
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
  localStorage.setItem(
    key,
    JSON.stringify({
      crossref,
      openalex,
      timestamp: Date.now()
    })
  );
}

// ===============================
//  DOI LIST LOADER
// ===============================
async function loadDOIs() {
  const response = await fetch("/assets/dois.txt");
  const text = await response.text();
  return text
    .split("\n")
    .map(d => d.trim())
    .filter(d => d.length > 0);
}

// ===============================
//  RAW API FETCHERS
// ===============================
async function fetchCrossRef(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const response = await fetch(url);
  const json = await response.json();
  return json.message;
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

// ===============================
//  FETCH WITH CACHING
// ===============================
async function fetchPublicationData(doi) {
  const cached = loadFromCache(doi);
  if (cached) return cached;

  const crossref = await fetchCrossRef(doi);
  const openalex = await fetchOpenAlex(doi);

  saveToCache(doi, crossref, openalex);

  return { crossref, openalex };
}

// ===============================
//  GLOBAL DATA STRUCTURES
// ===============================
let publications = [];
let citationHistory = {};
let coauthorEdges = [];
let coauthorNodes = {};

// ===============================
//  CITATION TIMELINE (DUAL AXIS)
// ===============================
function drawCitationChart() {
  const ctx = document.getElementById("citationChart").getContext("2d");

  const years = Object.keys(citationHistory).sort((a, b) => a - b);
  const citationCounts = years.map(y => citationHistory[y]);

  const pubCounts = years.map(y =>
    publications.filter(p => p.year == y).length
  );

  new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Citations per Year",
          data: citationCounts,
          borderColor: "#007acc",
          backgroundColor: "rgba(0, 122, 204, 0.2)",
          fill: true,
          tension: 0.3,
          yAxisID: "y"
        },
        {
          label: "Publications per Year",
          data: pubCounts,
          borderColor: "#cc5500",
          backgroundColor: "rgba(204, 85, 0, 0.2)",
          fill: false,
          tension: 0.3,
          yAxisID: "y1"
        }
      ]
    },
    options: {
      plugins: { legend: { display: true } },
      scales: {
        x: { title: { display: true, text: "Year" } },
        y: {
          title: { display: true, text: "Citations per Year" },
          beginAtZero: true,
          position: "left"
        },
        y1: {
          title: { display: true, text: "Publications per Year" },
          beginAtZero: true,
          position: "right",
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// ===============================
//  BUILD COAUTHOR NETWORK
// ===============================
function buildCoauthorNetwork() {
  coauthorNodes = {};
  coauthorEdges = [];

  publications.forEach(pub => {
    const authors = pub.authors.split(",").map(a => a.trim());

    authors.forEach(a => {
      if (!coauthorNodes[a]) {
        coauthorNodes[a] = { name: a, count: 0 };
      }
      coauthorNodes[a].count++;
    });

    for (let i = 0; i < authors.length; i++) {
      for (let j = i + 1; j < authors.length; j++) {
        coauthorEdges.push({
          source: authors[i],
          target: authors[j]
        });
      }
    }
  });
}

// ===============================
//  DRAW COAUTHOR GRAPH (D3.js)
// ===============================
function drawCoauthorGraph() {
  const svg = d3.select("#coauthorGraph");
  svg.selectAll("*").remove();

  const width = svg.node().clientWidth;
  const height = svg.node().clientHeight;

  const nodes = Object.values(coauthorNodes);
  const links = coauthorEdges.map(e => ({
    source: e.source,
    target: e.target
  }));

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.name).distance(80))
    .force("charge", d3.forceManyBody().strength(-120))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const zoom = d3.zoom().on("zoom", event => {
    g.attr("transform", event.transform);
  });
  svg.call(zoom);

  const g = svg.append("g");

  const link = g.selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 1);

  const node = g.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => 5 + d.count * 1.2)
    .attr("fill", d => d.name.includes("Irshad") ? "#cc0000" : "#007acc")
    .call(
      d3.drag()
        .on("start", dragStart)
        .on("drag", dragged)
        .on("end", dragEnd)
    );

  node.append("title")
    .text(d => `${d.name}\nCollaborations: ${d.count}`);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  });

  function dragStart(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnd(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// ===============================
//  RENDER PUBLICATION CARD
// ===============================
function renderPublication(pub) {
  return `
    <div class="pub-card">
      <h3>${pub.title}</h3>
      <p><strong>Authors:</strong> ${pub.authors}</p>
      <p><strong>Journal:</strong> ${pub.journal} (${pub.year})</p>
      <p><strong>Volume:</strong> ${pub.volume || "—"}  
         <strong>Issue:</strong> ${pub.issue || "—"}  
         <strong>Pages:</strong> ${pub.pages || "—"}</p>
      <p><strong>Citations:</strong> ${pub.citations}</p>
      <p><a href="https://doi.org/${pub.doi}" target="_blank">DOI: ${pub.doi}</a></p>
    </div>
    <hr>
  `;
}

// ===============================
//  APPLY FILTERS
// ===============================
function applyFilters() {
  const yearValue = document.getElementById("yearFilter").value;
  const searchValue = document.getElementById("searchInput").value.toLowerCase();
  const sortValue = document.getElementById("sortSelect").value;

  let filtered = publications.filter(pub => {
    const yearMatch = yearValue === "all" || pub.year == yearValue;
    const searchMatch =
      pub.title.toLowerCase().includes(searchValue) ||
      pub.authors.toLowerCase().includes(searchValue) ||
      pub.journal.toLowerCase().includes(searchValue);
    return yearMatch && searchMatch;
  });

  filtered.sort((a, b) => {
    switch (sortValue) {
      case "year-desc": return b.year - a.year;
      case "year-asc": return a.year - b.year;
      case "citations-desc": return b.citations - a.citations;
      case "citations-asc": return a.citations - b.citations;
      case "title-asc": return a.title.localeCompare(b.title);
      case "title-desc": return b.title.localeCompare(a.title);
    }
  });

  document.getElementById("pub-container").innerHTML =
    filtered.map(renderPublication).join("");
}

// ===============================
//  MAIN LOADER
// ===============================
async function loadPublications() {
  const container = document.getElementById("pub-container");
  container.innerHTML = "<p>Loading…</p>";

  const dois = await loadDOIs();
  publications = [];
  citationHistory = {};
  coauthorNodes = {};
  coauthorEdges = [];
  const years = new Set();

  for (const doi of dois) {
    try {
      const { crossref, openalex } = await fetchPublicationData(doi);

      const authors = crossref.author
        ? crossref.author.map(a => `${a.given} ${a.family}`).join(", ")
        : "Unknown authors";

      const title = crossref.title ? crossref.title[0] : "Untitled";
      const journal = crossref["container-title"]
        ? crossref["container-title"][0]
        : "Unknown journal";
      const year = crossref.issued
        ? crossref.issued["date-parts"][0][0]
        : "—";
      const volume = crossref.volume || "";
      const issue = crossref.issue || "";
      const pages = crossref.page || "";

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

  const yearFilter = document.getElementById("yearFilter");
  [...years].sort((a, b) => b - a).forEach(y => {
    yearFilter.innerHTML += `<option value="${y}">${y}</option>`;
  });

  applyFilters();
  drawCitationChart();

  buildCoauthorNetwork();
  drawCoauthorGraph();
}

// ===============================
//  EVENT LISTENERS
// ===============================
document.getElementById("yearFilter").addEventListener("change", applyFilters);
document.getElementById("searchInput").addEventListener("input", applyFilters);
document.getElementById("sortSelect").addEventListener("change", applyFilters);

loadPublications();

}); // end DOMContentLoaded
