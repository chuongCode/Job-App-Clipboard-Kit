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
          { label: "Date", value: "Jun 2025 - Present" },
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
    entries: [
      {
        fields: [
          { label: "School", value: "University of Rochester" },
          { label: "Degree", value: "Bachelor's" },
          { label: "Discipline", value: "Computer Science" },
          { label: "Date", value: "2021 - 2025" }
        ]
      }
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

    if (["links", "experience", "education"].includes(sectionKey)) {
      const addButton = document.createElement("button");
      addButton.className = "secondary-button compact-button";
      addButton.type = "button";
      addButton.textContent = "Add +";
      const addItem = sectionKey === "experience" ? addPosition
        : sectionKey === "education" ? addEducation
          : addLink;
      addButton.addEventListener("click", addItem);
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

function createRowLabel(text, valueToCopy = null, copyTitle = "") {
  const label = document.createElement("span");
  label.className = "row-label";

  if (valueToCopy === null) {
    label.textContent = text;
    return label;
  }

  const target = document.createElement("span");
  target.className = "label-copy-target";
  target.textContent = text;
  target.tabIndex = 0;
  target.setAttribute("role", "button");
  target.title = copyTitle;
  target.setAttribute("aria-label", copyTitle);
  target.addEventListener("click", () => copyValue(valueToCopy, target));
  target.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    copyValue(valueToCopy, target);
  });
  label.append(target);
  return label;
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { first: parts.shift() || "", last: parts.join(" ") };
}

function appendCopyField(sectionElement, field, labelCopyValue = null) {
  const row = document.createElement("div");
  row.className = "profile-row";

  const label = createRowLabel(field.label, labelCopyValue, "Copy full address");

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

function appendNameField(sectionElement, field) {
  const fullName = field.value.trim();
  const row = document.createElement("div");
  row.className = "profile-row";
  const label = createRowLabel("Full Name", fullName || null, "Copy full name");

  if (!fullName) {
    const emptyValue = document.createElement("span");
    emptyValue.className = "empty-value";
    row.append(label, emptyValue);
    sectionElement.append(row);
    return;
  }

  const nameParts = document.createElement("div");
  nameParts.className = "name-parts";
  const { first, last } = splitName(fullName);

  [first, last].filter(Boolean).forEach((part) => {
    const button = document.createElement("button");
    button.className = "date-part name-part";
    button.type = "button";
    button.textContent = part;
    button.title = `Copy ${part}`;
    button.addEventListener("click", () => copyValue(part, button));
    nameParts.append(button);
  });

  row.append(label, nameParts);
  sectionElement.append(row);
}

function appendDateField(sectionElement, field) {
  const parts = field.value.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) {
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

  parts.slice(0, 2).forEach((datePart, index) => {
    if (index > 0) {
      const separator = document.createElement("span");
      separator.className = "date-separator";
      separator.textContent = "–";
      dateRange.append(separator);
    }

    const yearButton = document.createElement("button");
    yearButton.className = "date-part";
    yearButton.type = "button";
    yearButton.textContent = datePart;
    yearButton.title = `Copy ${datePart}`;
    yearButton.addEventListener("click", () => copyValue(datePart, yearButton));
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
  if (section.positions || section.entries) input.dataset.positionIndex = String(groupIndex);
  input.addEventListener("keydown", handleEditorKeydown);
  if (sectionKey === "education") {
    input.addEventListener("input", () => input.removeAttribute("aria-invalid"));
  }
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

function appendDateEditField(sectionElement, sectionKey, field, fieldIndex, groupIndex) {
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
  if (groupIndex !== undefined) dateInputs.dataset.positionIndex = String(groupIndex);

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
      input.removeAttribute("aria-invalid");
    });
    input.addEventListener("keydown", handleEditorKeydown);
    dateInputs.append(input);
  });

  row.append(label, dateInputs);
  sectionElement.append(row);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseMonthYear(value) {
  const trimmedValue = value.trim();
  if (["present", "current", "now"].includes(trimmedValue.toLowerCase())) {
    return { month: "Present", year: "" };
  }

  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    return { month: MONTHS[Number(isoMatch[2]) - 1] || "", year: isoMatch[1] };
  }

  const monthYearMatch = trimmedValue.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const month = MONTHS.find((candidate) => candidate.toLowerCase() === monthYearMatch[1].slice(0, 3).toLowerCase());
    return { month: month || "", year: monthYearMatch[2] };
  }

  return { month: "", year: trimmedValue.match(/\b\d{4}\b/)?.[0] || "" };
}

function formatLegacyExperienceDate(value) {
  const parsed = parseMonthYear(value);
  if (parsed.month === "Present") return "Present";
  return [parsed.month, parsed.year].filter(Boolean).join(" ");
}

function appendExperienceDateEditField(sectionElement, field, fieldIndex, positionIndex) {
  const parts = field.value.split(/\s+-\s+/, 2);
  const dates = [parseMonthYear(parts[0] || ""), parseMonthYear(parts[1] || "")];
  const row = document.createElement("div");
  row.className = "edit-row";

  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = field.label;

  const dateInputs = document.createElement("div");
  dateInputs.className = "experience-date-edit-range";
  dateInputs.dataset.section = "experience";
  dateInputs.dataset.positionIndex = String(positionIndex);
  dateInputs.dataset.fieldIndex = String(fieldIndex);

  dates.forEach((date, index) => {
    if (index > 0) {
      const separator = document.createElement("span");
      separator.className = "date-separator";
      separator.textContent = "–";
      dateInputs.append(separator);
    }

    const half = document.createElement("div");
    half.className = "experience-date-half";

    const month = document.createElement("select");
    month.className = "date-month-input";
    month.required = true;
    month.setAttribute("aria-label", `${index ? "End" : "Start"} month`);
    const placeholder = new Option("Month", "");
    placeholder.disabled = true;
    placeholder.hidden = true;
    month.append(placeholder);
    MONTHS.forEach((monthName) => month.append(new Option(monthName, monthName)));
    if (index === 1) month.append(new Option("Present", "Present"));
    month.value = date.month;
    month.addEventListener("change", () => {
      const year = half.querySelector(".experience-date-year-input");
      if (month.value === "Present") year.value = "";
    });

    const year = document.createElement("input");
    year.className = "experience-date-year-input";
    year.type = "text";
    year.inputMode = "numeric";
    year.maxLength = 4;
    year.placeholder = "Year";
    year.setAttribute("aria-label", `${index ? "End" : "Start"} year`);
    year.value = date.year;
    year.addEventListener("input", () => {
      year.value = year.value.replace(/\D/g, "").slice(0, 4);
    });
    year.addEventListener("keydown", handleEditorKeydown);

    half.append(month, year);
    dateInputs.append(half);
  });

  row.append(label, dateInputs);
  sectionElement.append(row);
}

function appendNameEditField(sectionElement, sectionKey, field, fieldIndex) {
  const row = document.createElement("div");
  row.className = "edit-row";
  const label = document.createElement("span");
  label.className = "row-label";
  label.textContent = field.label;

  const fields = document.createElement("div");
  fields.className = "name-edit-fields";
  fields.dataset.section = sectionKey;
  fields.dataset.fieldIndex = String(fieldIndex);
  const { first, last } = splitName(field.value);

  [["First", first], ["Last", last]].forEach(([placeholder, value]) => {
    const input = document.createElement("input");
    input.className = "name-part-input";
    input.type = "text";
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    input.value = value;
    input.addEventListener("keydown", handleEditorKeydown);
    fields.append(input);
  });

  row.append(label, fields);
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

    const groupedEntries = section.positions || section.entries;
    const groups = groupedEntries || [{ fields: section.fields }];

    groups.forEach((group, groupIndex) => {
      if (groupedEntries) {
        const positionTitle = document.createElement("h3");
        positionTitle.className = "position-title";
        positionTitle.dataset.section = sectionKey;

        const positionLabel = document.createElement("span");
        const itemName = sectionKey === "education" ? "Education" : "Position";
        positionLabel.textContent = `${itemName} ${groupIndex + 1}`;
        positionTitle.append(positionLabel);

        if (isEditing && groupedEntries.length > 1) {
          const removeButton = document.createElement("button");
          removeButton.className = "remove-link-button";
          removeButton.type = "button";
          removeButton.textContent = "−";
          removeButton.title = `Remove ${itemName.toLowerCase()} ${groupIndex + 1}`;
          removeButton.setAttribute("aria-label", removeButton.title);
          const removeItem = sectionKey === "education" ? removeEducation : removePosition;
          removeButton.addEventListener("click", () => removeItem(groupIndex));
          positionTitle.append(removeButton);
        }

        sectionElement.append(positionTitle);
      }

      group.fields.forEach((field, fieldIndex) => {
        if (isEditing && sectionKey === "personal" && field.label === "Name") {
          appendNameEditField(sectionElement, sectionKey, field, fieldIndex);
        } else if (isEditing && sectionKey === "education" && field.label === "Date") {
          appendDateEditField(sectionElement, sectionKey, field, fieldIndex, groupIndex);
        } else if (isEditing && sectionKey === "experience" && field.label === "Date") {
          appendExperienceDateEditField(sectionElement, field, fieldIndex, groupIndex);
        } else if (isEditing) {
          appendEditField(sectionElement, sectionKey, section, field, fieldIndex, groupIndex);
        } else if (sectionKey === "personal" && field.label === "Name") {
          appendNameField(sectionElement, field);
        } else if (["education", "experience"].includes(sectionKey) && field.label === "Date") {
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
  profileElement.querySelector(
    `.name-edit-fields[data-section="${sectionKey}"] .name-part-input, textarea[data-section="${sectionKey}"]`
  )?.focus();
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
    const groupedEntries = section.positions || section.entries;
    const fields = input.dataset.positionIndex === undefined
      ? section.fields
      : groupedEntries[Number(input.dataset.positionIndex)].fields;
    const field = fields[Number(input.dataset.fieldIndex)];
    field.value = input.value;
  });

  profileElement.querySelectorAll(".date-edit-range").forEach((dateInputs) => {
    const section = updatedProfile[dateInputs.dataset.section];
    const groupedEntries = section.positions || section.entries;
    const fields = dateInputs.dataset.positionIndex === undefined
      ? section.fields
      : groupedEntries[Number(dateInputs.dataset.positionIndex)].fields;
    const field = fields[Number(dateInputs.dataset.fieldIndex)];
    const years = dateInputs.querySelectorAll(".date-year-input");
    field.value = `${years[0].value} - ${years[1].value}`;
  });

  profileElement.querySelectorAll(".experience-date-edit-range").forEach((dateInputs) => {
    const position = updatedProfile.experience.positions[Number(dateInputs.dataset.positionIndex)];
    const field = position.fields[Number(dateInputs.dataset.fieldIndex)];
    const halves = dateInputs.querySelectorAll(".experience-date-half");
    const values = Array.from(halves, (half) => {
      const month = half.querySelector(".date-month-input").value;
      const year = half.querySelector(".experience-date-year-input").value;
      return month === "Present" ? "Present" : [month, year].filter(Boolean).join(" ");
    });
    field.value = `${values[0]} - ${values[1]}`;
  });

  profileElement.querySelectorAll(".name-edit-fields").forEach((nameInputs) => {
    const section = updatedProfile[nameInputs.dataset.section];
    const field = section.fields[Number(nameInputs.dataset.fieldIndex)];
    const parts = nameInputs.querySelectorAll(".name-part-input");
    field.value = [parts[0].value.trim(), parts[1].value.trim()].filter(Boolean).join(" ");
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

function experienceDateInputsAreValid() {
  const halves = Array.from(profileElement.querySelectorAll(".experience-date-half"));
  const invalidHalf = halves.find((half) => {
    const month = half.querySelector(".date-month-input");
    const year = half.querySelector(".experience-date-year-input");
    return !month.value || (month.value !== "Present" && !/^\d{4}$/.test(year.value));
  });

  if (!invalidHalf) return true;
  const month = invalidHalf.querySelector(".date-month-input");
  const year = invalidHalf.querySelector(".experience-date-year-input");
  (month.value ? year : month).focus();
  showStatus(month.value ? "Enter a 4-digit year" : "Choose a month", true);
  return false;
}

function educationFieldsAreComplete() {
  const inputs = Array.from(profileElement.querySelectorAll(
    'textarea[data-section="education"], .date-edit-range[data-section="education"] .date-year-input'
  ));
  inputs.forEach((input) => input.removeAttribute("aria-invalid"));

  const emptyInputs = inputs.filter((input) => !input.value.trim());
  if (!emptyInputs.length) return true;

  emptyInputs.forEach((input) => input.setAttribute("aria-invalid", "true"));
  emptyInputs[0].focus();
  showStatus("Complete every education field", true);
  return false;
}

function addPosition() {
  editingProfile = readEditorValues();
  editingProfile.experience.positions.push({
    fields: [
      { label: "Title", value: "" },
      { label: "Company", value: "" },
      { label: "Location", value: "" },
      { label: "Date", value: " - " },
      { label: "Description", value: "" }
    ]
  });
  renderProfile();
  const inputs = profileElement.querySelectorAll('textarea[data-section="experience"]');
  inputs[inputs.length - 6]?.focus();
}

function removePosition(positionIndex) {
  editingProfile = readEditorValues();
  editingProfile.experience.positions.splice(positionIndex, 1);
  renderProfile();

  const positions = profileElement.querySelectorAll('.position-title[data-section="experience"]');
  positions[Math.min(positionIndex, positions.length - 1)]?.scrollIntoView({ block: "nearest" });
}

function addEducation() {
  editingProfile = readEditorValues();
  editingProfile.education.entries.push({
    fields: [
      { label: "School", value: "" },
      { label: "Degree", value: "" },
      { label: "Discipline", value: "" },
      { label: "Date", value: " - " }
    ]
  });
  renderProfile();
  const inputs = profileElement.querySelectorAll('textarea[data-section="education"]');
  inputs[inputs.length - 3]?.focus();
}

function removeEducation(educationIndex) {
  editingProfile = readEditorValues();
  editingProfile.education.entries.splice(educationIndex, 1);
  renderProfile();

  const entries = profileElement.querySelectorAll('.position-title[data-section="education"]');
  entries[Math.min(educationIndex, entries.length - 1)]?.scrollIntoView({ block: "nearest" });
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
  const dateRange = position.fields.find((field) => field.label === "Date")?.value || "";
  const endDate = dateRange.split(/\s+-\s+/)[1]?.trim();
  if (!endDate) return Number.NEGATIVE_INFINITY;
  if (["present", "current", "now"].includes(endDate.toLowerCase())) return Number.POSITIVE_INFINITY;

  const parsedDate = Date.parse(endDate);
  return Number.isNaN(parsedDate) ? Number.NEGATIVE_INFINITY : parsedDate;
}

function sortExperiencePositions(profile) {
  profile.experience.positions.sort((first, second) => endDateValue(second) - endDateValue(first));
  return profile;
}

function normalizeLinkValue(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue || /^https?:\/\//i.test(trimmedValue)) return trimmedValue;
  return `https://${trimmedValue}`;
}

function normalizeLinks(profile) {
  profile.links.fields.forEach((field) => {
    field.value = normalizeLinkValue(field.value);
  });
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
    if (section.positions || section.entries) {
      const collectionKey = section.positions ? "positions" : "entries";
      const savedPositions = savedProfile?.[sectionKey]?.[collectionKey];
      const legacyFields = savedProfile?.[sectionKey]?.fields;
      const defaultEntry = section[collectionKey][0];

      if (Array.isArray(savedPositions)) {
        section[collectionKey] = savedPositions.map((savedPosition) => {
          const position = JSON.parse(JSON.stringify(defaultEntry));
          if (sectionKey === "education") {
            mergeEducationFields(position.fields, savedPosition.fields || []);
            return position;
          }
          position.fields.forEach((field) => {
            const savedField = savedPosition.fields?.find((candidate) => candidate.label === field.label);
            if (savedField && typeof savedField.value === "string") {
              field.value = savedField.value;
            } else if (field.label === "Date") {
              const start = savedPosition.fields?.find((candidate) => candidate.label === "Start Date")?.value || "";
              const end = savedPosition.fields?.find((candidate) => candidate.label === "End Date")?.value || "";
              field.value = `${formatLegacyExperienceDate(start)} - ${formatLegacyExperienceDate(end)}`;
            }
          });
          return position;
        });
      } else if (Array.isArray(legacyFields)) {
        if (sectionKey === "education") {
          mergeEducationFields(section[collectionKey][0].fields, legacyFields);
          return;
        }
        section[collectionKey][0].fields.forEach((field) => {
          const savedField = legacyFields.find((candidate) => candidate.label === field.label);
          if (savedField && typeof savedField.value === "string") {
            field.value = savedField.value;
          } else if (field.label === "Date") {
            const start = legacyFields.find((candidate) => candidate.label === "Start Date")?.value || "";
            const end = legacyFields.find((candidate) => candidate.label === "End Date")?.value || "";
            field.value = `${formatLegacyExperienceDate(start)} - ${formatLegacyExperienceDate(end)}`;
          }
        });
      }
      return;
    }

    const savedFields = savedProfile?.[sectionKey]?.fields;
    if (!Array.isArray(savedFields)) return;

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

  return normalizeLinks(sortExperiencePositions(mergedProfile));
}

async function saveSection() {
  if (!educationFieldsAreComplete() || !dateInputsAreValid() || !experienceDateInputsAreValid()) return;
  const updatedProfile = normalizeLinks(sortExperiencePositions(readEditorValues()));

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
