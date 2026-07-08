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
setupFinancialCalculations();   
});


// ===============================
// Contact Sheet Setup
// ===============================

function setupContactSheet() {
    const addVehicleButton = document.getElementById("addVehicleButton");
    const vehicleGrid = document.getElementById("vehicleGrid");

    let vehicleCount = 1;

    addVehicleButton.addEventListener("click", () => {
        if (vehicleCount >= 50) {
            alert("Maximum of 50 vehicles reached.");
            return;
        }

        vehicleCount++;

        const firstVehicle = vehicleGrid.querySelector(".vehicle-card");
        const newVehicle = firstVehicle.cloneNode(true);

        clearVehicleCard(newVehicle);

        vehicleGrid.appendChild(newVehicle);

        const newMakeSelect = newVehicle.querySelector(".vehicle-make");
        populateMakeDropdown(newMakeSelect);
        connectMakeToModel(newMakeSelect);

        renumberVehicles();
    });

    vehicleGrid.addEventListener("input", updateAllVehicleTitles);
    vehicleGrid.addEventListener("change", updateAllVehicleTitles);

    vehicleGrid.addEventListener("click", event => {
        if (event.target.classList.contains("remove-vehicle-button")) {
            event.target.closest(".vehicle-card").remove();
            vehicleCount--;
            renumberVehicles();
        }
    });

    renumberVehicles();
}


// ===============================
// Vehicle Card Functions
// ===============================

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
// Financial Calculations
// ===============================

function setupFinancialCalculations() {
    const customerTotal = document.getElementById("customerTotal");
    const depositReceived = document.getElementById("depositReceived");
    const carrierRate = document.getElementById("carrierRate");
    const carrierPaid = document.getElementById("carrierPaid");

    const customerBalance = document.getElementById("customerBalance");
    const carrierBalance = document.getElementById("carrierBalance");
    const grossProfit = document.getElementById("grossProfit");

    const moneyInputs = [customerTotal, depositReceived, carrierRate, carrierPaid];

    moneyInputs.forEach(input => {
        input.addEventListener("input", calculateFinancials);
    });

    function calculateFinancials() {
        const total = Number(customerTotal.value) || 0;
        const deposit = Number(depositReceived.value) || 0;
        const rate = Number(carrierRate.value) || 0;
        const paid = Number(carrierPaid.value) || 0;

        const customerBalanceAmount = total - deposit;
        const carrierBalanceAmount = rate - paid;
        const profitAmount = total - rate;

        customerBalance.textContent = formatMoney(customerBalanceAmount);
        carrierBalance.textContent = formatMoney(carrierBalanceAmount);
        grossProfit.textContent = formatMoney(profitAmount);
    }
}

function formatMoney(amount) {
    return "$" + amount.toFixed(2);
}