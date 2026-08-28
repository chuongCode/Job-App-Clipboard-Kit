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
      { label: "Location", value: "Oklahoma City, OK, USA" },
      {
        label: "Description",
        value: "Built and maintained reliable software for customers and internal teams."
      }
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
const editButton = document.querySelector("#edit-button");
const editActions = document.querySelector("#edit-actions");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");
const modeHint = document.querySelector("#mode-hint");
const STORAGE_KEY = "profile";
let currentProfile;
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

function renderEditor(profile) {
  profileElement.replaceChildren();

  Object.entries(profile).forEach(([sectionKey, section]) => {
    const sectionElement = document.createElement("section");
    sectionElement.className = "section";

    const heading = document.createElement("h2");
    heading.className = "section-title";
    heading.textContent = section.title;
    sectionElement.append(heading);

    section.fields.forEach((field, fieldIndex) => {
      const row = document.createElement("label");
      row.className = "edit-row";

      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = field.label;

      const input = document.createElement("input");
      input.className = "profile-input";
      input.type = "text";
      input.value = field.value;
      input.dataset.section = sectionKey;
      input.dataset.fieldIndex = String(fieldIndex);

      row.append(label, input);
      sectionElement.append(row);
    });

    profileElement.append(sectionElement);
  });
}

function setEditing(isEditing) {
  editButton.hidden = isEditing;
  editActions.hidden = !isEditing;
  modeHint.textContent = isEditing ? "Update your saved profile" : "Click any value to copy";

  if (isEditing) {
    renderEditor(currentProfile);
    profileElement.querySelector("input")?.focus();
  } else {
    renderProfile(currentProfile);
  }
}

function readEditorValues() {
  const updatedProfile = JSON.parse(JSON.stringify(currentProfile));

  profileElement.querySelectorAll(".profile-input").forEach((input) => {
    const field = updatedProfile[input.dataset.section].fields[Number(input.dataset.fieldIndex)];
    field.value = input.value;
  });

  return updatedProfile;
}

function mergeWithDefaults(savedProfile) {
  const mergedProfile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  Object.entries(mergedProfile).forEach(([sectionKey, section]) => {
    const savedFields = savedProfile?.[sectionKey]?.fields;
    if (!Array.isArray(savedFields)) return;

    section.fields.forEach((field) => {
      const savedField = savedFields.find((candidate) => candidate.label === field.label);
      if (savedField && typeof savedField.value === "string") {
        field.value = savedField.value;
      }
    });
  });

  return mergedProfile;
}

async function saveProfile() {
  const updatedProfile = readEditorValues();

  try {
    await browser.storage.local.set({ [STORAGE_KEY]: updatedProfile });
    currentProfile = updatedProfile;
    setEditing(false);
    showStatus("Saved");
  } catch (error) {
    console.error("Could not save profile:", error);
    showStatus("Save failed", true);
  }
}

async function initialize() {
  try {
    const saved = await browser.storage.local.get(STORAGE_KEY);

    if (saved[STORAGE_KEY]) {
      currentProfile = mergeWithDefaults(saved[STORAGE_KEY]);
      await browser.storage.local.set({ [STORAGE_KEY]: currentProfile });
    } else {
      currentProfile = DEFAULT_PROFILE;
      await browser.storage.local.set({ [STORAGE_KEY]: DEFAULT_PROFILE });
    }
  } catch (error) {
    console.error("Could not load saved profile:", error);
    currentProfile = DEFAULT_PROFILE;
    showStatus("Using default profile", true);
  }

  renderProfile(currentProfile);
}

editButton.addEventListener("click", () => setEditing(true));
cancelButton.addEventListener("click", () => setEditing(false));
saveButton.addEventListener("click", saveProfile);

initialize();
