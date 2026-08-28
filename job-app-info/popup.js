"use strict";

// Edit the default values here. They are used the first time the extension runs.
const DEFAULT_PROFILE = {
  personal: {
    title: "Personal",
    fields: [
      { label: "Name", value: "Richard Chuong" },
      { label: "Location", value: "Oklahoma City, OK, USA" },
      { label: "Email", value: "chuongrichard@gmail.com" },
      { label: "Phone", value: "+14054145122" }
    ]
  },
  links: {
    title: "Links",
    fields: [
      { label: "LinkedIn", value: "https://www.linkedin.com/in/your-profile" },
      { label: "GitHub", value: "https://github.com/your-username" },
      { label: "Portfolio", value: "https://your-portfolio.example" }
    ]
  },
  experience: {
    title: "Experience",
    fields: [
      { label: "Title", value: "Software Engineer" },
      { label: "Company", value: "Paycom Software, Inc" },
      { label: "Location", value: "Oklahoma City, OK, USA" }
    ]
  },
  education: {
    title: "Education",
    fields: [
      { label: "School", value: "University of Rochester" },
      { label: "Degree", value: "Bachelor's, Computer Science" },
      { label: "Years", value: "2021 - 2025" }
    ]
  }
};

const profileElement = document.querySelector("#profile");
const statusElement = document.querySelector("#status");
let statusTimer;

function showStatus(message, isError = false) {
  window.clearTimeout(statusTimer);
  statusElement.textContent = message;
  statusElement.classList.toggle("error", isError);
  statusElement.classList.add("visible");
  statusTimer = window.setTimeout(() => {
    statusElement.classList.remove("visible");
  }, 1000);
}

async function copyValue(value, row) {
  try {
    await navigator.clipboard.writeText(value);
    const copyState = row.querySelector(".copy-state");
    copyState.textContent = "Copied";
    window.setTimeout(() => {
      copyState.textContent = "";
    }, 1000);
  } catch (error) {
    console.error("Could not copy value:", error);
    showStatus("Copy failed", true);
  }
}

function renderProfile(profile) {
  profileElement.replaceChildren();

  Object.values(profile).forEach((section) => {
    const sectionElement = document.createElement("section");
    sectionElement.className = "section";

    const heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = section.title;
    sectionElement.append(heading);

    section.fields.forEach((field) => {
      const row = document.createElement("button");
      row.className = "profile-row";
      row.type = "button";
      row.title = `Copy ${field.label}`;

      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = field.label;

      const value = document.createElement("span");
      value.className = "row-value";
      value.textContent = field.value;

      const copyState = document.createElement("span");
      copyState.className = "copy-state";
      copyState.setAttribute("aria-live", "polite");

      row.append(label, value, copyState);
      row.addEventListener("click", () => copyValue(field.value, row));
      sectionElement.append(row);
    });

    profileElement.append(sectionElement);
  });
}

renderProfile(DEFAULT_PROFILE);
