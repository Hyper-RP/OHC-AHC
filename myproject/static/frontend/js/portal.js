document.addEventListener("DOMContentLoaded", () => {
    const updateVitalsPayload = (form) => {
        const vitals = {};
        form.querySelectorAll(".vitals-input").forEach((input) => {
            const key = input.dataset.vitalKey;
            const value = input.value.trim();
            if (key && value) {
                vitals[key] = value;
            }
        });

        const hiddenField = form.querySelector(".vitals-json-field");
        const preview = form.querySelector(".vitals-preview");
        const payload = JSON.stringify(vitals, null, 2);

        if (hiddenField) {
            hiddenField.value = JSON.stringify(vitals);
        }
        if (preview) {
            preview.textContent = payload;
        }
    };

    document.querySelectorAll(".portal-form").forEach((form) => {
        const vitalsInputs = form.querySelectorAll(".vitals-input");
        if (vitalsInputs.length) {
            vitalsInputs.forEach((input) => {
                input.addEventListener("input", () => updateVitalsPayload(form));
            });
            updateVitalsPayload(form);
        }
    });

    document.querySelectorAll(".portal-form button.btn-brand").forEach((button) => {
        button.addEventListener("click", () => {
            const form = button.closest(".portal-form");
            if (form) {
                updateVitalsPayload(form);
            }
            const endpoint = form?.dataset.apiEndpoint || "API endpoint";
            button.dataset.originalLabel = button.dataset.originalLabel || button.textContent;
            button.textContent = `Ready for ${endpoint}`;
            setTimeout(() => {
                button.textContent = button.dataset.originalLabel;
            }, 1800);
        });
    });
});
