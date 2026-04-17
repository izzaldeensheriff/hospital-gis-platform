"use strict";

function showDialog(dialogName) {
    const dialog = document.getElementById(dialogName);
    if (!dialog) {
        console.log("Dialog not found:", dialogName);
        return;
    }
    dialog.showModal();
}

function closeDialog(dialog) {
    if (!dialog) {
        return;
    }
    dialog.close();
}

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

function saveDialog(dialog) {
    if (!dialog) {
        return;
    }

    const formValues = getDialogFormValues(dialog);
    console.log("Saving dialog:", dialog.id, formValues);

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

function loadUserHospitals() {
    if (typeof getUserHospitals === "function") {
        getUserHospitals();
    } else {
        console.log("getUserHospitals is not available");
    }
}

function loadDefaultHospitalLayer() {
    if (typeof removeReportingLayer === "function") {
        removeReportingLayer();
    }

    if (typeof getUserHospitals === "function") {
        getUserHospitals();
    } else {
        console.log("getUserHospitals is not available");
    }
}

function showUserRanking() {
    if (typeof getUserRanking === "function") {
        getUserRanking();
    } else {
        console.log("getUserRanking is not available");
    }
}

function showClosestHospitalsLayer() {
    if (typeof getClosestHospitals === "function") {
        getClosestHospitals();
    } else {
        console.log("getClosestHospitals is not available");
    }
}

function showUnknownQueueLayer() {
    if (typeof getUnknownQueueHospitals === "function") {
        getUnknownQueueHospitals();
    } else {
        console.log("getUnknownQueueHospitals is not available");
    }
}

function showHospitalBarChart() {
    if (typeof getHospitalQueueBarChartData === "function") {
        getHospitalQueueBarChartData();
    } else {
        console.log("getHospitalQueueBarChartData is not available");
    }
}