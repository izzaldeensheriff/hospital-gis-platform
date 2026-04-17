"use strict";
console.log("utilities.js loaded");

/**
 * Global user ID
 */
let userId = null;

/**
 * Queue length options loaded from database
 */
let queueLengthOptions = [];

/**
 * Stores hospital properties temporarily for popup report buttons
 */
let popupHospitalLookup = {};

let hospitalQueueChart = null;

/**
 * Base URL for API requests
 */
const apiBase = window.location.origin;

/**
 * Run when page loads
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log("listener domcontentloaded");
    console.log("API base:", apiBase);

    if (typeof loadMap === "function" && !window._mapAlreadyLoaded) {
        loadMap();
        window._mapAlreadyLoaded = true;
    }

    getUserIdFromAPI();
}, false);

/**
 * Get user ID from API
 */
function getUserIdFromAPI() {
    fetch(apiBase + '/api/crudAPI/user_id', { cache: 'no-store' })
        .then(function (response) {
            return response.text().then(function (rawText) {
                console.log("user_id URL:", apiBase + '/api/crudAPI/user_id');
                console.log("user_id status:", response.status);
                console.log("Raw user_id response:", rawText);

                if (!response.ok) {
                    throw new Error("HTTP " + response.status + ": " + rawText);
                }

                const parsedUserId = Number(rawText.trim());

                if (!Number.isInteger(parsedUserId)) {
                    throw new Error("user_id is not a valid integer. Raw response was: " + rawText);
                }

                userId = parsedUserId;

                const userDisplay = document.getElementById("userIdDisplay");
                if (userDisplay) {
                    userDisplay.innerText = "User ID: " + userId;
                }

                getQueueLengths();
                loadDefaultHospitalLayer();
            });
        })
        .catch(function (error) {
            console.error("Error fetching user ID:", error);
            const userDisplay = document.getElementById("userIdDisplay");
            if (userDisplay) {
                userDisplay.innerText = "User ID load failed";
            }
        });
}

function getQueueLengths() {
    fetch(apiBase + '/api/geojsonAPI/getQueueLengths')
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
        .catch(function (error) {
            console.error("Error loading queue lengths:", error);
        });
}

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
            '</label>';

        container.appendChild(wrapper);
    });
}

function openQueueCleanlinessForm(properties) {
    const hospitalIdInput = document.getElementById("report_hospital_id");
    const hospitalNameInput = document.getElementById("report_hospital_name");
    const reportUserInput = document.getElementById("report_user_id");
    const hospitalNameDisplay = document.getElementById("report_hospital_name_display");

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

    const textarea = document.getElementById("cleanliness");
    if (textarea) {
        textarea.value = "";
    }

    const radios = document.querySelectorAll('input[name="queue_length_description"]');
    radios.forEach(function (radio) {
        radio.checked = false;
    });

    showDialog("queueCleanlinessFormDialog");
}

function openQueueCleanlinessFormById(hospitalId) {
    const props = popupHospitalLookup[hospitalId];
    if (props) {
        openQueueCleanlinessForm(props);
    } else {
        console.log("No hospital properties found for hospital ID:", hospitalId);
    }
}

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

    fetch(apiBase + '/api/crudAPI/insertHospital', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            console.log("Hospital saved:", data);

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);

            const marker = L.marker([lat, lng]).bindPopup(
                "<b>" + hospitalName + "</b><br>Last Inspected: " + inspectionDate + "<br>Latest Queue: Unknown"
            );

            defaultHospitalLayer.addLayer(marker);

            if (!mymap.hasLayer(defaultHospitalLayer)) {
                defaultHospitalLayer.addTo(mymap);
            }

            mymap.setView([lat, lng], 16);

            const dialog = document.getElementById("hospitalFormDialog");
            if (dialog) {
                dialog.close();
            }

            const form = document.getElementById("hospitalForm");
            if (form) {
                form.reset();
            }

            selectedHospitalLatLng = null;
            disableHospitalCreation();

            alert("Hospital saved successfully.");

            setTimeout(function () {
                getUserHospitals();
            }, 1500);
        })
        .catch(function (error) {
            console.error("Error saving hospital:", error);
            alert("Error saving hospital.");
        });
}


function closeHospitalChart() {
    const chartContainer = document.getElementById("hospitalQueueChartContainer");

    if (chartContainer) {
        chartContainer.style.display = "none";
    }

    if (hospitalQueueChart) {
        hospitalQueueChart.destroy();
        hospitalQueueChart = null;
    }

    console.log("Bar chart closed");
}


function saveQueueCleanlinessReport(formValues) {
    const hospitalName = formValues.report_hospital_name ? formValues.report_hospital_name.trim() : "";
    const cleanliness = formValues.cleanliness ? formValues.cleanliness.trim() : "";
    const queueLengthDescription = formValues.queue_length_description;
    const reportUserId = formValues.report_user_id ? formValues.report_user_id : userId;

    if (!hospitalName || !queueLengthDescription) {
        alert("Please select a queue length and make sure the hospital is valid.");
        return;
    }
if (!confirm("Are you sure you want to submit this report?")) {
    return;
}
    const payload = {
        hospital_name: hospitalName,
        cleanliness: cleanliness,
        queue_length_description: queueLengthDescription,
        user_id: reportUserId
    };

    fetch(apiBase + '/api/crudAPI/insertCleanlinessQueueReport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            const dialog = document.getElementById("queueCleanlinessFormDialog");
            if (dialog) {
                dialog.close();
            }

            const form = document.getElementById("queueCleanlinessForm");
            if (form) {
                form.reset();
            }

            alert("Cleanliness/queue report saved successfully.");
            console.log(data);

            getUserHospitals();
            getNumCleanlinessQueueReports();
        })
        .catch(function (error) {
            console.error("Error saving cleanliness/queue report:", error);
            alert("Error saving cleanliness/queue report.");
        });
}


function removeClosestHospitals() {
    reportingLayer.clearLayers();

    // restore default layer (VERY IMPORTANT for marking)
    if (typeof loadDefaultHospitalLayer === "function") {
        loadDefaultHospitalLayer();
    }

    console.log("Closest hospitals layer removed");
}

function removeUnknownQueueHospitals() {
    reportingLayer.clearLayers();

    if (typeof loadDefaultHospitalLayer === "function") {
        loadDefaultHospitalLayer();
    }

    console.log("Unknown queue hospitals layer removed");
}

function getUserHospitals() {
    if (!userId) {
        console.log("User ID not ready yet.");
        return;
    }

    fetch(apiBase + '/api/geojsonAPI/hospitalsByUser/' + userId)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            popupHospitalLookup = {};

            if (!data || !data.features || data.features.length === 0) {
                console.log("No hospitals found for this user.");
                return;
            }

            defaultHospitalLayer.clearLayers();

            const geojsonLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    const hospitalId = props.hospital_id || "";

                    popupHospitalLookup[hospitalId] = props;

                    let popupContent = "<div id='popup-" + hospitalId + "'>";
                    popupContent += "<b>" + (props.hospital_name || "Hospital") + "</b><br>";
                    popupContent += "Hospital ID: " + hospitalId + "<br>";
                    popupContent += "Last Inspected: " + (props.last_inspected || "") + "<br>";
                    popupContent += "Latest Queue: " + (props.queue_length_description || "Unknown") + "<br>";
                    popupContent += "Latest Cleanliness: " + (props.cleanliness || "") + "<br><br>";
                    popupContent += "<button type='button' class='btn btn-sm btn-primary' onclick='openQueueCleanlinessFormById(" + hospitalId + ")'>Add Report</button>";
                    popupContent += "</div>";

                    layer.bindPopup(popupContent);
                }
            });

            defaultHospitalLayer.addLayer(geojsonLayer);

            if (!mymap.hasLayer(defaultHospitalLayer)) {
                defaultHospitalLayer.addTo(mymap);
            }

            try {
                mymap.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
            } catch (e) {
                console.log("Could not fit bounds:", e);
            }
        })
        .catch(function (error) {
            console.error("Error loading user hospitals:", error);
        });
}

function getNumCleanlinessQueueReports() {
    if (!userId) {
        return;
    }

    fetch(apiBase + '/api/geojsonAPI/numCleanlinessQueueReports/' + userId)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            console.log("Report count response:", data);

            if (data && data.array_to_json && data.array_to_json.length > 0) {
                alert("You have submitted " + data.array_to_json[0].num_reports + " reports.");
            }
        })
        .catch(function (error) {
            console.error("Error getting report count:", error);
        });
}

function getUserRanking() {
    if (!userId) {
        return;
    }

    fetch(apiBase + '/api/geojsonAPI/userCleanlinessQueueRanking/' + userId)
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            console.log("Ranking response:", data);

            if (data && data.array_to_json && data.array_to_json.length > 0) {
                alert("Your current ranking is: " + data.array_to_json[0].rank);
            } else if (data && data.features && data.features.length > 0 && data.features[0].properties) {
                alert("Your current ranking is: " + data.features[0].properties.rank);
            } else {
                alert("No ranking information available yet.");
            }
        })
        .catch(function (error) {
            console.error("Error getting ranking:", error);
            alert("Error getting user ranking.");
        });
}

function getClosestHospitals() {
    if (!currentUserLatLng) {
        alert("User location is not available yet.");
        return;
    }

    const latitude = currentUserLatLng[0];
    const longitude = currentUserLatLng[1];

    defaultHospitalLayer.clearLayers();
    reportingLayer.clearLayers();

    fetch(apiBase + '/api/geojsonAPI/fiveClosestHospitals/' + latitude + '/' + longitude)
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

            const geojsonLayer = L.geoJSON(data, {
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    let popupContent = "<b>" + (props.hospital_name || "Hospital") + "</b><br>";
                    popupContent += "Hospital ID: " + (props.hospital_id || "") + "<br>";
                    popupContent += "Last Inspected: " + (props.last_inspected || "");
                    layer.bindPopup(popupContent);
                }
            });

            reportingLayer.addLayer(geojsonLayer);

            if (!mymap.hasLayer(reportingLayer)) {
                reportingLayer.addTo(mymap);
            }

            try {
                mymap.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
            } catch (e) {
                console.log("Could not fit bounds:", e);
            }
        })
        .catch(function (error) {
            console.error("Error loading closest hospitals:", error);
            alert("Error loading closest hospitals.");
        });
}

function getUnknownQueueHospitals() {
    if (!userId) {
        return;
    }

    defaultHospitalLayer.clearLayers();
    reportingLayer.clearLayers();

    fetch(apiBase + '/api/geojsonAPI/hospitalsQueueLengthUnknown/' + userId)
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

            const geojsonLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng);
                },
                onEachFeature: function (feature, layer) {
                    const props = feature.properties || {};
                    let popupContent = "<b>" + (props.hospital_name || "Hospital") + "</b><br>";
                    popupContent += "Latest Queue: " + (props.queue_length_description || "Unknown") + "<br>";
                    popupContent += "Latest Cleanliness: " + (props.cleanliness || "");
                    layer.bindPopup(popupContent);
                }
            });

            reportingLayer.addLayer(geojsonLayer);

            if (!mymap.hasLayer(reportingLayer)) {
                reportingLayer.addTo(mymap);
            }

            try {
                mymap.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
            } catch (e) {
                console.log("Could not fit bounds:", e);
            }
        })
        .catch(function (error) {
            console.error("Error loading unknown queue hospitals:", error);
            alert("Error loading unknown queue hospitals.");
        });
}

function getHospitalQueueBarChartData() {
    fetch(apiBase + '/api/geojsonAPI/hospitalsByQueueLength')
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Server error: " + response.status);
            }
            return response.json();
        })
        .then(function (data) {
            console.log("Hospital bar chart data:", data);

            let labels = [];
            let values = [];

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

            console.log("Chart labels:", labels);
            console.log("Chart values:", values);

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
			console.log("Bar chart rendered successfully");

            const chartContainer = document.getElementById("hospitalQueueChartContainer");
            if (chartContainer) {
                chartContainer.style.display = "block";
                chartContainer.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        })
        .catch(function (error) {
            console.error("Error loading hospital queue bar chart data:", error);
            alert("Error loading hospital queue bar chart data.");
        });
	
}