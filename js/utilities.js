/**
 * AI Assistance Acknowledgement:
 * This file was developed with the assistance of ChatGPT (OpenAI, GPT-5.3).
 * ChatGPT was used to support debugging, code structuring, and optimisation.
 * All outputs were reviewed, tested, and adapted by the author.
 * 
 * Tool: ChatGPT
 * Version: GPT-5.3
 * Provider: OpenAI
 * URL: https://chat.openai.com/
 */

/**
 * Utilities and UI Handlers
 * Manages dialog interactions, layer switching,
 * and user-triggered actions from the menu.
 */
"use strict";

/**
 * Global user ID.
 */
let userId = null;

/**
 * Queue length options loaded from the database.
 */
let queueLengthOptions = [];

/**
 * Hospital properties lookup for popup report buttons.
 */
let popupHospitalLookup = {};

/**
 * Current chart instance.
 */
let hospitalQueueChart = null;

/**
 * Stores the current user's hospital GeoJSON features.
 */
let userHospitalFeatures = [];

/**
 * Prevent repeated proximity popups for the same hospital.
 */
let lastProximityHospitalId = null;

/**
 * Current map mode.
 * Values: "default" or "reporting".
 */
let currentMapMode = "default";

/**
 * Base URL for API requests.
 */
const apiBase = window.location.origin;

/**
 * Route prefixes. Change only if your API uses different route names.
 */
const crudRoute = "crudAPI";
const geoJsonRoute = "geojsonAPI";

/**
 * Run when the page loads.
 */
document.addEventListener("DOMContentLoaded", function () {
    if (typeof loadMap === "function" && !window._mapAlreadyLoaded) {
        loadMap();
        window._mapAlreadyLoaded = true;
    }

    getUserIdFromApi();
}, false);

/**
 * Build a CRUD API URL.
 * @param {string} endpoint - Endpoint path without leading slash.
 * @returns {string} Full API URL.
 */
function buildCrudUrl(endpoint) {
    return apiBase + "/api/" + crudRoute + "/" + endpoint;
}

/**
 * Build a GeoJSON API URL.
 * @param {string} endpoint - Endpoint path without leading slash.
 * @returns {string} Full API URL.
 */
function buildGeoJsonUrl(endpoint) {
    return apiBase + "/api/" + geoJsonRoute + "/" + endpoint;
}

/**
 * Get the user ID from the API.
 */
function getUserIdFromApi() {
    fetch(buildCrudUrl("user_id"), { cache: "no-store" })
        .then(function (response) {
            return response.text().then(function (rawText) {
                if (!response.ok) {
                    throw new Error("HTTP " + response.status + ": " + rawText);
                }

                const parsedUserId = Number(rawText.trim());

                if (!Number.isInteger(parsedUserId)) {
                    throw new Error("user_id is not a valid integer.");
                }

                userId = parsedUserId;

                const userDisplay = document.getElementById("userIdDisplay");
                if (userDisplay) {
                    userDisplay.innerText = "User ID: " + userId;
                }

                getQueueLengths();
                showOnlyDefaultLayer();
            });
        })
        .catch(function () {
            const userDisplay = document.getElementById("userIdDisplay");
            if (userDisplay) {
                userDisplay.innerText = "User ID load failed";
            }
        });
}

/**
 * Get queue length options from the API.
 */
function getQueueLengths() {
    fetch(buildGeoJsonUrl("getQueueLengths"))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            queueLengthOptions = data.features || [];
            buildQueueLengthOptions();
        })
        .catch(function () {
            return;
        });
}

/**
 * Build radio button options for queue lengths.
 */
function buildQueueLengthOptions() {
    const container = document.getElementById("queueLengthOptions");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!queueLengthOptions || queueLengthOptions.length === 0) {
        container.innerHTML = "<p class='text-muted mb-0'>No queue options available.</p>";
        return;
    }

    queueLengthOptions.forEach(function (feature, index) {
        const props = feature.properties || {};
        const optionId = "queue_option_" + index;

        const wrapper = document.createElement("div");
        wrapper.className = "form-check";

        wrapper.innerHTML =
            '<input class="form-check-input" type="radio" name="queue_length_description" ' +
            'id="' + optionId + '" value="' + (props.queue_length_description || "") + '">' +
            '<label class="form-check-label" for="' + optionId + '">' +
            (props.queue_length_description || "Unknown") +
            "</label>";

        container.appendChild(wrapper);
    });
}

/**
 * Restore only the default user hospital layer.
 */
function showOnlyDefaultLayer() {
    currentMapMode = "default";

    reportingLayer.clearLayers();

    if (mymap.hasLayer(reportingLayer)) {
        mymap.removeLayer(reportingLayer);
    }

    if (!mymap.hasLayer(defaultHospitalLayer)) {
        defaultHospitalLayer.addTo(mymap);
    }

    getUserHospitals();
}

/**
 * Switch to reporting layer mode only.
 */
function showOnlyReportingLayer() {
    currentMapMode = "reporting";

    defaultHospitalLayer.clearLayers();

    if (mymap.hasLayer(defaultHospitalLayer)) {
        mymap.removeLayer(defaultHospitalLayer);
    }

    reportingLayer.clearLayers();

    if (!mymap.hasLayer(reportingLayer)) {
        reportingLayer.addTo(mymap);
    }

    lastProximityHospitalId = null;
}

/**
 * Check whether the default hospital layer is currently active.
 * @returns {boolean} True if the default layer is active on a small screen.
 */
function isDefaultLayerActive() {
    return window.innerWidth < 768 && currentMapMode === "default";
}


 /**
 * Checks if the user is within ~25 metres of a hospital
 * using the last five recorded positions.
 * Triggers the reporting form automatically when conditions are met.
 */
function checkProximityAlert() {
    if (!isDefaultLayerActive()) {
        lastProximityHospitalId = null;
        return;
    }

    if (!lastFivePositions || lastFivePositions.length < 5) {
        return;
    }

    if (!userHospitalFeatures || userHospitalFeatures.length === 0) {
        return;
    }

    let matchedHospital = null;

    userHospitalFeatures.forEach(function (feature) {
        if (matchedHospital) {
            return;
        }

        if (!feature.geometry || !feature.geometry.coordinates) {
            return;
        }

        const coords = feature.geometry.coordinates;
        const hospitalLatLng = L.latLng(coords[1], coords[0]);

        const allFiveWithinRange = lastFivePositions.every(function (userPosition) {
            return userPosition.distanceTo(hospitalLatLng) <= 25;
        });

        if (allFiveWithinRange) {
            matchedHospital = feature;
        }
    });

    if (!matchedHospital) {
        lastProximityHospitalId = null;
        return;
    }

    const props = matchedHospital.properties || {};
    const hospitalId = props.hospital_id;

    if (!hospitalId) {
        return;
    }

    if (hospitalId === lastProximityHospitalId) {
        return;
    }

    lastProximityHospitalId = hospitalId;

    if (popupHospitalLookup[hospitalId]) {
        openQueueCleanlinessForm(popupHospitalLookup[hospitalId]);
    }
}

/**
 * Open the queue and cleanliness report form.
 * @param {Object} properties - Hospital properties.
 */
function openQueueCleanlinessForm(properties) {
    const hospitalIdInput = document.getElementById("report_hospital_id");
    const hospitalNameInput = document.getElementById("report_hospital_name");
    const reportUserInput = document.getElementById("report_user_id");
    const hospitalNameDisplay = document.getElementById("report_hospital_name_display");
    const previousQueueInput = document.getElementById("previous_queue_length_id");
    const textarea = document.getElementById("cleanliness");
    const radios = document.querySelectorAll('input[name="queue_length_description"]');

    if (hospitalIdInput) {
        hospitalIdInput.value = properties.hospital_id || "";
    }

    if (hospitalNameInput) {
        hospitalNameInput.value = properties.hospital_name || "";
    }

    if (reportUserInput) {
        reportUserInput.value = userId || "";
    }

    if (hospitalNameDisplay) {
        hospitalNameDisplay.innerText = properties.hospital_name || "";
    }

    if (previousQueueInput) {
        previousQueueInput.value = properties.queue_length_id || "";
    }

    if (textarea) {
        textarea.value = "";
    }

    radios.forEach(function (radio) {
        radio.checked = false;
    });

    showDialog("queueCleanlinessFormDialog");
}

/**
 * Open the queue and cleanliness form by hospital ID.
 * @param {number|string} hospitalId - Hospital ID.
 */
function openQueueCleanlinessFormById(hospitalId) {
    const props = popupHospitalLookup[hospitalId];
    if (props) {
        openQueueCleanlinessForm(props);
    }
}

/**
 * Save a new hospital.
 * @param {Object} formValues - Form values.
 */
function saveNewHospital(formValues) {
    const hospitalName = formValues.hospital_name ? formValues.hospital_name.trim() : "";
    const inspectionDate = formValues.hospital_inspection_date ? formValues.hospital_inspection_date.trim() : "";
    const hospitalUserId = formValues.hospital_user_id ? formValues.hospital_user_id : userId;
    const latitude = formValues.hospital_latitude;
    const longitude = formValues.hospital_longitude;

    if (!hospitalName || !inspectionDate) {
        alert("Please enter both the hospital name and inspection date.");
        return;
    }

    if (!latitude || !longitude) {
        alert("Please click on the map first to choose a hospital location.");
        return;
    }

    const payload = {
        user_id: hospitalUserId,
        hospital_name: hospitalName,
        hospital_last_officially_inspected: inspectionDate,
        latitude: latitude,
        longitude: longitude
    };

    fetch(buildCrudUrl("insertHospital"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(function (response) {
            if (!response.ok) {
                return response.text().then(function (text) {
                    throw new Error(text || ("Server error: " + response.status));
                });
            }
            return response.json();
        })
        .then(function () {
            const dialog = document.getElementById("hospitalFormDialog");
            const form = document.getElementById("hospitalForm");

            if (dialog) {
                dialog.close();
            }

            if (form) {
                form.reset();
            }

            selectedHospitalLatLng = null;
            disableHospitalCreation();

            alert("Hospital saved successfully and added to your map.");
            getUserHospitals();
        })
        .catch(function (error) {
            const errorMessage = String(error).toLowerCase();

            if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
                alert("That hospital name already exists. Please enter a different hospital name.");
            } else {
                alert("Error saving hospital.");
            }
        });
}

/**
 * Save a cleanliness and queue report.
 * @param {Object} formValues - Form values.
 */
function saveQueueCleanlinessReport(formValues) {
    const hospitalName = formValues.report_hospital_name ? formValues.report_hospital_name.trim() : "";
    const cleanliness = formValues.cleanliness ? formValues.cleanliness.trim() : "";
    const queueLengthDescription = formValues.queue_length_description;
    const reportUserId = formValues.report_user_id ? formValues.report_user_id : userId;
    const previousQueueLengthId = formValues.previous_queue_length_id ? Number(formValues.previous_queue_length_id) : null;

    if (!hospitalName || !queueLengthDescription || !cleanliness) {
        alert("Please select a queue length and enter a cleanliness description.");
        return;
    }

    const payload = {
        hospital_name: hospitalName,
        cleanliness: cleanliness,
        queue_length_description: queueLengthDescription,
        user_id: reportUserId
    };

    fetch(buildCrudUrl("insertCleanlinessQueueReport"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function () {
            const dialog = document.getElementById("queueCleanlinessFormDialog");
            const form = document.getElementById("queueCleanlinessForm");

            if (dialog) {
                dialog.close();
            }

            if (form) {
                form.reset();
            }

            let currentQueueLengthId = null;

            const matchedQueue = queueLengthOptions.find(function (feature) {
                return feature.properties &&
                    feature.properties.queue_length_description === queueLengthDescription;
            });

            if (matchedQueue && matchedQueue.properties) {
                currentQueueLengthId = Number(matchedQueue.properties.queue_length_id);
            }

            if (previousQueueLengthId !== null && currentQueueLengthId !== null) {
                if (currentQueueLengthId > previousQueueLengthId) {
                    alert("Queue is higher than the previous report.");
                } else if (currentQueueLengthId < previousQueueLengthId) {
                    alert("Queue is lower than the previous report.");
                } else {
                    alert("Queue is the same as the previous report.");
                }
            } else {
                alert("Cleanliness/queue report saved successfully.");
            }

            getUserHospitals();
            getNumCleanlinessQueueReports();
        })
        .catch(function () {
            alert("Error saving cleanliness/queue report.");
        });
}

/**
 * Maps queue length descriptions to visual colours
 * for intuitive representation on the map.
 * Used to distinguish hospital queue severity.
 */
function getQueueColour(queueDescription) {
    if (!queueDescription) {
        return "gray";
    }

    const value = String(queueDescription).toLowerCase();

    if (value.includes("very long") || value.includes("over 4")) {
        return "red";
    }

    if (value.includes("moderately long") || value.includes("between 2 and 4")) {
        return "orange";
    }

    if (value.includes("ok") || value.includes("between 30 minutes and 2 hours")) {
        return "yellow";
    }

    if (value.includes("very short") || value.includes("less than 10 minutes")) {
        return "darkgreen";
    }

    if (value.includes("short") || value.includes("less than 30 minutes")) {
        return "green";
    }

    if (value.includes("no queue")) {
        return "blue";
    }

    if (value.includes("unknown")) {
        return "gray";
    }

    return "gray";
}

/**
 * Retrieves hospitals for the current user from the API,
 * renders them on the map, and binds popup interactions.
 * Also updates internal lookup structures for reporting.
 */
function getUserHospitals() {
    if (!userId) {
        return;
    }

    fetch(buildGeoJsonUrl("hospitalsByUser/" + userId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            popupHospitalLookup = {};
            userHospitalFeatures = [];
            defaultHospitalLayer.clearLayers();

            if (!data || !data.features || data.features.length === 0) {
                return;
            }

            userHospitalFeatures = data.features;

            const geoJsonLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    const props = feature.properties || {};
                    const queueDescription = props.queue_length_description || "Unknown";
                    const fillColour = getQueueColour(queueDescription);

                    return L.circleMarker(latlng, {
                        radius: 8,
                        fillColor: fillColour,
                        color: "#222222",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.85
                    });
                },
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    const hospitalId = props.hospital_id || "";

                    popupHospitalLookup[hospitalId] = props;

                    let popupContent = "<div style='min-width:200px;'>";
                    popupContent += "<h6 style='margin-bottom:5px;'>" + (props.hospital_name || "Hospital") + "</h6>";
                    popupContent += "<p style='margin:0; font-size:13px;'>";
                    popupContent += "<strong>ID:</strong> " + hospitalId + "<br>";
                    popupContent += "<strong>Last Inspected:</strong> " + (props.last_inspected || "N/A") + "<br>";
                    popupContent += "<strong>Queue:</strong> " + (props.queue_length_description || "Unknown") + "<br>";
                    popupContent += "<strong>Cleanliness:</strong> " + (props.cleanliness || "N/A");
                    popupContent += "</p>";
                    popupContent += "<div style='margin-top:8px; text-align:right;'>";
                    popupContent += "<button type='button' class='btn btn-sm btn-primary' onclick='openQueueCleanlinessFormById(" + hospitalId + ")'>";
                    popupContent += "Add Report</button>";
                    popupContent += "</div>";
                    popupContent += "</div>";

                    layer.bindPopup(popupContent);
                }
            });

            defaultHospitalLayer.addLayer(geoJsonLayer);

            if (!mymap.hasLayer(defaultHospitalLayer)) {
                defaultHospitalLayer.addTo(mymap);
            }

            try {
                mymap.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            } catch (error) {
                return;
            }
        })
        .catch(function () {
            return;
        });
}

/**
 * Get the number of reports submitted by the current user.
 */
function getNumCleanlinessQueueReports() {
    if (!userId) {
        return;
    }

    fetch(buildGeoJsonUrl("numCleanlinessQueueReports/" + userId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            if (data && data.array_to_json && data.array_to_json.length > 0) {
                alert("You have submitted " + data.array_to_json[0].num_reports + " reports.");
            }
        })
        .catch(function () {
            return;
        });
}

/**
 * Get the current user's ranking.
 */
function getUserRanking() {
    if (!userId) {
        return;
    }

    fetch(buildGeoJsonUrl("userCleanlinessQueueRanking/" + userId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            if (data && data.array_to_json && data.array_to_json.length > 0) {
                alert("Your current ranking is: " + data.array_to_json[0].rank);
            } else if (data && data.features && data.features.length > 0 && data.features[0].properties) {
                alert("Your current ranking is: " + data.features[0].properties.rank);
            } else {
                alert("No ranking information available yet.");
            }
        })
        .catch(function () {
            alert("Error getting user ranking.");
        });
}

/**
 * Get the five closest hospitals to the current user location.
 */
function getClosestHospitals() {
    if (!currentUserLatLng) {
        alert("User location is not available yet.");
        return;
    }

    const latitude = currentUserLatLng[0];
    const longitude = currentUserLatLng[1];

    showOnlyReportingLayer();

    fetch(buildGeoJsonUrl("fiveClosestHospitals/" + latitude + "/" + longitude))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.features || data.features.length === 0) {
                alert("No nearby hospitals found.");
                return;
            }

            const geoJsonLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    let popupContent = "<div style='min-width:200px;'>";
                    popupContent += "<h6 style='margin-bottom:5px;'>" + (props.hospital_name || "Hospital") + "</h6>";
                    popupContent += "<p style='margin:0; font-size:13px;'>";
                    popupContent += "<strong>ID:</strong> " + (props.hospital_id || "") + "<br>";
                    popupContent += "<strong>Last Inspected:</strong> " + (props.last_inspected || "N/A") + "<br>";
                    popupContent += "<strong>Reporting:</strong> Not available on closest hospitals layer";
                    popupContent += "</p>";
                    popupContent += "</div>";

                    layer.bindPopup(popupContent);
                }
            });

            reportingLayer.addLayer(geoJsonLayer);

            if (!mymap.hasLayer(reportingLayer)) {
                reportingLayer.addTo(mymap);
            }

            try {
                mymap.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            } catch (error) {
                return;
            }
        })
        .catch(function () {
            alert("Error loading closest hospitals.");
        });
}

/**
 * Remove the closest hospitals layer and restore the default layer.
 */
function removeClosestHospitals() {
    reportingLayer.clearLayers();
    showOnlyDefaultLayer();
}

/**
 * Get hospitals with unknown queue length for the current user.
 */
function getUnknownQueueHospitals() {
    if (!userId) {
        return;
    }

    showOnlyReportingLayer();

    fetch(buildGeoJsonUrl("hospitalsQueueLengthUnknown/" + userId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            if (!data || !data.features || data.features.length === 0) {
                alert("No hospitals with unknown queue length found.");
                return;
            }

            const geoJsonLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng);
                },
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    let popupContent = "<div style='min-width:200px;'>";
                    popupContent += "<h6 style='margin-bottom:5px;'>" + (props.hospital_name || "Hospital") + "</h6>";
                    popupContent += "<p style='margin:0; font-size:13px;'>";
                    popupContent += "<strong>Queue:</strong> " + (props.queue_length_description || "Unknown") + "<br>";
                    popupContent += "<strong>Cleanliness:</strong> " + (props.cleanliness || "N/A") + "<br>";
                    popupContent += "<strong>Reporting:</strong> Not available on unknown queue layer";
                    popupContent += "</p>";
                    popupContent += "</div>";

                    layer.bindPopup(popupContent);
                }
            });

            reportingLayer.addLayer(geoJsonLayer);

            if (!mymap.hasLayer(reportingLayer)) {
                reportingLayer.addTo(mymap);
            }

            try {
                mymap.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            } catch (error) {
                return;
            }
        })
        .catch(function () {
            alert("Error loading unknown queue hospitals.");
        });
}

/**
 * Remove the unknown queue layer and restore the default layer.
 */
function removeUnknownQueueHospitals() {
    reportingLayer.clearLayers();
    showOnlyDefaultLayer();
}

/**
 * Retrieves aggregated hospital queue data from the API
 * and renders a bar chart using Chart.js.
 * Updates dynamically based on latest database values.
 */
function getHospitalQueueBarChartData() {
    fetch(buildGeoJsonUrl("hospitalsByQueueLength"))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            const labels = [];
            const values = [];

            if (Array.isArray(data)) {
                data.forEach(function (item) {
                    labels.push(item.queue_length_description || "Unknown");
                    values.push(Number(item.num_hospitals) || 0);
                });
            } else if (data.array_to_json) {
                data.array_to_json.forEach(function (item) {
                    labels.push(item.queue_length_description || "Unknown");
                    values.push(Number(item.num_hospitals) || 0);
                });
            } else if (data.features) {
                data.features.forEach(function (feature) {
                    const props = feature.properties || {};
                    labels.push(props.queue_length_description || "Unknown");
                    values.push(Number(props.num_hospitals) || 0);
                });
            }

            const canvas = document.getElementById("hospitalQueueChart");
            if (!canvas) {
                alert("Chart canvas not found.");
                return;
            }

            const ctx = canvas.getContext("2d");

            if (hospitalQueueChart) {
                hospitalQueueChart.destroy();
            }

            hospitalQueueChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Hospitals per Queue Length Category",
                        data: values,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            const chartContainer = document.getElementById("hospitalQueueChartContainer");
            if (chartContainer) {
                chartContainer.style.display = "block";
                chartContainer.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            if (typeof refreshMapSize === "function") {
                setTimeout(refreshMapSize, 200);
                setTimeout(refreshMapSize, 700);
            }
        })
        .catch(function () {
            alert("Error loading hospital queue bar chart data.");
        });
}

/**
 * Close the hospital queue chart.
 */
function closeHospitalChart() {
    const chartContainer = document.getElementById("hospitalQueueChartContainer");

    if (chartContainer) {
        chartContainer.style.display = "none";
    }

    if (hospitalQueueChart) {
        hospitalQueueChart.destroy();
        hospitalQueueChart = null;
    }

    if (typeof refreshMapSize === "function") {
        setTimeout(refreshMapSize, 200);
        setTimeout(refreshMapSize, 700);
    }
}