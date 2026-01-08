---
layout: default
title: Publications
---

## Metrics

<div class="metrics-dashboard">
    <div class="metric">
        <h3>Total Citations</h3>
        <p id="totalCitations">Loading…</p>
    </div>

    <div class="metric">
        <h3>h-index</h3>
        <p id="hIndex">Loading…</p>
    </div>

    <div class="metric">
        <h3>i10-index</h3>
        <p id="i10Index">Loading…</p>
    </div>
</div>

<p id="lastUpdated" style="opacity:0.7; font-size:0.9em;"></p>

---

## Citations Over Time

<canvas id="citationsChart" width="400" height="200"></canvas>

---

## Publications

<div class="pub-controls">
    <label>Sort by:</label>
    <select id="sortMode">
        <option value="year">Year (Newest First)</option>
        <option value="citations">Citations (Most First)</option>
        <option value="title">Title (A–Z)</option>
    </select>

    <label style="margin-left:20px;">Filter by year:</label>
    <select id="yearFilter">
        <option value="all">All</option>
        {% assign years = site.data.publications | map: "year" | uniq | sort | reverse %}
        {% for y in years %}
            <option value="{{ y }}">{{ y }}</option>
        {% endfor %}
    </select>

    <label style="margin-left:20px;">Keyword:</label>
    <input type="text" id="keywordFilter" placeholder="Search title or journal">
</div>

<div id="pubList"></div>

---

## Recent Publications

<div id="recentPubs"></div>

---

## Scripts

<script>
// Publication data from Jekyll
const publications = [
    {% for pub in site.data.publications %}
    {
        title: "{{ pub.title | escape }}",
        authors: "{{ pub.authors | escape }}",
        journal: "{{ pub.journal | escape }}",
        year: {{ pub.year }},
        citations: {{ pub.citations }},
        doi: "{{ pub.doi }}"
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
];

function renderPublications(list) {
    const container = document.getElementById("pubList");
    container.innerHTML = "";

    list.forEach(pub => {
        container.innerHTML += `
            <div class="pub-card">
                <h3>${pub.title}</h3>
                <p><strong>Authors:</strong> ${pub.authors}</p>
                <p><strong>Journal:</strong> ${pub.journal} (${pub.year})</p>
                <p><span class="badge">Cited by ${pub.citations}</span></p>
                ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank">View DOI</a>` : `<em>No DOI available</em>`}
            </div>
        `;
    });
}

function renderRecentPublications() {
    const recent = [...publications]
        .sort((a, b) => b.year - a.year)
        .slice(0, 5);

    const container = document.getElementById("recentPubs");
    if (!container) return;
    container.innerHTML = "";

    recent.forEach(pub => {
        container.innerHTML += `
            <div class="pub-card">
                <h3>${pub.title}</h3>
                <p><strong>${pub.year}</strong> — ${pub.journal}</p>
                <p><span class="badge">Cited by ${pub.citations}</span></p>
                ${pub.doi ? `<a href="https://doi.org/${pub.doi}" target="_blank">View DOI</a>` : ""}
            </div>
        `;
    });
}

function applyFilters() {
    let list = [...publications];

    const sortMode = document.getElementById("sortMode").value;
    if (sortMode === "year") list.sort((a,b) => b.year - a.year);
    if (sortMode === "citations") list.sort((a,b) => b.citations - a.citations);
    if (sortMode === "title") list.sort((a,b) => a.title.localeCompare(b.title));

    const year = document.getElementById("yearFilter").value;
    if (year !== "all") list = list.filter(p => p.year == year);

    const keywordInput = document.getElementById("keywordFilter");
    const keyword = keywordInput ? keywordInput.value.toLowerCase() : "";
    if (keyword.length > 0) {
        list = list.filter(p =>
            p.title.toLowerCase().includes(keyword) ||
            p.journal.toLowerCase().includes(keyword)
        );
    }

    renderPublications(list);
}

// Chart.js citations over time
let citationsChart = null;
function drawCitationsGraph(yearlyData) {
    const canvas = document.getElementById("citationsChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (citationsChart) citationsChart.destroy();

    citationsChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: yearlyData.map(x => x.year),
            datasets: [{
                label: "Citations per Year",
                data: yearlyData.map(x => x.citations),
                borderColor: "#4c8cff",
                backgroundColor: "rgba(76, 140, 255, 0.2)",
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Co-author graph
function buildCoauthorGraph() {
    const container = document.getElementById("coauthorGraph");
    if (!container) return;

    const authors = {};
    const links = [];

    publications.forEach(pub => {
        const coauthors = pub.authors.split(",").map(a => a.trim());

        for (let i = 0; i < coauthors.length; i++) {
            for (let j = i + 1; j < coauthors.length; j++) {
                const a = coauthors[i];
                const b = coauthors[j];

                const key = a + "|" + b;
                if (!authors[a]) authors[a] = { name: a };
                if (!authors[b]) authors[b] = { name: b };

                let link = links.find(l => (l.source === a && l.target === b) || (l.source === b && l.target === a));
                if (link) {
                    link.weight += 1;
                } else {
                    links.push({ source: a, target: b, weight: 1 });
                }
            }
        }
    });

    drawCoauthorGraph(Object.values(authors), links);
}

function drawCoauthorGraph(nodes, links) {
    const element = document.getElementById("coauthorGraph");
    if (!element) return;

    const width = element.clientWidth;
    const height = 600;

    const svg = d3.select("#coauthorGraph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.name).distance(120))
        .force("charge", d3.forceManyBody().strength(-250))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", "#4c8cff")
        .attr("stroke-width", d => Math.sqrt(d.weight));

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 10)
        .attr("fill", "#1f3b73")
        .call(d3.drag()
            .on("start", dragStart)
            .on("drag", dragged)
            .on("end", dragEnd));

    const label = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.name)
        .attr("font-size", "12px")
        .attr("dx", 12)
        .attr("dy", 4)
        .attr("fill", "var(--text)");

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
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

// Scholar metrics & citations
async function updateScholarMetrics() {
    try {
        // Replace this URL with your own backend endpoint that returns Scholar data as JSON
        const response = await fetch("YOUR_SCHOLAR_API_ENDPOINT?user=3aPgewgAAAAJ");
        const data = await response.json();

        if (data.metrics) {
            document.getElementById("totalCitations").innerText = data.metrics.total_citations;
            document.getElementById("hIndex").innerText = data.metrics.h_index;
            document.getElementById("i10Index").innerText = data.metrics.i10_index;
        }

        const lastUpdatedElem = document.getElementById("lastUpdated");
        if (lastUpdatedElem) {
            lastUpdatedElem.innerText = "Last updated: " + new Date().toLocaleString();
        }

        if (data.metrics && data.metrics.citations_per_year) {
            const yearly = Object.entries(data.metrics.citations_per_year).map(([year, citations]) => ({
                year: year,
                citations: citations
            }));
            yearly.sort((a, b) => a.year - b.year);
            drawCitationsGraph(yearly);
        }

        if (Array.isArray(data.publications)) {
            publications.forEach(pub => {
                const match = data.publications.find(p =>
                    pub.title.toLowerCase().includes(p.title.slice(0, 20).toLowerCase())
                );
                if (match && typeof match.cited_by !== "undefined") {
                    pub.citations = match.cited_by;
                }
            });
        }

        applyFilters();
        renderRecentPublications();
        buildCoauthorGraph();
    } catch (e) {
        console.log("Metrics/citations update failed:", e);
        applyFilters();
        renderRecentPubliclications();
        buildCoauthorGraph();
    }
}

// Hook controls
document.addEventListener("DOMContentLoaded", () => {
    const sortMode = document.getElementById("sortMode");
    const yearFilter = document.getElementById("yearFilter");
    const keywordFilter = document.getElementById("keywordFilter");

    if (sortMode) sortMode.onchange = applyFilters;
    if (yearFilter) yearFilter.onchange = applyFilters;
    if (keywordFilter) keywordFilter.onkeyup = applyFilters;

    applyFilters();
    renderRecentPublications();
    buildCoauthorGraph();
    updateScholarMetrics();
});
</script>
