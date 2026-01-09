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
fetch("{{ '/_data/scholar.json' | relative_url }}")
  .then(response => response.json())
  .then(data => {
    console.log("Loaded scholar.json:", data);  // Debug output

    const pubs = data.publications || [];

    // Filter out entries without year
    const valid = pubs.filter(p => p.year);

    // Sort by year (descending)
    const recent = valid.sort((a, b) => b.year - a.year).slice(0, 5);

    const container = document.getElementById("recentPubs");
    container.innerHTML = "";

    if (recent.length === 0) {
      container.innerHTML = "<p>No recent publications found.</p>";
      return;
    }

    recent.forEach(pub => {
      // Encode title for Google Scholar search link
      const encodedTitle = encodeURIComponent(pub.title);
      const scholarLink = `https://scholar.google.com/scholar?q=${encodedTitle}`;

      container.innerHTML += `
        <div class="pub-card" style="margin-bottom: 1rem;">
          <h3><a href="${scholarLink}" target="_blank">${pub.title}</a></h3>
          <p><strong>${pub.year}</strong></p>
          <p><span class="badge">Cited by ${pub.cited_by}</span></p>
        </div>
      `;
    });
  })
  .catch(err => {
    console.error("Error loading publications:", err);
    document.getElementById("recentPubs").innerHTML =
      "<p>Error loading publications.</p>";
  });
</script>
