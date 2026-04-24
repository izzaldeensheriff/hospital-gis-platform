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
 * Dashboard Logic (Cesium 3D View)
 * Handles hospital visualisation, report interaction,
 * and cleanliness keyword analysis in the dashboard.
 */

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
 * Base API URL.
 */
const dashboardApiBase = window.location.origin;

/**
 * Build a CRUD API URL.
 * @param {string} endpoint - Endpoint path.
 * @returns {string} Full URL.
 */
function buildDashboardCrudUrl(endpoint) {
    return dashboardApiBase + "/api/crudAPI/" + endpoint;
}

/**
 * Build candidate GeoJSON URLs.
 * Tries both geojsonAPI and geoJSONAPI to survive route naming inconsistencies.
 * @param {string} endpoint - Endpoint path.
 * @returns {string[]} Candidate URLs.
 */
function buildDashboardGeoJsonUrls(endpoint) {
    return [
        dashboardApiBase + "/api/geojsonAPI/" + endpoint,
        dashboardApiBase + "/api/geoJSONAPI/" + endpoint
    ];
}

/**
 * Try multiple URLs until one returns JSON successfully.
 * @param {string[]} urls - Candidate URLs.
 * @returns {Promise<any>} Parsed JSON.
 */
function fetchFirstWorkingJson(urls) {
    let index = 0;

    function tryNext() {
        if (index >= urls.length) {
            return Promise.reject(new Error("All candidate URLs failed."));
        }

        const url = urls[index];
        index += 1;

        return fetch(url).then(function (response) {
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            return response.json();
        }).catch(function () {
            return tryNext();
        });
    }

    return tryNext();
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
/**
 * Handles hospital selection on the Cesium map.
 * Updates the reports table and cleanliness keyword panel
 * based on the selected hospital.
 */
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
        showHospitalReports(hospitalId, hospitalName, pickedObject.id.properties);
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
    fetchFirstWorkingJson(buildDashboardGeoJsonUrls("hospitalsByUser/" + dashboardUserId))
        .then(function (data) {
            dashboardHospitalsData = normaliseFeaturesData(data);
            addHospitalsToCesium(dashboardHospitalsData);
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
 */
function loadDashboardCleanliness() {
    fetchFirstWorkingJson(buildDashboardGeoJsonUrls("hospitalLatestCleanliness/" + dashboardUserId))
        .then(function (data) {
            dashboardCleanlinessData = normaliseFeaturesData(data);

            if (!dashboardCleanlinessData.features.length) {
                dashboardCleanlinessData = fallbackCleanlinessFromHospitals();
            }

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
        return { type: "FeatureCollection", features: [] };
    }

    return {
        type: "FeatureCollection",
        features: dashboardHospitalsData.features.map(function (feature) {
            return {
                type: "Feature",
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
 * Show reports for the selected hospital.
 * Falls back to latest report values from hospitalsByUser if the dedicated endpoint fails.
 * @param {number|string} hospitalId - Hospital ID.
 * @param {string} hospitalName - Hospital name.
 * @param {Object} clickedProperties - Cesium properties object.
 */
function showHospitalReports(hospitalId, hospitalName, clickedProperties) {
    fetchFirstWorkingJson(buildDashboardGeoJsonUrls("allReportsForHospital/" + hospitalId))
        .then(function (data) {
            renderReportsTable(normaliseReportsData(data), hospitalName);
        })
        .catch(function () {
            const fallbackRow = buildFallbackReportRow(hospitalId, hospitalName, clickedProperties);
            renderReportsTable(fallbackRow ? [fallbackRow] : [], hospitalName);
        });
}

/**
 * Build a fallback report row from clicked hospital properties or hospitalsByUser data.
 * @param {number|string} hospitalId - Hospital ID.
 * @param {string} hospitalName - Hospital name.
 * @param {Object} clickedProperties - Cesium properties object.
 * @returns {Object|null} Report row object.
 */
function buildFallbackReportRow(hospitalId, hospitalName, clickedProperties) {
    if (clickedProperties) {
        return {
            queue_length_description: clickedProperties.queue_length_description
                ? clickedProperties.queue_length_description.getValue()
                : "Unknown",
            cleanliness: clickedProperties.cleanliness
                ? clickedProperties.cleanliness.getValue()
                : "",
            user_id: dashboardUserId
        };
    }

    if (dashboardHospitalsData && dashboardHospitalsData.features) {
        const matchedFeature = dashboardHospitalsData.features.find(function (feature) {
            return String(feature.properties ? feature.properties.hospital_id : "") === String(hospitalId);
        });

        if (matchedFeature && matchedFeature.properties) {
            return {
                queue_length_description: matchedFeature.properties.queue_length_description || "Unknown",
                cleanliness: matchedFeature.properties.cleanliness || "",
                user_id: dashboardUserId
            };
        }
    }

    return null;
}

/**
 * Render reports table.
 * @param {Array} rows - Array of report property objects.
 * @param {string} hospitalName - Hospital name.
 */
function renderReportsTable(rows, hospitalName) {
    document.getElementById("dashboardSubtitle").innerText = "Selected hospital: " + hospitalName;
    document.getElementById("selectedHospitalName").innerText = "Showing reports for: " + hospitalName;

    const tableBody = document.getElementById("reportsTableBody");
    tableBody.innerHTML = "";

    if (!rows || rows.length === 0) {
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
 * Normalise API response into a FeatureCollection-like object.
 * @param {Object|Array} data - API response.
 * @returns {Object} Normalised FeatureCollection.
 */
function normaliseFeaturesData(data) {
    if (data && Array.isArray(data.features)) {
        return data;
    }

    if (data && Array.isArray(data.array_to_json)) {
        return {
            type: "FeatureCollection",
            features: data.array_to_json.map(function (item) {
                return {
                    type: "Feature",
                    properties: item
                };
            })
        };
    }

    if (Array.isArray(data)) {
        return {
            type: "FeatureCollection",
            features: data.map(function (item) {
                return {
                    type: "Feature",
                    properties: item
                };
            })
        };
    }

    return {
        type: "FeatureCollection",
        features: []
    };
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
 * Extracts keyword frequencies from cleanliness text.
 * Removes common stop words and counts occurrences
 * to generate keyword bubbles for visual analysis.
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