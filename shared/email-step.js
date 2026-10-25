/* =========================================================
   SIKNAYAN - ADD YOUR EMAIL (shared/email-step.js)

   The step after setting a new password on the learner, instructor
   and academic admin setup pages. The person must add their email
   (used for "Forgot Password?" codes and announcements) before they
   can use the LMS; the server refuses everything else until then.

   SiknayanEmailStep.start({
       form,          the password form (hidden during this step)
       description,   text under the title (changed for this step)
       buttonClass,   the page's main button class, for the same look
       showMessage,   the page's message function (text, type)
       onDone         what to do after the email is saved
   })
   A page opened with ?step=email starts here directly (sign-in sends
   people here when the password is set but the email is missing).
========================================================= */

(function () {
    "use strict";

    const STYLE = `
        .email-step { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
        .email-step-badge { align-self: flex-start; padding: 4px 12px; border-radius: 999px;
            background: #e2ac2f; color: #3d0a0d; font-size: 12px; font-weight: 700; letter-spacing: .3px; }
        .email-step h3 { margin: 0; color: #0b5d35; font-size: 18px; }
        .email-step p { margin: 0; color: #5b6760; font-size: 13.5px; line-height: 1.55; }
        .email-step label { display: block; margin-bottom: 6px; color: #344054; font-size: 14px; font-weight: 600; text-align: left; }
        .email-step-input { position: relative; }
        .email-step-input i { position: absolute; top: 50%; left: 14px; color: #8a958f; transform: translateY(-50%); }
        .email-step input { box-sizing: border-box; width: 100%; padding: 12px 14px 12px 40px; border: 1px solid #cfd8d3;
            border-radius: 9px; background: #fff; font: inherit; font-size: 15px; }
        .email-step input:focus { outline: 3px solid rgba(8, 116, 67, .18); border-color: #087443; }
        .email-step-error { margin: 0; color: #b42318 !important; font-size: 13px; }
        .email-step-error:empty { display: none; }
        .email-step button { width: 100%; }
    `;

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    function token() {
        return sessionStorage.getItem("authToken") || localStorage.getItem("siknayan_api_token") || "";
    }

    function start(options) {
        const { form, description, buttonClass = "", showMessage = () => {}, onDone = () => {} } = options;
        if (!form || document.getElementById("emailStepForm")) return;

        if (!document.getElementById("emailStepStyle")) {
            const style = document.createElement("style");
            style.id = "emailStepStyle";
            style.textContent = STYLE;
            document.head.appendChild(style);
        }

        form.hidden = true;
        form.style.display = "none";

        if (description) {
            description.textContent = "Your password is set. One more step: add your email address.";
        }

        let user = {};
        try { user = JSON.parse(sessionStorage.getItem("user") || "{}") || {}; } catch (error) { user = {}; }

        const step = document.createElement("form");
        step.id = "emailStepForm";
        step.className = "email-step";
        step.noValidate = true;
        step.innerHTML = `
            <span class="email-step-badge">STEP 2 OF 2</span>
            <h3>Add your email address</h3>
            <p>It is used to send you a code if you forget your password, and to tell you about new announcements.
               You need to add it before you can use your account.</p>
            <div>
                <label for="emailStepInput">Email Address</label>
                <div class="email-step-input">
                    <i class="fa-solid fa-envelope" aria-hidden="true"></i>
                    <input id="emailStepInput" type="email" maxlength="255" autocomplete="email" required
                        placeholder="name@example.com" value="${escapeHtml(user.email || "")}">
                </div>
            </div>
            <p class="email-step-error" id="emailStepError" role="alert"></p>
            <button type="submit" class="${escapeHtml(buttonClass)}" id="emailStepButton">Save Email and Continue</button>`;
        form.insertAdjacentElement("afterend", step);

        const input = step.querySelector("#emailStepInput");
        const error = step.querySelector("#emailStepError");
        const button = step.querySelector("#emailStepButton");
        setTimeout(() => input.focus(), 50);

        step.addEventListener("submit", async event => {
            event.preventDefault();
            error.textContent = "";
            const email = input.value.trim();

            if (!email) {
                error.textContent = "Please enter your email address.";
                input.focus();
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                error.textContent = "Please enter a valid email address.";
                input.focus();
                return;
            }

            button.disabled = true;
            button.textContent = "Saving...";

            try {
                let response;
                try {
                    response = await fetch(`${window.SIKNAYAN_API_ROOT}/account/email`, {
                        method: "POST",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token()}`
                        },
                        body: JSON.stringify({ email })
                    });
                } catch (networkError) {
                    throw new Error("Cannot reach the server. Please check your connection and try again.");
                }

                const data = await response.json().catch(() => ({}));

                if (response.status === 401) {
                    throw new Error("Your session has ended. Please log in again.");
                }
                if (!response.ok || data.success === false) {
                    const first = data.errors && Object.values(data.errors).flat()[0];
                    throw new Error(first || data.message || "Your email could not be saved.");
                }

                try {
                    sessionStorage.setItem("user", JSON.stringify({ ...user, email: data.user?.email || email }));
                } catch (storageError) { /* ignore */ }

                button.textContent = "Email Saved";
                showMessage("Your email address has been saved.", "success");
                onDone(data);
            } catch (saveError) {
                error.textContent = saveError.message;
                button.disabled = false;
                button.textContent = "Save Email and Continue";
            }
        });
    }

    function requested() {
        return new URLSearchParams(window.location.search).get("step") === "email";
    }

    window.SiknayanEmailStep = { start, requested };
})();
