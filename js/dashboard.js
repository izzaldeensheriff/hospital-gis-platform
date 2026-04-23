"use strict";

/**
 * Cesium viewer instance.
 */
let dashboardViewer;

/**
 * Current user ID.
 */
let dashboardUserId = null;

/**
 * Current Cesium datasource for hospitals.
 */
let dashboardHospitalDataSource = null;

/**
 * Latest hospitals by user dataset.
 */
let dashboardHospitalsData = null;

/**
 * Latest cleanliness dataset.
 */
let dashboardCleanlinessData = null;

/**
 * Track the currently selected Cesium entity.
 */
let selectedHospitalEntity = null;

/**
 * Route prefixes - change only if your API uses different route names.
 */
const crudRoute = "crudAPI";
const geoJsonRoute = "geojsonAPI";

/**
 * Base API URL.
 */
const dashboardApiBase = window.location.origin;

/**
 * Build CRUD URL.
 * @param {string} endpoint - Endpoint path.
 * @returns {string} URL.
 */
function buildDashboardCrudUrl(endpoint) {
    return dashboardApiBase + "/api/" + crudRoute + "/" + endpoint;
}

/**
 * Build GeoJSON URL.
 * @param {string} endpoint - Endpoint path.
 * @returns {string} URL.
 */
function buildDashboardGeoJsonUrl(endpoint) {
    return dashboardApiBase + "/api/" + geoJsonRoute + "/" + endpoint;
}

/**
 * Initialise dashboard on page load.
 */
document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
});

/**
 * Load dashboard.
 */
function loadDashboard() {
    initialiseCesium();
    getDashboardUserId();
}

/**
 * Initialise Cesium viewer.
 */
function initialiseCesium() {
    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3OTdjNDZjOS0wNTgwLTQzMTQtYjg5Yi0xMThjZTcyOGJhMTMiLCJpZCI6NDE5ODMzLCJpYXQiOjE3NzY0OTExODd9.Q3wgDRZZ5PkbVaxySp_2r-YRVdaFW6841nN8z-TK8k8";

    dashboardViewer = new Cesium.Viewer("cesiumContainer", {
        timeline: false,
        animation: false,
        baseLayerPicker: true,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: true
    });

    dashboardViewer.screenSpaceEventHandler.setInputAction(function (movement) {
        const pickedObject = dashboardViewer.scene.pick(movement.position);

        if (!Cesium.defined(pickedObject) || !pickedObject.id || !pickedObject.id.properties) {
            return;
        }

        const hospitalId = pickedObject.id.properties.hospital_id
            ? pickedObject.id.properties.hospital_id.getValue()
            : null;

        const hospitalName = pickedObject.id.properties.hospital_name
            ? pickedObject.id.properties.hospital_name.getValue()
            : "Selected Hospital";

        if (!hospitalId) {
            return;
        }

        highlightSelectedHospital(pickedObject.id);
        showHospitalReports(hospitalId, hospitalName);
        updateCleanlinessKeywordsForHospital(hospitalId, hospitalName);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

/**
 * Highlight the selected hospital entity.
 * @param {Object} entity - Cesium entity.
 */
function highlightSelectedHospital(entity) {
    if (selectedHospitalEntity && selectedHospitalEntity.point) {
        const previousQueueDescription = selectedHospitalEntity.properties &&
            selectedHospitalEntity.properties.queue_length_description
            ? selectedHospitalEntity.properties.queue_length_description.getValue()
            : "Unknown";

        selectedHospitalEntity.point.pixelSize = 14;
        selectedHospitalEntity.point.outlineWidth = 1;
        selectedHospitalEntity.point.color = getCesiumQueueColour(previousQueueDescription);
    }

    selectedHospitalEntity = entity;

    if (selectedHospitalEntity && selectedHospitalEntity.point) {
        selectedHospitalEntity.point.pixelSize = 18;
        selectedHospitalEntity.point.outlineWidth = 3;
        selectedHospitalEntity.point.outlineColor = Cesium.Color.WHITE;
    }
}

/**
 * Get user ID from API.
 */
function getDashboardUserId() {
    fetch(buildDashboardCrudUrl("user_id"), { cache: "no-store" })
        .then(function (response) {
            return response.text();
        })
        .then(function (rawText) {
            dashboardUserId = Number(rawText.trim());

            if (!Number.isInteger(dashboardUserId)) {
                throw new Error("Invalid user ID.");
            }

            loadDashboardHospitals();
            loadDashboardCleanliness();
        })
        .catch(function () {
            document.getElementById("dashboardSubtitle").innerText = "Unable to load user ID.";
        });
}

/**
 * Load hospitals for Cesium map.
 */
function loadDashboardHospitals() {
    fetch(buildDashboardGeoJsonUrl("hospitalsByUser/" + dashboardUserId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Failed to load hospitals.");
            }
            return response.json();
        })
        .then(function (data) {
            dashboardHospitalsData = data;
            addHospitalsToCesium(data);
        })
        .catch(function () {
            document.getElementById("dashboardSubtitle").innerText = "Unable to load hospital data.";
        });
}

/**
 * Add hospitals to Cesium.
 * @param {Object} data - GeoJSON data.
 */
function addHospitalsToCesium(data) {
    if (dashboardHospitalDataSource) {
        dashboardViewer.dataSources.remove(dashboardHospitalDataSource);
    }

    dashboardHospitalDataSource = new Cesium.GeoJsonDataSource();

    dashboardHospitalDataSource.load(data).then(function (dataSource) {
        dashboardViewer.dataSources.add(dataSource);

        const entities = dataSource.entities.values;

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const queueDescription = entity.properties && entity.properties.queue_length_description
                ? entity.properties.queue_length_description.getValue()
                : "Unknown";

            const colour = getCesiumQueueColour(queueDescription);

            entity.billboard = undefined;

            entity.point = new Cesium.PointGraphics({
                pixelSize: 14,
                color: colour,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1
            });
        }

        dashboardViewer.flyTo(dataSource);
    });
}

/**
 * Convert queue description to Cesium colour.
 * @param {string} queueDescription - Queue description.
 * @returns {Cesium.Color} Cesium colour.
 */
function getCesiumQueueColour(queueDescription) {
    if (!queueDescription) {
        return Cesium.Color.GRAY;
    }

    const value = String(queueDescription).toLowerCase();

    if (value.includes("very long") || value.includes("over 4")) {
        return Cesium.Color.RED;
    }

    if (value.includes("moderately long") || value.includes("between 2 and 4")) {
        return Cesium.Color.ORANGE;
    }

    if (value.includes("ok") || value.includes("between 30 minutes and 2 hours")) {
        return Cesium.Color.YELLOW;
    }

    if (value.includes("very short") || value.includes("less than 10 minutes")) {
        return Cesium.Color.DARKGREEN;
    }

    if (value.includes("short") || value.includes("less than 30 minutes")) {
        return Cesium.Color.GREEN;
    }

    if (value.includes("no queue")) {
        return Cesium.Color.BLUE;
    }

    return Cesium.Color.GRAY;
}

/**
 * Load cleanliness dataset for all hospitals.
 * Uses the dedicated endpoint first, then falls back to hospitalsByUser data.
 */
function loadDashboardCleanliness() {
    fetch(buildDashboardGeoJsonUrl("hospitalLatestCleanliness/" + dashboardUserId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Failed to load cleanliness data.");
            }
            return response.json();
        })
        .then(function (data) {
            dashboardCleanlinessData = normaliseCleanlinessData(data);
            updateCleanlinessKeywordsForAllHospitals();
        })
        .catch(function () {
            dashboardCleanlinessData = fallbackCleanlinessFromHospitals();
            updateCleanlinessKeywordsForAllHospitals();
        });
}

/**
 * Build fallback cleanliness data from hospitalsByUser.
 * @returns {Object} GeoJSON-like features object.
 */
function fallbackCleanlinessFromHospitals() {
    if (!dashboardHospitalsData || !dashboardHospitalsData.features) {
        return { features: [] };
    }

    return {
        features: dashboardHospitalsData.features.map(function (feature) {
            return {
                properties: {
                    hospital_id: feature.properties ? feature.properties.hospital_id : null,
                    hospital_name: feature.properties ? feature.properties.hospital_name : "",
                    cleanliness: feature.properties ? feature.properties.cleanliness : ""
                }
            };
        })
    };
}

/**
 * Normalise cleanliness response into a features-like structure.
 * @param {Object} data - API response.
 * @returns {Object} Normalised object with features array.
 */
function normaliseCleanlinessData(data) {
    if (data && Array.isArray(data.features)) {
        return data;
    }

    if (data && Array.isArray(data.array_to_json)) {
        return {
            features: data.array_to_json.map(function (item) {
                return {
                    properties: item
                };
            })
        };
    }

    if (Array.isArray(data)) {
        return {
            features: data.map(function (item) {
                return {
                    properties: item
                };
            })
        };
    }

    return { features: [] };
}

/**
 * Show reports for the selected hospital.
 * @param {number|string} hospitalId - Hospital ID.
 * @param {string} hospitalName - Hospital name.
 */
function showHospitalReports(hospitalId, hospitalName) {
    fetch(buildDashboardGeoJsonUrl("allReportsForHospital/" + hospitalId))
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Failed to load reports.");
            }
            return response.json();
        })
        .then(function (data) {
            document.getElementById("dashboardSubtitle").innerText = "Selected hospital: " + hospitalName;
            document.getElementById("selectedHospitalName").innerText = "Showing reports for: " + hospitalName;

            const tableBody = document.getElementById("reportsTableBody");
            tableBody.innerHTML = "";

            const rows = normaliseReportsData(data);

            if (rows.length === 0) {
                tableBody.innerHTML = "<tr><td colspan='3' class='empty-message'>No reports found for this hospital.</td></tr>";
                return;
            }

            rows.forEach(function (props) {
                const row = document.createElement("tr");

                row.innerHTML =
                    "<td>" + (props.queue_length_description || "Unknown") + "</td>" +
                    "<td>" + (props.cleanliness || "") + "</td>" +
                    "<td>" + (props.user_id || "") + "</td>";

                tableBody.appendChild(row);
            });
        })
        .catch(function () {
            document.getElementById("reportsTableBody").innerHTML =
                "<tr><td colspan='3' class='empty-message'>Unable to load reports.</td></tr>";
        });
}

/**
 * Normalise reports response into an array of property objects.
 * @param {Object} data - API response.
 * @returns {Array} Array of report property objects.
 */
function normaliseReportsData(data) {
    if (data && Array.isArray(data.features)) {
        return data.features.map(function (feature) {
            return feature.properties || {};
        });
    }

    if (data && Array.isArray(data.array_to_json)) {
        return data.array_to_json;
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [];
}

/**
 * Update cleanliness keywords for all hospitals.
 */
function updateCleanlinessKeywordsForAllHospitals() {
    document.getElementById("cleanlinessScopeLabel").innerText =
        "Showing keywords for all your hospitals.";

    if (!dashboardCleanlinessData) {
        renderKeywordBubbles({});
        return;
    }

    const keywordCounts = extractKeywordCountsFromFeatures(dashboardCleanlinessData.features || []);
    renderKeywordBubbles(keywordCounts);
}

/**
 * Update cleanliness keywords for a selected hospital.
 * @param {number|string} hospitalId - Hospital ID.
 * @param {string} hospitalName - Hospital name.
 */
function updateCleanlinessKeywordsForHospital(hospitalId, hospitalName) {
    document.getElementById("cleanlinessScopeLabel").innerText =
        "Showing keywords for: " + hospitalName;

    if (!dashboardCleanlinessData || !dashboardCleanlinessData.features) {
        renderKeywordBubbles({});
        return;
    }

    const filteredFeatures = dashboardCleanlinessData.features.filter(function (feature) {
        const props = feature.properties || {};
        return String(props.hospital_id) === String(hospitalId);
    });

    const keywordCounts = extractKeywordCountsFromFeatures(filteredFeatures);
    renderKeywordBubbles(keywordCounts);
}

/**
 * Extract keyword frequencies from cleanliness text.
 * @param {Array} features - GeoJSON features.
 * @returns {Object} Keyword counts.
 */
function extractKeywordCountsFromFeatures(features) {
    const stopWords = [
        "the", "and", "for", "with", "this", "that", "have", "from", "were", "was", "very",
        "into", "there", "their", "about", "would", "could", "should", "hospital", "clean",
        "cleanliness", "queue", "area", "room", "place", "is", "are", "a", "an", "of", "to",
        "in", "on", "it", "at", "as", "be", "by", "or", "but", "not"
    ];

    const counts = {};

    features.forEach(function (feature) {
        const props = feature.properties || {};
        const text = (props.cleanliness || "").toLowerCase();

        text.replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .forEach(function (word) {
                if (!word || word.length < 3 || stopWords.includes(word)) {
                    return;
                }

                if (!counts[word]) {
                    counts[word] = 0;
                }

                counts[word] += 1;
            });
    });

    return counts;
}

/**
 * Render keyword bubbles.
 * @param {Object} keywordCounts - Keyword counts object.
 */
function renderKeywordBubbles(keywordCounts) {
    const wrap = document.getElementById("keywordBubbleWrap");
    wrap.innerHTML = "";

    const entries = Object.entries(keywordCounts)
        .sort(function (a, b) {
            return b[1] - a[1];
        })
        .slice(0, 20);

    if (entries.length === 0) {
        wrap.innerHTML = "<div class='empty-message'>No cleanliness keywords available.</div>";
        return;
    }

    entries.forEach(function (entry) {
        const word = entry[0];
        const count = entry[1];

        const bubble = document.createElement("div");
        bubble.className = "bubble-item";
        bubble.style.fontSize = Math.min(24, 12 + count * 2) + "px";
        bubble.style.minHeight = Math.min(72, 40 + count * 4) + "px";
        bubble.style.background = getBubbleBackground(count);
        bubble.style.color = "#1f2937";
        bubble.innerText = word + " (" + count + ")";

        wrap.appendChild(bubble);
    });
}

/**
 * Get bubble background colour based on frequency.
 * @param {number} count - Keyword count.
 * @returns {string} CSS colour.
 */
function getBubbleBackground(count) {
    if (count >= 5) {
        return "#93c5fd";
    }

    if (count >= 3) {
        return "#bfdbfe";
    }

    return "#dbeafe";
}