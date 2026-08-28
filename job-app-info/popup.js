"use strict";

// Edit the default values here. They are used the first time the extension runs.
const DEFAULT_PROFILE = {
  personal: {
    title: "Personal",
    fields: [
      { label: "Name", value: "Richard Chuong" },
      { label: "Address", value: "2121 69th Street" },
      { label: "Location", value: "Oklahoma City, Oklahoma" },
      { label: "ZIP", value: "73132" },
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
    positions: [
      {
        fields: [
          { label: "Title", value: "Software Engineer" },
          { label: "Company", value: "Paycom Software, Inc" },
          { label: "Location", value: "Oklahoma City, OK, USA" },
          { label: "Start Date", value: "2025-06" },
          { label: "End Date", value: "Present" },
          {
            label: "Description",
            value: "Built and maintained reliable software for customers and internal teams."
          }
        ]
      }
    ]
  },
  education: {
    title: "Education",
    fields: [
      { label: "School", value: "University of Rochester" },
      { label: "Degree", value: "Bachelor's" },
      { label: "Discipline", value: "Computer Science" },
      { label: "Date", value: "2021 - 2025" }
    ]
  }
};

const profileElement = document.querySelector("#profile");
const statusElement = document.querySelector("#status");
const STORAGE_KEY = "profile";
let currentProfile;
let editingProfile;
let editingSectionKey = null;
let statusTimer;
let announcementTimer;
const copyTimers = new WeakMap();

function showStatus(message, isError = false) {
  window.clearTimeout(statusTimer);
  statusElement.textContent = message;
  statusElement.classList.toggle("error", isError);
  statusElement.classList.add("visible");
  statusTimer = window.setTimeout(() => {
    statusElement.classList.remove("visible");
  }, 1000);
}

async function copyValue(value, target) {
  try {
    await navigator.clipboard.writeText(value);
    window.clearTimeout(copyTimers.get(target));
    target.classList.remove("copied");
    void target.offsetWidth;
    target.classList.add("copied");
    copyTimers.set(target, window.setTimeout(() => target.classList.remove("copied"), 580));

    window.clearTimeout(announcementTimer);
    statusElement.classList.remove("visible", "error");
    statusElement.textContent = "Copied";
    announcementTimer = window.setTimeout(() => {
      statusElement.textContent = "";
    }, 600);
  } catch (error) {
    console.error("Could not copy value:", error);
    showStatus("Copy failed", true);
  }
}

function createPencilIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z");
  svg.append(path);
  return svg;
}

function createSectionHeader(sectionKey, section, isEditing) {
  const header = document.createElement("div");
  header.className = "section-heading";

  const heading = document.createElement("h2");
  heading.className = "section-title";
  heading.textContent = section.title;
  header.append(heading);

  if (isEditing) {
    const actions = document.createElement("div");
    actions.className = "section-actions";

    if (sectionKey === "links" || sectionKey === "experience") {
      const addButton = document.createElement("button");
      addButton.className = "secondary-button compact-button";
      addButton.type = "button";
      addButton.textContent = "Add +";
      addButton.addEventListener("click", sectionKey === "experience" ? addPosition : addLink);
      actions.append(addButton);
    }

    const cancelButton = document.createElement("button");
    cancelButton.className = "secondary-button compact-button";
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", cancelEditing);

    const saveButton = document.createElement("button");
    saveButton.className = "primary-button compact-button";
    saveButton.type = "button";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", saveSection);

    actions.append(cancelButton, saveButton);
    header.append(actions);
  } else {
    const editButton = document.createElement("button");
    editButton.className = "section-edit-button";
    editButton.type = "button";
    editButton.title = `Edit ${section.title}`;
    editButton.setAttribute("aria-label", `Edit ${section.title}`);
    editButton.disabled = editingSectionKey !== null;
    editButton.append(createPencilIcon());
    editButton.addEventListener("click", () => beginEditing(sectionKey));
    header.append(editButton);
  }

  return header;
}

function formatFullAddress(section) {
  const valueFor = (label) => section.fields.find((field) => field.label === label)?.value.trim() || "";
  const addressAndLocation = [valueFor("Address"), valueFor("Location")].filter(Boolean).join(", ");
  return [addressAndLocation, valueFor("ZIP")].filter(Boolean).join(" ");
}

function appendCopyField(sectionElement, field, labelCopyValue = null) {
  const row = document.createElement("div");
  row.className = "profile-row";

  const label = document.createElement("span");
  label.className = "row-label";
  if (labelCopyValue !== null) {
    const labelTarget = document.createElement("span");
    labelTarget.className = "label-copy-target";
    labelTarget.textContent = field.label;
    labelTarget.tabIndex = 0;
    labelTarget.setAttribute("role", "button");
    labelTarget.title = "Copy full address";
    labelTarget.setAttribute("aria-label", "Copy full address");
    labelTarget.addEventListener("click", () => copyValue(labelCopyValue, labelTarget));
    labelTarget.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      copyValue(labelCopyValue, labelTarget);
    });
    label.append(labelTarget);
  } else {
    label.textContent = field.label;
  }

  if (field.value.trim()) {
    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.type = "button";
    copyButton.title = `Copy ${field.label}`;

    const value = document.createElement("span");
    value.className = "row-value";
    value.textContent = field.value;

    copyButton.append(value);
    copyButton.addEventListener("click", () => copyValue(field.value, copyButton));
    row.append(label, copyButton);
  } else {
    const emptyValue = document.createElement("span");
    emptyValue.className = "empty-value";
    row.append(label, emptyValue);
  }
  sectionElement.append(row);
}

function appendDateField(sectionElement, field) {
  const years = field.value.match(/\b\d{4}\b/g);
  if (!years || years.length < 2) {
    appendCopyField(sectionElement, field);
    return;
  }

  const row = document.createElement("div");
  row.className = "profile-row";

  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = field.label;

  const dateRange = document.createElement("div");
  dateRange.className = "date-range";

  years.slice(0, 2).forEach((year, index) => {
    if (index > 0) {
      const separator = document.createElement("span");
      separator.className = "date-separator";
      separator.textContent = "–";
      dateRange.append(separator);
    }

    const yearButton = document.createElement("button");
    yearButton.className = "date-part";
    yearButton.type = "button";
    yearButton.textContent = year;
    yearButton.title = `Copy ${year}`;
    yearButton.addEventListener("click", () => copyValue(year, dateRange));
    dateRange.append(yearButton);
  });

  row.append(label, dateRange);
  sectionElement.append(row);
}

function appendEditField(sectionElement, sectionKey, section, field, fieldIndex, groupIndex) {
  const row = document.createElement("div");
  row.className = "edit-row";

  const label = document.createElement("label");
  label.className = "row-label";
  label.textContent = field.label;

  const input = document.createElement("textarea");
  input.className = "profile-input";
  input.rows = field.label === "Description" ? 3 : 1;
  input.value = field.value;
  if (sectionKey === "personal" && field.label === "Location") {
    input.placeholder = "City, State";
  }
  input.id = `${sectionKey}-${groupIndex}-${fieldIndex}`;
  input.dataset.section = sectionKey;
  input.dataset.fieldIndex = String(fieldIndex);
  if (section.positions) input.dataset.positionIndex = String(groupIndex);
  input.addEventListener("keydown", handleEditorKeydown);
  label.htmlFor = input.id;

  if (sectionKey === "links" && field.label === "Additional") {
    const labelArea = document.createElement("div");
    labelArea.className = "removable-label";

    const removeButton = document.createElement("button");
    removeButton.className = "remove-link-button";
    removeButton.type = "button";
    removeButton.textContent = "−";
    removeButton.title = "Remove link";
    removeButton.setAttribute("aria-label", "Remove additional link");
    removeButton.addEventListener("click", () => removeLink(fieldIndex));

    labelArea.append(label, removeButton);
    row.append(labelArea, input);
  } else {
    row.append(label, input);
  }
  sectionElement.append(row);
}

function appendDateEditField(sectionElement, sectionKey, field, fieldIndex) {
  const years = field.value.match(/\b\d{4}\b/g) || ["", ""];
  const row = document.createElement("div");
  row.className = "edit-row";

  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = field.label;

  const dateInputs = document.createElement("div");
  dateInputs.className = "date-edit-range";
  dateInputs.dataset.section = sectionKey;
  dateInputs.dataset.fieldIndex = String(fieldIndex);

  ["Start year", "End year"].forEach((ariaLabel, index) => {
    if (index > 0) {
      const separator = document.createElement("span");
      separator.className = "date-separator";
      separator.textContent = "–";
      dateInputs.append(separator);
    }

    const input = document.createElement("input");
    input.className = "date-year-input";
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 4;
    input.pattern = "[0-9]{4}";
    input.value = years[index] || "";
    input.setAttribute("aria-label", ariaLabel);
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 4);
    });
    input.addEventListener("keydown", handleEditorKeydown);
    dateInputs.append(input);
  });

  row.append(label, dateInputs);
  sectionElement.append(row);
}

function renderProfile() {
  const previousScrollTop = profileElement.scrollTop;
  profileElement.replaceChildren();

  Object.entries(currentProfile).forEach(([sectionKey, savedSection]) => {
    const isEditing = sectionKey === editingSectionKey;
    const section = isEditing ? editingProfile[sectionKey] : savedSection;
    const sectionElement = document.createElement("section");
    sectionElement.className = "section";
    sectionElement.append(createSectionHeader(sectionKey, section, isEditing));

    const groups = section.positions || [{ fields: section.fields }];

    groups.forEach((group, groupIndex) => {
      if (section.positions) {
        const positionTitle = document.createElement("h3");
        positionTitle.className = "position-title";
        positionTitle.textContent = `Position ${groupIndex + 1}`;
        sectionElement.append(positionTitle);
      }

      group.fields.forEach((field, fieldIndex) => {
        if (isEditing && sectionKey === "education" && field.label === "Date") {
          appendDateEditField(sectionElement, sectionKey, field, fieldIndex);
        } else if (isEditing) {
          appendEditField(sectionElement, sectionKey, section, field, fieldIndex, groupIndex);
        } else if (sectionKey === "education" && field.label === "Date") {
          appendDateField(sectionElement, field);
        } else {
          const fullAddress = sectionKey === "personal" && field.label === "Location"
            ? formatFullAddress(section)
            : null;
          appendCopyField(sectionElement, field, fullAddress || null);
        }
      });
    });

    profileElement.append(sectionElement);
  });

  profileElement.scrollTop = previousScrollTop;
}

function beginEditing(sectionKey) {
  editingSectionKey = sectionKey;
  editingProfile = JSON.parse(JSON.stringify(currentProfile));
  renderProfile();
  profileElement.querySelector(`textarea[data-section="${sectionKey}"]`)?.focus();
}

function cancelEditing() {
  editingSectionKey = null;
  editingProfile = null;
  renderProfile();
}

function handleEditorKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  saveSection();
}

function readEditorValues() {
  const updatedProfile = JSON.parse(JSON.stringify(editingProfile));

  profileElement.querySelectorAll(".profile-input").forEach((input) => {
    const section = updatedProfile[input.dataset.section];
    const fields = input.dataset.positionIndex === undefined
      ? section.fields
      : section.positions[Number(input.dataset.positionIndex)].fields;
    const field = fields[Number(input.dataset.fieldIndex)];
    field.value = input.value;
  });

  profileElement.querySelectorAll(".date-edit-range").forEach((dateInputs) => {
    const section = updatedProfile[dateInputs.dataset.section];
    const field = section.fields[Number(dateInputs.dataset.fieldIndex)];
    const years = dateInputs.querySelectorAll(".date-year-input");
    field.value = `${years[0].value} - ${years[1].value}`;
  });

  return updatedProfile;
}

function dateInputsAreValid() {
  const invalidInput = Array.from(profileElement.querySelectorAll(".date-year-input"))
    .find((input) => !/^\d{4}$/.test(input.value));

  if (!invalidInput) return true;
  invalidInput.focus();
  showStatus("Enter a 4-digit year", true);
  return false;
}

function addPosition() {
  editingProfile = readEditorValues();
  editingProfile.experience.positions.push({
    fields: [
      { label: "Title", value: "" },
      { label: "Company", value: "" },
      { label: "Location", value: "" },
      { label: "Start Date", value: "" },
      { label: "End Date", value: "" },
      { label: "Description", value: "" }
    ]
  });
  renderProfile();
  const inputs = profileElement.querySelectorAll('textarea[data-section="experience"]');
  inputs[inputs.length - 6]?.focus();
}

function addLink() {
  editingProfile = readEditorValues();
  editingProfile.links.fields.push({ label: "Additional", value: "" });
  renderProfile();
  const inputs = profileElement.querySelectorAll('textarea[data-section="links"]');
  inputs[inputs.length - 1]?.focus();
}

function removeLink(fieldIndex) {
  editingProfile = readEditorValues();
  editingProfile.links.fields.splice(fieldIndex, 1);
  renderProfile();

  const inputs = profileElement.querySelectorAll('textarea[data-section="links"]');
  inputs[Math.min(fieldIndex - 1, inputs.length - 1)]?.focus();
}

function endDateValue(position) {
  const endDate = position.fields.find((field) => field.label === "End Date")?.value.trim();
  if (!endDate) return Number.NEGATIVE_INFINITY;
  if (["present", "current", "now"].includes(endDate.toLowerCase())) return Number.POSITIVE_INFINITY;

  const parsedDate = Date.parse(endDate);
  return Number.isNaN(parsedDate) ? Number.NEGATIVE_INFINITY : parsedDate;
}

function sortExperiencePositions(profile) {
  profile.experience.positions.sort((first, second) => endDateValue(second) - endDateValue(first));
  return profile;
}

function mergeEducationFields(defaultFields, savedFields) {
  const savedDegree = savedFields.find((field) => field.label === "Degree")?.value || "";
  const degreeParts = savedDegree.split(",");
  const savedDate = savedFields.find((field) => ["Date", "Years"].includes(field.label))?.value;
  const startYear = savedFields.find((field) => field.label === "Start Year")?.value;
  const endYear = savedFields.find((field) => field.label === "End Year")?.value;

  defaultFields.forEach((field) => {
    const exactField = savedFields.find((candidate) => candidate.label === field.label);

    if (field.label === "Degree" && savedDegree) {
      field.value = degreeParts[0].trim();
    } else if (field.label === "Discipline") {
      field.value = exactField?.value || degreeParts.slice(1).join(",").trim() || field.value;
    } else if (field.label === "Date") {
      field.value = savedDate || (startYear && endYear ? `${startYear} - ${endYear}` : field.value);
    } else if (exactField && typeof exactField.value === "string") {
      field.value = exactField.value;
    }
  });
}

function mergeWithDefaults(savedProfile) {
  const mergedProfile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));

  Object.entries(mergedProfile).forEach(([sectionKey, section]) => {
    if (section.positions) {
      const savedPositions = savedProfile?.[sectionKey]?.positions;
      const legacyFields = savedProfile?.[sectionKey]?.fields;

      if (Array.isArray(savedPositions)) {
        section.positions = savedPositions.map((savedPosition) => {
          const position = JSON.parse(JSON.stringify(section.positions[0]));
          position.fields.forEach((field) => {
            const savedField = savedPosition.fields?.find((candidate) => candidate.label === field.label);
            if (savedField && typeof savedField.value === "string") field.value = savedField.value;
          });
          return position;
        });
      } else if (Array.isArray(legacyFields)) {
        section.positions[0].fields.forEach((field) => {
          const savedField = legacyFields.find((candidate) => candidate.label === field.label);
          if (savedField && typeof savedField.value === "string") field.value = savedField.value;
        });
      }
      return;
    }

    const savedFields = savedProfile?.[sectionKey]?.fields;
    if (!Array.isArray(savedFields)) return;

    if (sectionKey === "education") {
      mergeEducationFields(section.fields, savedFields);
      return;
    }

    section.fields.forEach((field) => {
      const savedField = savedFields.find((candidate) => candidate.label === field.label);
      if (savedField && typeof savedField.value === "string") {
        const isLegacyLocation = sectionKey === "personal"
          && field.label === "Location"
          && savedField.value === "Oklahoma City, OK, USA";
        if (!isLegacyLocation) field.value = savedField.value;
      }
    });

    if (sectionKey === "links") {
      savedFields
        .filter((field) => field.label === "Additional" && typeof field.value === "string")
        .forEach((field) => section.fields.push({ label: "Additional", value: field.value }));
    }
  });

  return sortExperiencePositions(mergedProfile);
}

async function saveSection() {
  if (!dateInputsAreValid()) return;
  const updatedProfile = sortExperiencePositions(readEditorValues());

  try {
    await browser.storage.local.set({ [STORAGE_KEY]: updatedProfile });
    currentProfile = updatedProfile;
    editingSectionKey = null;
    editingProfile = null;
    renderProfile();
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
      currentProfile = sortExperiencePositions(JSON.parse(JSON.stringify(DEFAULT_PROFILE)));
      await browser.storage.local.set({ [STORAGE_KEY]: currentProfile });
    }
  } catch (error) {
    console.error("Could not load saved profile:", error);
    currentProfile = DEFAULT_PROFILE;
    showStatus("Using default profile", true);
  }

  renderProfile();
}

initialize();
