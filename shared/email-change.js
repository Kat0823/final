/* =========================================================
   SIKNAYAN - CHANGE EMAIL (shared by every portal's profile)
   ---------------------------------------------------------
   SiknayanEmailChange.mount(container, { onChanged(email) })

   Adds an "Email Address" row to a profile's Account & Security
   section. Changing the email is a verified process:
     1. new email + current password  -> POST /account/email-change
     2. a 6-digit code goes to the NEW address; the current email
        stays active ("Email verification pending")
     3. the code                      -> POST /account/email-change/verify
   The person can also resend the code (once a minute) or cancel.
   Adds its own styles. Text is always set with textContent.
========================================================= */

(function () {
    "use strict";

    if (window.SiknayanEmailChange) return;

    const STYLE = `
        .sk-ec { margin: 0 0 12px; padding: 0 0 12px; border-bottom: 1px solid #eef1ee; font-family: inherit; }
        .sk-ec-row { display: flex; align-items: center; gap: 12px; }
        .sk-ec-icon { width: 40px; height: 40px; display: grid; place-items: center; flex-shrink: 0; border-radius: 10px; background: #e6f3eb; color: #0b6b3e; }
        .sk-ec-icon svg { width: 20px; height: 20px; }
        .sk-ec-info { flex: 1; min-width: 0; }
        .sk-ec-info h4 { margin: 0; color: #1f2a24; font-size: 14px; }
        .sk-ec-current { margin: 3px 0 0; color: #4b5563; font-size: 13px; overflow-wrap: anywhere; }
        .sk-ec-badge { display: inline-block; margin-left: 6px; padding: 1px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; vertical-align: 1px; }
        .sk-ec-badge.ok { background: #e3f3ea; color: #0b6b3e; }
        .sk-ec-badge.wait { background: #fff4d6; color: #7a5600; }
        .sk-ec-toggle { flex-shrink: 0; padding: 7px 14px; border: 1px solid #0b6b3e; border-radius: 7px; background: #fff; color: #0b6b3e; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .sk-ec-toggle:hover, .sk-ec-toggle:focus-visible { background: #effaf3; outline: none; }
        .sk-ec-panel { margin-top: 12px; padding: 14px; border: 1px solid #dfe7e2; border-radius: 10px; background: #fafdfb; }
        .sk-ec-panel[hidden], .sk-ec [hidden] { display: none !important; }
        .sk-ec-help { margin: 0 0 12px; color: #4b5563; font-size: 13px; line-height: 1.5; }
        .sk-ec-field { margin-bottom: 10px; }
        .sk-ec-field label { display: block; margin-bottom: 5px; color: #1f2a24; font-size: 13px; font-weight: 700; }
        .sk-ec-input { position: relative; }
        .sk-ec-input input { width: 100%; height: 40px; box-sizing: border-box; padding: 0 12px; border: 1px solid #cfd8d2; border-radius: 7px; background: #fff; color: #1f2a24; font: inherit; font-size: 14px; }
        .sk-ec-input input:focus { outline: none; border-color: #0b6b3e; box-shadow: 0 0 0 3px rgba(11, 107, 62, 0.12); }
        .sk-ec-input.has-eye input { padding-right: 42px; }
        .sk-ec-eye { position: absolute; top: 50%; right: 5px; width: 32px; height: 32px; transform: translateY(-50%); border: 0; background: transparent; color: #66736c; cursor: pointer; }
        .sk-ec-eye svg { width: 18px; height: 18px; }
        .sk-ec-code { letter-spacing: 6px; font-family: "Courier New", monospace; font-size: 18px !important; text-align: center; }
        .sk-ec-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; margin-top: 12px; }
        .sk-ec-btn { padding: 8px 14px; border: 1px solid #cfd8d2; border-radius: 7px; background: #fff; color: #1f2a24; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .sk-ec-btn:hover { background: #f5f7f6; }
        .sk-ec-btn.primary { border-color: #0b6b3e; background: #0b6b3e; color: #fff; }
        .sk-ec-btn.primary:hover { background: #08572f; }
        .sk-ec-btn.danger { border-color: #e7c3c3; color: #9b1c22; }
        .sk-ec-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sk-ec-pending-box { margin-bottom: 12px; padding: 10px 12px; border-left: 4px solid #e2ac2f; border-radius: 0 8px 8px 0; background: #fff8e6; color: #5c4300; font-size: 13px; line-height: 1.5; }
        .sk-ec-pending-box strong { display: block; margin-bottom: 2px; color: #5c4300; font-size: 14px; }
        .sk-ec-msg { margin: 10px 0 0; padding: 9px 12px; border-radius: 7px; font-size: 13px; line-height: 1.45; }
        .sk-ec-msg.error { background: #fdecec; color: #9b1c22; }
        .sk-ec-msg.success { background: #e7f6ed; color: #0b5a34; }
        .sk-ec-msg.info { background: #eef4fb; color: #1e4d7a; }
    `;

    const ICON = {
        mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
        eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></svg>'
    };

    let styled = false;
    let uid = 0;

    function addStyles() {
        if (styled) return;
        styled = true;
        const style = document.createElement("style");
        style.id = "skEmailChangeStyles";
        style.textContent = STYLE;
        document.head.appendChild(style);
    }

    function token() {
        return sessionStorage.getItem("authToken") ||
            localStorage.getItem("siknayan_api_token") ||
            sessionStorage.getItem("token") || "";
    }

    async function api(path, method = "GET", body) {
        let response;
        try {
            response = await fetch(`${window.SIKNAYAN_API_ROOT}${path}`, {
                method,
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token()}`,
                    ...(body ? { "Content-Type": "application/json" } : {})
                },
                body: body ? JSON.stringify(body) : undefined
            });
        } catch (error) {
            throw new Error("Unable to reach the server. Please check your connection and try again.");
        }

        let data = {};
        try { data = await response.json(); } catch (error) { data = {}; }

        if (!response.ok || data.success === false) {
            const fieldMessage = data.errors && Object.values(data.errors)[0];
            const error = new Error(
                (Array.isArray(fieldMessage) && fieldMessage[0]) ||
                data.message ||
                (response.status === 401 ? "Your session has ended. Please log in again." : "Something went wrong. Please try again.")
            );
            error.data = data;
            throw error;
        }

        return data;
    }

    function mount(container, options = {}) {
        if (!container || container.querySelector(".sk-ec")) return;
        addStyles();

        const id = `skEc${++uid}`;
        const root = document.createElement("div");
        root.className = "sk-ec";
        root.innerHTML = `
            <div class="sk-ec-row">
                <div class="sk-ec-icon">${ICON.mail}</div>
                <div class="sk-ec-info">
                    <h4>Email Address</h4>
                    <p class="sk-ec-current"><span data-ec="current">—</span><span class="sk-ec-badge" data-ec="badge" hidden></span></p>
                </div>
                <button type="button" class="sk-ec-toggle" data-ec="toggle" aria-expanded="false" aria-controls="${id}Panel">Change Email</button>
            </div>

            <div class="sk-ec-panel" id="${id}Panel" data-ec="panel" hidden>

                <form data-ec="requestForm" novalidate>
                    <p class="sk-ec-help">
                        For your security, a new email address must be verified. Enter it with your current password and
                        we will send a 6-digit code to the new address. Your email changes only after you enter that code.
                    </p>
                    <div class="sk-ec-field">
                        <label for="${id}New">New Email Address</label>
                        <div class="sk-ec-input">
                            <input id="${id}New" type="email" maxlength="255" autocomplete="email" placeholder="name@example.com" data-ec="newEmail">
                        </div>
                    </div>
                    <div class="sk-ec-field">
                        <label for="${id}Pw">Current Password</label>
                        <div class="sk-ec-input has-eye">
                            <input id="${id}Pw" type="password" maxlength="255" autocomplete="current-password" data-ec="password">
                            <button type="button" class="sk-ec-eye" data-ec="eye" aria-label="Show password" title="Show password">${ICON.eye}</button>
                        </div>
                    </div>
                    <div class="sk-ec-actions">
                        <button type="button" class="sk-ec-btn" data-ec="close">Cancel</button>
                        <button type="submit" class="sk-ec-btn primary" data-ec="send">Send Verification Code</button>
                    </div>
                </form>

                <form data-ec="verifyForm" novalidate hidden>
                    <div class="sk-ec-pending-box" role="status">
                        <strong>Email verification pending</strong>
                        We sent a 6-digit code to <b data-ec="pendingEmail"></b>.
                        Your current email (<span data-ec="currentInBox"></span>) stays active until you enter the code.
                        The code expires in 15 minutes.
                    </div>
                    <div class="sk-ec-field">
                        <label for="${id}Code">Verification Code</label>
                        <div class="sk-ec-input">
                            <input id="${id}Code" class="sk-ec-code" type="text" inputmode="numeric" maxlength="6"
                                autocomplete="one-time-code" placeholder="••••••" data-ec="code">
                        </div>
                    </div>
                    <div class="sk-ec-actions">
                        <button type="button" class="sk-ec-btn danger" data-ec="cancel">Cancel Request</button>
                        <button type="button" class="sk-ec-btn" data-ec="resend">Resend Code</button>
                        <button type="submit" class="sk-ec-btn primary" data-ec="verify">Verify Email</button>
                    </div>
                </form>

                <p class="sk-ec-msg" data-ec="message" role="alert" hidden></p>
            </div>
        `;

        const el = name => root.querySelector(`[data-ec="${name}"]`);
        let state = { email: null, email_verified: false, pending: null };
        let resendTimer = null;

        function message(text, type = "error") {
            const box = el("message");
            box.textContent = text || "";
            box.className = `sk-ec-msg ${type}`;
            box.hidden = !text;
        }

        function setOpen(open) {
            el("panel").hidden = !open;
            el("toggle").setAttribute("aria-expanded", String(open));
            el("toggle").textContent = open ? "Close" : (state.pending ? "Enter Code" : "Change Email");
            if (open) {
                const target = state.pending ? el("code") : el("newEmail");
                setTimeout(() => target.focus(), 30);
            }
        }

        function startResendCountdown(seconds) {
            clearInterval(resendTimer);
            let left = Math.max(0, Math.ceil(seconds || 0));
            const button = el("resend");

            const tick = () => {
                button.disabled = left > 0;
                button.textContent = left > 0 ? `Resend Code (${left}s)` : "Resend Code";
                if (left <= 0) clearInterval(resendTimer);
                left--;
            };

            tick();
            if (left >= 0) resendTimer = setInterval(tick, 1000);
        }

        function render(next) {
            state = { ...state, ...next };
            const current = state.email || "No email address yet";
            el("current").textContent = current;

            const badge = el("badge");
            if (state.pending) {
                badge.hidden = false;
                badge.className = "sk-ec-badge wait";
                badge.textContent = "Change pending";
            } else if (state.email && state.email_verified) {
                badge.hidden = false;
                badge.className = "sk-ec-badge ok";
                badge.textContent = "Verified";
            } else {
                badge.hidden = true;
            }

            el("requestForm").hidden = Boolean(state.pending);
            el("verifyForm").hidden = !state.pending;

            if (state.pending) {
                el("pendingEmail").textContent = state.pending.new_email;
                el("currentInBox").textContent = state.email || "none";
                startResendCountdown(state.pending.resend_after);
            } else {
                clearInterval(resendTimer);
            }

            if (el("panel").hidden) {
                el("toggle").textContent = state.pending ? "Enter Code" : "Change Email";
            }
        }

        async function busy(button, work) {
            const buttons = root.querySelectorAll("button");
            buttons.forEach(b => { b.dataset.wasDisabled = String(b.disabled); b.disabled = true; });
            const label = button.textContent;
            button.textContent = "Please wait…";
            try {
                await work();
            } finally {
                buttons.forEach(b => { b.disabled = b.dataset.wasDisabled === "true"; });
                button.textContent = label;
                if (state.pending) startResendCountdown(state.pending.resend_after);
            }
        }

        el("toggle").addEventListener("click", () => {
            message("");
            setOpen(el("panel").hidden);
        });

        el("close").addEventListener("click", () => {
            el("newEmail").value = "";
            el("password").value = "";
            message("");
            setOpen(false);
        });

        el("eye").addEventListener("click", () => {
            const input = el("password");
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            el("eye").setAttribute("aria-label", show ? "Hide password" : "Show password");
            el("eye").title = show ? "Hide password" : "Show password";
        });

        el("code").addEventListener("input", () => {
            el("code").value = el("code").value.replace(/\D/g, "").slice(0, 6);
        });

        el("requestForm").addEventListener("submit", event => {
            event.preventDefault();
            const newEmail = el("newEmail").value.trim();
            const password = el("password").value;

            if (!newEmail) { message("Please enter your new email address."); el("newEmail").focus(); return; }
            if (!el("newEmail").checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                message("Please enter a valid email address, like name@example.com."); el("newEmail").focus(); return;
            }
            if (state.email && newEmail.toLowerCase() === state.email.toLowerCase()) {
                message("This is already your email address."); el("newEmail").focus(); return;
            }
            if (!password) { message("Please enter your current password to confirm it is you."); el("password").focus(); return; }

            busy(el("send"), async () => {
                try {
                    const data = await api("/account/email-change", "POST", { new_email: newEmail, current_password: password });
                    el("password").value = "";
                    el("newEmail").value = "";
                    render(data);
                    message(data.message, "info");
                    setTimeout(() => el("code").focus(), 30);
                } catch (error) {
                    el("password").value = "";
                    message(error.message);
                }
            });
        });

        el("verifyForm").addEventListener("submit", event => {
            event.preventDefault();
            const code = el("code").value.trim();

            if (!/^\d{6}$/.test(code)) {
                message("Please enter the 6-digit code from the email."); el("code").focus(); return;
            }

            busy(el("verify"), async () => {
                try {
                    const data = await api("/account/email-change/verify", "POST", { code });
                    el("code").value = "";
                    render(data);
                    message(data.message || "Your email address has been changed.", "success");
                    if (typeof options.onChanged === "function") options.onChanged(data.email);
                } catch (error) {
                    el("code").value = "";
                    message(error.message);
                    await refresh(); // the request may have been cancelled
                }
            });
        });

        el("resend").addEventListener("click", () => {
            busy(el("resend"), async () => {
                try {
                    const data = await api("/account/email-change/resend", "POST");
                    render(data);
                    message(data.message, "info");
                } catch (error) {
                    message(error.message);
                    if (error.data && error.data.resend_after) startResendCountdown(error.data.resend_after);
                }
            });
        });

        el("cancel").addEventListener("click", () => {
            busy(el("cancel"), async () => {
                try {
                    const data = await api("/account/email-change", "DELETE");
                    el("code").value = "";
                    render(data);
                    message(data.message, "info");
                } catch (error) {
                    message(error.message);
                }
            });
        });

        async function refresh() {
            try {
                render(await api("/account/email-change"));
            } catch (error) {
                // Leave what is shown; the next action reports the problem.
            }
        }

        // Right under the section's heading (e.g. "Account & Security").
        const heading = container.querySelector(":scope > h3");
        if (heading) heading.after(root);
        else container.prepend(root);
        render({ email: options.email || null });
        refresh();

        return { refresh };
    }

    window.SiknayanEmailChange = { mount };
})();
