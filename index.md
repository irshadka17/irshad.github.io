---
layout: default
title: Home
---

<div class="two-column">

  <!-- LEFT COLUMN -->
  <div class="left-column" markdown="1">

## Welcome

Experienced researcher specializing in X-ray diffraction studies under extreme conditions. My work focuses on carrying out high-pressure, high/low-temperature experiments on various materials, leading to novel discoveries in materials science. I also use spectroscopic techniques like Raman spectroscopy to corroborate and establish the physics and chemistry of materials.

A key aspect of my professional experience involves developing novel experimental strategies for diamond anvil cell (DAC) based studies, pushing the boundaries of what is possible in extreme conditions research.

I have extensive experience in user support, serving as the local contact for supporting users conducting synchrotron experiments involving extreme condition X-ray diffraction and Raman spectroscopic measurements.

Additionally, I manage significant operational responsibilities at the beamline, which include:

- Conducting technical evaluations of research proposals.
- Overseeing the periodic maintenance of beamline facilities.
- Preparing and documenting monthly and yearly beamline reports.

My expertise in both the technical execution of complex experiments and the operational management of a major scientific facility makes me a versatile and valuable asset to any research team.

<hr>

## Recent Publications

<div id="recentPubs"></div>

  </div> <!-- END LEFT COLUMN -->


<script src="{{ '/assets/js/publications.js' | relative_url }}"></script>

<script>
async function loadRecentPublications() {
  const container = document.getElementById("recentPubs");
  container.innerHTML = "Loading…";

  // Wait until publications.js finishes building the publications array
  while (!window.publications || window.publications.length === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Load DOIs from /assets/dois.txt
  const doiResponse = await fetch("{{ '/assets/dois.txt' | relative_url }}");
  const doiText = await doiResponse.text();
  const dois = doiText
    .split("\n")
    .map(d => d.trim())
    .filter(d => d.length > 0);

  // Match DOIs in order
  const matched = [];
  dois.forEach(doi => {
    const pub = window.publications.find(p => p.doi === doi);
    if (pub) matched.push(pub);
  });

  const recent = matched.slice(0, 5);

  container.innerHTML = "";

  if (recent.length === 0) {
    container.innerHTML = "<p>No recent publications found.</p>";
    return;
  }

  recent.forEach((pub, index) => {
    const doiLink = pub.doi
      ? `<a href="https://doi.org/${pub.doi}" target="_blank">${pub.doi}</a>`
      : "—";

    container.innerHTML += `
      <div class="pub-card" style="margin-bottom: 1rem;">

        <h3 style="margin-bottom: 0.3rem;">
          <span style="
            display: inline-block;
            width: 28px;
            text-align: right;
            margin-right: 8px;
            font-weight: bold;
          ">
            ${index + 1}.
          </span>
          ${pub.title}
        </h3>

        <p style="margin: 0.2rem 0;">
          <strong>Authors:</strong> ${pub.authors}
        </p>

        <p style="margin: 0.2rem 0;">
          <strong>Year:</strong> ${pub.year}
        </p>

        <p style="margin: 0.2rem 0;">
          <strong>Journal:</strong> ${pub.journal}
        </p>

        <p style="margin: 0.2rem 0;">
          <strong>Volume:</strong> ${pub.volume || "—"}
          &nbsp;&nbsp;
          <strong>Issue:</strong> ${pub.issue || "—"}
          &nbsp;&nbsp;
          <strong>Pages:</strong> ${pub.pages || "—"}
        </p>

        <p style="margin: 0.2rem 0;">
          <strong>DOI:</strong> ${doiLink}
        </p>

      </div>
    `;
  });
}

loadRecentPublications();
</script>

  <!-- RIGHT COLUMN -->
  <div class="right-column" markdown="1">

<div class="profile-photo-container">
  <img src="{{ '/assets/images/profile.jpg' | relative_url }}" alt="Profile photo" class="profile-photo">
</div>

## Contact

<div class="contact-card">
  <ul class="contact-list">

    <li>
      <span class="icon">📧</span>
      <a href="mailto:{{ site.email_primary }}">{{ site.email_primary }}</a>
    </li>

    <li>
      <span class="icon">📧</span>
      <a href="mailto:{{ site.email_secondary }}">{{ site.email_secondary }}</a>
    </li>

    <li>
      <span class="icon">📱</span>
      {{ site.mobile_primary }}
    </li>

    <li>
      <span class="icon">📱</span>
      {{ site.mobile_secondary }}
    </li>

    <li>
      <span class="icon">🐙</span>
      <a href="{{ site.github }}" target="_blank">GitHub</a>
    </li>

    <li>
      <span class="icon">🔗</span>
      <a href="{{ site.linkedin }}" target="_blank">LinkedIn</a>
    </li>

    <li>
      <span class="icon">🟢</span>
      <a href="{{ site.orcid }}" target="_blank">ORCID</a>
    </li>

    <li>
      <span class="icon">📘</span>
      <a href="{{ site.researchgate }}" target="_blank">ResearchGate</a>
    </li>

  </ul>
</div>

  </div> <!-- END RIGHT COLUMN -->

</div> <!-- END TWO COLUMN -->







