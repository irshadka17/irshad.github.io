---
layout: default
title: Home
---

## Welcome

I am a beamline scientist at Elettra Sincrotrone Trieste, working on high-pressure X-ray diffraction, synchrotron-based materials research, and scientific software development.

---

## Recent Publications

<div id="recentPubs"></div>

<script>
// Load publications JSON
fetch("{{ '/_data/scholar.json' | relative_url }}")
  .then(response => response.json())
  .then(data => {
    const publications = data.publications || [];

    const recent = [...publications]
      .sort((a, b) => b.year - a.year)
      .slice(0, 5);

    const container = document.getElementById("recentPubs");
    container.innerHTML = "";

    recent.forEach(pub => {
      container.innerHTML += `
        <div class="pub-card">
            <h3>${pub.title}</h3>
            <p><strong>${pub.year}</strong> — ${pub.journal || ""}</p>
            <p><span class="badge">Cited by ${pub.cited_by || 0}</span></p>
        </div>
      `;
    });
  });
</script>
