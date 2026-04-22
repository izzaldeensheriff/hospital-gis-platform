"use strict";

/**
 * Open a dialog by element ID.
 * @param {string} dialogId - The dialog element ID.
 */
function showDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) {
        return;
    }
    dialog.showModal();
}

/**
 * Close a dialog element.
 * @param {HTMLDialogElement} dialog - The dialog element.
 */
function closeDialog(dialog) {
    if (!dialog) {
        return;
    }
    dialog.close();
}

/**
 * Collect values from a dialog form.
 * @param {HTMLDialogElement} dialog - Dialog containing form fields.
 * @returns {Object} Form values.
 */
function getDialogFormValues(dialog) {
    const formValues = {};
    const elements = dialog.querySelectorAll("input, select, textarea");

    elements.forEach(function (element) {
        if (!element.id && !element.name) {
            return;
        }

        if (element.type === "radio") {
            if (element.checked) {
                formValues[element.name || element.id] = element.value;
            }
        } else if (element.type === "checkbox") {
            formValues[element.id] = element.checked;
        } else {
            formValues[element.id] = element.value;
        }
    });

    return formValues;
}

/**
 * Save a dialog by routing the data to the correct handler.
 * @param {HTMLDialogElement} dialog - The dialog being saved.
 */
function saveDialog(dialog) {
    if (!dialog) {
        return;
    }

    const formValues = getDialogFormValues(dialog);

    if (dialog.id === "hospitalFormDialog") {
        if (typeof saveNewHospital === "function") {
            saveNewHospital(formValues);
        }
        return;
    }

    if (dialog.id === "queueCleanlinessFormDialog") {
        if (typeof saveQueueCleanlinessReport === "function") {
            saveQueueCleanlinessReport(formValues);
        }
        return;
    }

    dialog.close();
}

/**
 * Show the default hospital layer.
 */
function showDefaultHospitalLayer() {
    if (typeof showOnlyDefaultLayer === "function") {
        showOnlyDefaultLayer();
    }
}

/**
 * Show the user ranking.
 */
function showUserRanking() {
    if (typeof getUserRanking === "function") {
        getUserRanking();
    }
}

/**
 * Show the closest hospitals layer.
 */
function showClosestHospitalsLayer() {
    if (typeof getClosestHospitals === "function") {
        getClosestHospitals();
    }
}

/**
 * Remove the closest hospitals layer.
 */
function removeClosestHospitalsLayer() {
    if (typeof removeClosestHospitals === "function") {
        removeClosestHospitals();
    }
}

/**
 * Show the unknown queue layer.
 */
function showUnknownQueueLayer() {
    if (typeof getUnknownQueueHospitals === "function") {
        getUnknownQueueHospitals();
    }
}

/**
 * Remove the unknown queue layer.
 */
function removeUnknownQueueLayer() {
    if (typeof removeUnknownQueueHospitals === "function") {
        removeUnknownQueueHospitals();
    }
}

/**
 * Show the hospital queue bar chart.
 */
function showHospitalQueueBarChart() {
    if (typeof getHospitalQueueBarChartData === "function") {
        getHospitalQueueBarChartData();
    }
}