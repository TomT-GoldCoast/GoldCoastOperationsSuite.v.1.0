let vehicleDatabase = [];

// ===============================
// Tab Navigation
// ===============================

const tabButtons = document.querySelectorAll(".tab-button");
const screens = document.querySelectorAll(".screen");

tabButtons.forEach(button => {
    button.addEventListener("click", () => {
        tabButtons.forEach(tab => tab.classList.remove("active"));
        screens.forEach(screen => screen.classList.remove("active-screen"));

        button.classList.add("active");

        const screenID = button.dataset.screen;
        document.getElementById(screenID).classList.add("active-screen");
    });
});


// ===============================
// Load Templates and Data
// ===============================

Promise.all([
    fetch("templates/contact-sheet.html").then(response => response.text()),
    fetch("data/vehicle-database.json").then(response => response.json())
])
.then(([contactSheetHtml, vehicleData]) => {
    vehicleDatabase = vehicleData.manufacturers;

    document.getElementById("contactSheetContainer").innerHTML = contactSheetHtml;

    setupContactSheet();
    setupVehicleDatabase();
    setupJobStorage();
});


// ===============================
// Contact Sheet Setup
// ===============================

function setupContactSheet() {
    const addVehicleButton = document.getElementById("addVehicleButton");
    const vehicleGrid = document.getElementById("vehicleGrid");

    addVehicleButton.addEventListener("click", () => {
        addVehicleCard();
    });

    vehicleGrid.addEventListener("input", updateAllVehicleTitles);
    vehicleGrid.addEventListener("change", updateAllVehicleTitles);

    vehicleGrid.addEventListener("click", event => {
        if (event.target.classList.contains("remove-vehicle-button")) {
            event.target.closest(".vehicle-card").remove();
            renumberVehicles();
        }
    });

    renumberVehicles();
}

function addVehicleCard() {
    const vehicleGrid = document.getElementById("vehicleGrid");
    const currentCount = vehicleGrid.querySelectorAll(".vehicle-card").length;

    if (currentCount >= 50) {
        alert("Maximum of 50 vehicles reached.");
        return;
    }

    const firstVehicle = vehicleGrid.querySelector(".vehicle-card");
    const newVehicle = firstVehicle.cloneNode(true);

    clearVehicleCard(newVehicle);

    vehicleGrid.appendChild(newVehicle);

    const newMakeSelect = newVehicle.querySelector(".vehicle-make");
    populateMakeDropdown(newMakeSelect);
    connectMakeToModel(newMakeSelect);

    renumberVehicles();
}

function clearVehicleCard(vehicleCard) {
    const inputs = vehicleCard.querySelectorAll("input");
    inputs.forEach(input => input.value = "");

    const selects = vehicleCard.querySelectorAll("select");
    selects.forEach(select => select.selectedIndex = 0);

    const modelSelect = vehicleCard.querySelector(".vehicle-model");
    if (modelSelect) {
        modelSelect.innerHTML = '<option value="">Model</option>';
    }
}

function renumberVehicles() {
    const vehicleCards = document.querySelectorAll(".vehicle-card");

    vehicleCards.forEach((card, index) => {
        const vehicleNumber = index + 1;

        let titleRow = card.querySelector(".vehicle-title-row");

        if (!titleRow) {
            const oldTitle = card.querySelector("h4");

            titleRow = document.createElement("div");
            titleRow.className = "vehicle-title-row";

            const titleBlock = document.createElement("div");
            titleBlock.className = "vehicle-title-block";

            const mainTitle = document.createElement("h4");
            mainTitle.className = "vehicle-main-title";

            const subTitle = document.createElement("div");
            subTitle.className = "vehicle-sub-title";

            titleBlock.appendChild(mainTitle);
            titleBlock.appendChild(subTitle);
            titleRow.appendChild(titleBlock);

            oldTitle.replaceWith(titleRow);
        }

        const mainTitle = card.querySelector(".vehicle-main-title");
        mainTitle.textContent = "Vehicle #" + vehicleNumber;

        let removeButton = card.querySelector(".remove-vehicle-button");

        if (vehicleNumber === 1) {
            if (removeButton) {
                removeButton.remove();
            }
        } else {
            if (!removeButton) {
                removeButton = document.createElement("button");
                removeButton.type = "button";
                removeButton.className = "remove-vehicle-button";
                removeButton.textContent = "Remove";
                titleRow.appendChild(removeButton);
            }
        }
    });

    updateAllVehicleTitles();
}

function updateAllVehicleTitles() {
    const vehicleCards = document.querySelectorAll(".vehicle-card");

    vehicleCards.forEach(card => {
        const year = card.querySelector(".year-field select")?.value || "";
        const make = card.querySelector(".vehicle-make")?.value || "";
        const model = card.querySelector(".vehicle-model")?.value || "";

        const subTitle = card.querySelector(".vehicle-sub-title");

        const vehicleDescription = [year, make, model]
            .filter(item => item.trim() !== "")
            .join(" ");

        subTitle.textContent = vehicleDescription;
    });
}


// ===============================
// Vehicle Database Dropdowns
// ===============================

function setupVehicleDatabase() {
    const makeSelects = document.querySelectorAll(".vehicle-make");

    makeSelects.forEach(makeSelect => {
        populateMakeDropdown(makeSelect);
        connectMakeToModel(makeSelect);
    });
}

function populateMakeDropdown(makeSelect) {
    makeSelect.innerHTML = '<option value="">Make</option>';

    vehicleDatabase.forEach(manufacturer => {
        const option = document.createElement("option");
        option.value = manufacturer.name;
        option.textContent = manufacturer.name;
        makeSelect.appendChild(option);
    });
}

function connectMakeToModel(makeSelect) {
    makeSelect.addEventListener("change", () => {
        const vehicleCard = makeSelect.closest(".vehicle-card");
        const modelSelect = vehicleCard.querySelector(".vehicle-model");

        modelSelect.innerHTML = '<option value="">Model</option>';

        const selectedMake = vehicleDatabase.find(
            manufacturer => manufacturer.name === makeSelect.value
        );

        if (!selectedMake) {
            updateAllVehicleTitles();
            return;
        }

        selectedMake.models.forEach(model => {
            const option = document.createElement("option");
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
        });

        updateAllVehicleTitles();
    });
}


// ===============================
// Save / Load Jobs
// ===============================

function setupJobStorage() {
    const saveButton = document.getElementById("saveJobButton");
    const loadButton = document.getElementById("loadJobButton");
    const newJobButton = document.getElementById("newJobButton");

    saveButton.addEventListener("click", saveCurrentJob);
    loadButton.addEventListener("click", loadSavedJob);
    newJobButton.addEventListener("click", startNewJob);
}

function getContactSheetFields() {
    return Array.from(
        document.querySelectorAll("#contactSheetContainer input, #contactSheetContainer select, #contactSheetContainer textarea")
    );
}

function saveCurrentJob() {
    const jobNumberInput = document.getElementById("jobNumber");
    const jobNumber = jobNumberInput.value.trim();

    if (!jobNumber) {
        alert("Please enter a Job Number before saving.");
        return;
    }

    const fields = getContactSheetFields();

    const jobData = {
        jobNumber: jobNumber,
        savedAt: new Date().toISOString(),
        vehicleCount: document.querySelectorAll(".vehicle-card").length,
        fieldValues: fields.map(field => field.value)
    };

    localStorage.setItem("gcos_job_" + jobNumber, JSON.stringify(jobData));
    updateJobIndex(jobNumber);

    alert("Job saved: " + jobNumber);
}

function updateJobIndex(jobNumber) {
    const index = JSON.parse(localStorage.getItem("gcos_job_index")) || [];

    if (!index.includes(jobNumber)) {
        index.push(jobNumber);
    }

    localStorage.setItem("gcos_job_index", JSON.stringify(index));
}

function loadSavedJob() {
    const index = JSON.parse(localStorage.getItem("gcos_job_index")) || [];

    if (index.length === 0) {
        alert("No saved jobs found.");
        return;
    }

    const jobNumber = prompt(
        "Enter Job Number to load:\n\nSaved Jobs:\n" + index.join("\n")
    );

    if (!jobNumber) {
        return;
    }

    const savedJob = localStorage.getItem("gcos_job_" + jobNumber.trim());

    if (!savedJob) {
        alert("Job not found: " + jobNumber);
        return;
    }

    const jobData = JSON.parse(savedJob);

    rebuildVehicleCards(jobData.vehicleCount);
    restoreFieldValues(jobData.fieldValues);

    alert("Job loaded: " + jobData.jobNumber);
}

function rebuildVehicleCards(vehicleCount) {
    const vehicleGrid = document.getElementById("vehicleGrid");
    const vehicleCards = vehicleGrid.querySelectorAll(".vehicle-card");

    vehicleCards.forEach((card, index) => {
        if (index > 0) {
            card.remove();
        }
    });

    const firstVehicle = vehicleGrid.querySelector(".vehicle-card");
    clearVehicleCard(firstVehicle);

    for (let i = 1; i < vehicleCount; i++) {
        addVehicleCard();
    }

    renumberVehicles();
}

function restoreFieldValues(values) {
    const fields = getContactSheetFields();

    fields.forEach((field, index) => {
        field.value = values[index] || "";

        field.dispatchEvent(new Event("change", { bubbles: true }));
        field.dispatchEvent(new Event("input", { bubbles: true }));
    });

    updateAllVehicleTitles();
}

function startNewJob() {
    const confirmed = confirm("Start a new blank job? Unsaved changes will be lost.");

    if (!confirmed) {
        return;
    }

    rebuildVehicleCards(1);

    const fields = getContactSheetFields();

    fields.forEach(field => {
        if (field.id === "jobNumber") {
            field.value = generateTemporaryJobNumber();
        } else if (field.tagName === "SELECT") {
            field.selectedIndex = 0;
        } else {
            field.value = "";
        }

        field.dispatchEvent(new Event("change", { bubbles: true }));
        field.dispatchEvent(new Event("input", { bubbles: true }));
    });

    updateAllVehicleTitles();
}

function generateTemporaryJobNumber() {
    const now = new Date();

    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    return "GC-" + year + month + day + "-" + hour + minute;
}