---
layout: default
title: Home
---

## Welcome

I am a beamline scientist at Elettra Sincrotrone Trieste, working on high-pressure X-ray diffraction, synchrotron-based materials research, and scientific software development.
Experienced researcher specializing in advanced X-ray diffraction studies under extreme conditions. My work focuses on carrying out high-pressure, high/low-temperature experiments on various materials, leading to novel discoveries in materials science.

A key aspect of my professional experience involves developing novel experimental techniques for diamond anvil cell (DAC) based studies, pushing the boundaries of what is possible in extreme conditions research.

I have extensive experience in user support, serving as the local contact for supporting users conducting synchrotron experiments involving extreme condition X-ray diffraction measurements.

Additionally, I manage significant operational responsibilities at the beamline, which include:

- Preparing and documenting monthly and yearly beamline reports.

- Conducting technical evaluations of research proposals.

- Overseeing the periodic maintenance of beamline facilities.

My expertise in both the technical execution of complex experiments and the operational management of a major scientific facility makes me a versatile and valuable asset to any research team.

---

## Recent Publications

<div id="recentPubs"></div>

<script>
fetch("{{ '/assets/data/scholar.json' | relative_url }}")
  .then(response => response.json())
  .then(data => {
    console.log("Loaded scholar.json:", data);

    const pubs = data.publications || [];
    const valid = pubs.filter(p => p.year);
    const recent = valid.sort((a, b) => b.year - a.year).slice(0, 5);

    const container = document.getElementById("recentPubs");
    container.innerHTML = "";

    if (recent.length === 0) {
      container.innerHTML = "<p>No recent publications found.</p>";
      return;
    }

    recent.forEach(pub => {
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






