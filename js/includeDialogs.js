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

"use strict";

/**
 * Loads external HTML content into elements that have
 * the attribute: data-w3-include-html="file.html"
 *
 * Used to load forms (e.g. hospital form, queue form)
 * as required by the assignment.
 */
function includeHTML() {
    const elements = document.querySelectorAll("[data-w3-include-html]");

    elements.forEach(function (element) {
        const file = element.getAttribute("data-w3-include-html");

        if (!file) return;

        fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error("File not found: " + file);
                }
                return response.text();
            })
            .then(data => {
                element.innerHTML = data;
                element.removeAttribute("data-w3-include-html");

                console.log("Loaded HTML:", file);
            })
            .catch(error => {
                console.error(error);
                element.innerHTML = "Error loading content.";
            });
    });
}