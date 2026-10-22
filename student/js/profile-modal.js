/* =========================================================
   SIKNAYAN - LEARNER PORTAL
   MY PROFILE POP-UP (profile-modal.js)

   Same layout as the Academic Admin's profile pop-up: green cover with
   photo, Profile Picture upload, Personal Information, Account &
   Security, and Edit Profile / Change Password. Opens when the learner
   clicks their name or photo in the header. Loaded by js/portal.js.
========================================================= */

(function () {
    "use strict";

    const Portal = window.Portal;
    if (!Portal) return;

    const { api, escape, setUserName } = Portal;
    const MAX_PHOTO = 2 * 1024 * 1024;
    const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
    let profile = null;
    let loading = null;
    let chosenPhoto = null;
    let lastFocus = null;

    const overlay = document.createElement("div");
    overlay.className = "lp-profile-overlay";
    overlay.id = "profileOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "lpProfileName");
    overlay.innerHTML = `
        <section class="lp-profile-modal">
            <button type="button" class="lp-profile-close" id="lpProfileClose" aria-label="Close profile">
                <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>

            <header class="lp-profile-cover">
                <div class="lp-profile-photo" id="lpProfilePhoto" aria-hidden="true">
                    <i class="fa-regular fa-user"></i>
                </div>
                <div>
                    <h2 id="lpProfileName">Loading...</h2>
                    <p>Mountain Province State University</p>
                    <div class="lp-profile-role">
                        <i class="fa-solid fa-user-graduate" aria-hidden="true"></i>
                        <span>Learner</span>
                    </div>
                </div>
            </header>

            <div class="lp-profile-photo-upload">
                <div class="lp-profile-photo-actions">
                    <span>Profile Picture</span>
                    <label class="lp-change-photo">
                        Change Profile Picture
                        <input type="file" id="lpPhotoInput" class="visually-hidden"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
                    </label>
                    <span class="lp-photo-name" id="lpPhotoName"></span>
                    <button type="button" class="lp-upload-photo" id="lpUploadPhoto" hidden>Upload Photo</button>
                </div>
                <p class="lp-message" id="lpPhotoMessage" role="status" aria-live="polite"></p>
            </div>

            <div class="lp-profile-body">
                <p class="lp-message" id="lpProfileMessage" role="status" aria-live="polite"></p>

                <form id="lpProfileForm" novalidate>
                    <h3>Personal Information</h3>
                    <div class="lp-profile-grid">
                        <div class="lp-profile-field">
                            <span class="label">Full Name</span>
                            <p id="lpFullName">—</p>
                        </div>
                        <div class="lp-profile-field">
                            <span class="label">School ID</span>
                            <p id="lpSchoolId">—</p>
                        </div>
                        <div class="lp-profile-field">
                            <label for="lpEmailInput">Email Address</label>
                            <p id="lpEmail">—</p>
                            <input id="lpEmailInput" type="email" maxlength="255" autocomplete="email"
                                placeholder="name@example.com (optional)" hidden>
                        </div>
                        <div class="lp-profile-field">
                            <label for="lpContactInput">Contact Number</label>
                            <p id="lpContact">—</p>
                            <input id="lpContactInput" type="tel" maxlength="30" autocomplete="tel"
                                placeholder="09XX XXX XXXX (optional)" hidden>
                        </div>
                        <div class="lp-profile-field">
                            <span class="label">Program</span>
                            <p id="lpProgram">—</p>
                        </div>
                        <div class="lp-profile-field">
                            <span class="label">Account Role</span>
                            <p>Learner</p>
                        </div>
                    </div>
                    <p class="lp-profile-note" id="lpEditNote" hidden>
                        You can change your email and contact number. Your name, school ID and program are managed by your administrator.
                    </p>
                </form>

                <section class="lp-profile-security">
                    <h3>Account &amp; Security</h3>

                    <div class="lp-profile-security-row">
                        <div class="lp-profile-security-icon"><i class="fa-solid fa-key" aria-hidden="true"></i></div>
                        <div class="lp-profile-security-info">
                            <h4>Password</h4>
                            <p>Keep your account secure.</p>
                        </div>
                        <button type="button" class="lp-profile-change" data-lp-action="password"
                            aria-controls="lpPasswordForm" aria-expanded="false">Change</button>
                    </div>

                    <form class="lp-password-form" id="lpPasswordForm" novalidate hidden>
                        <div>
                            <label for="lpCurrentPassword">Current Password</label>
                            <div class="lp-password-input">
                                <input id="lpCurrentPassword" type="password" autocomplete="current-password" required>
                                <button type="button" class="lp-password-toggle" data-lp-toggle="lpCurrentPassword" aria-label="Show current password">
                                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label for="lpNewPassword">New Password</label>
                            <div class="lp-password-input">
                                <input id="lpNewPassword" type="password" autocomplete="new-password" minlength="8" required>
                                <button type="button" class="lp-password-toggle" data-lp-toggle="lpNewPassword" aria-label="Show new password">
                                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label for="lpConfirmPassword">Confirm New Password</label>
                            <div class="lp-password-input">
                                <input id="lpConfirmPassword" type="password" autocomplete="new-password" minlength="8" required>
                                <button type="button" class="lp-password-toggle" data-lp-toggle="lpConfirmPassword" aria-label="Show password confirmation">
                                    <i class="fa-regular fa-eye" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <p class="lp-message" id="lpPasswordMessage" role="status" aria-live="polite"></p>
                        <div class="lp-password-buttons">
                            <span>At least 8 characters. Other devices will be signed out.</span>
                            <div>
                                <button type="button" class="btn plain small" id="lpCancelPassword">Cancel</button>
                                <button type="submit" class="btn small" id="lpSavePassword">Update Password</button>
                            </div>
                        </div>
                    </form>

                    <div class="lp-profile-security-row">
                        <div class="lp-profile-security-icon"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i></div>
                        <div class="lp-profile-security-info">
                            <h4>Account Status</h4>
                            <p>Learner account access.</p>
                        </div>
                        <span class="lp-profile-status">Active</span>
                    </div>

                    <div class="lp-profile-security-row">
                        <div class="lp-profile-security-icon"><i class="fa-solid fa-book" aria-hidden="true"></i></div>
                        <div class="lp-profile-security-info">
                            <h4>Enrolled Classes</h4>
                            <p>Classes you can open from the Classes page.</p>
                        </div>
                        <span class="lp-profile-status" id="lpClassCount">—</span>
                    </div>
                </section>

                <div class="lp-profile-actions" id="lpViewActions">
                    <button type="button" class="lp-profile-button primary" data-lp-action="edit">
                        <i class="fa-solid fa-pen" aria-hidden="true"></i> Edit Profile
                    </button>
                    <button type="button" class="lp-profile-button" data-lp-action="password">
                        <i class="fa-solid fa-lock" aria-hidden="true"></i> Change Password
                    </button>
                </div>

                <div class="lp-profile-actions" id="lpEditActions" hidden>
                    <button type="submit" form="lpProfileForm" class="lp-profile-button primary" id="lpSaveProfile">
                        <i class="fa-solid fa-check" aria-hidden="true"></i> Save Changes
                    </button>
                    <button type="button" class="lp-profile-button" id="lpCancelEdit">
                        <i class="fa-solid fa-xmark" aria-hidden="true"></i> Cancel
                    </button>
                </div>
            </div>
        </section>`;
    document.body.appendChild(overlay);

    const $ = id => document.getElementById(id);

    function message(id, text, type) {
        const element = $(id);
        element.textContent = text || "";
        element.className = `lp-message${type ? ` ${type}` : ""}`;
    }

    const shown = value => (value === null || value === undefined || value === "" ? "Not provided" : String(value));

    function initials(name) {
        return String(name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2)
            .map(part => part.charAt(0).toUpperCase()).join("") || "L";
    }

    /** The photo (or initials) in the header and in the pop-up cover. */
    function showPhoto(url, name) {
        const header = document.querySelector(".topbar .profile-avatar");
        [header, $("lpProfilePhoto")].forEach(element => {
            if (!element) return;
            if (url) {
                element.innerHTML = `<img src="${escape(url)}" alt="">`;
                element.querySelector("img").addEventListener("error", () => {
                    element.textContent = initials(name);
                });
            } else {
                element.textContent = initials(name);
            }
        });
    }

    function fill(user) {
        profile = user;
        $("lpProfileName").textContent = user.name;
        $("lpFullName").textContent = shown(user.name);
        $("lpSchoolId").textContent = shown(user.school_id);
        $("lpEmail").textContent = shown(user.email);
        $("lpContact").textContent = shown(user.contact);
        $("lpProgram").textContent = shown(user.program);
        $("lpClassCount").textContent = user.class_count ?? "—";
        showPhoto(user.profile_photo_url, user.name);
        setUserName(user.name);
    }

    function load() {
        loading = loading || api("/student/profile")
            .then(data => fill(data.user))
            .catch(error => {
                loading = null;
                message("lpProfileMessage", error.message, "error");
            });
        return loading;
    }

    /* ---------- Open and close ---------- */

    function open() {
        lastFocus = document.activeElement;
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
        $("lpProfileClose").focus();
        load();
    }

    function close() {
        setEditing(false);
        setPasswordOpen(false);
        resetPhoto();
        message("lpProfileMessage", "");
        overlay.classList.remove("open");
        document.body.style.overflow = "";
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
        overlay.dispatchEvent(new Event("profileclose"));
    }

    document.addEventListener("click", event => {
        const trigger = event.target.closest && event.target.closest(".topbar .profile");
        if (!trigger) return;
        event.preventDefault();
        open();
    });

    $("lpProfileClose").addEventListener("click", close);
    overlay.addEventListener("click", event => {
        if (event.target === overlay) close();
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && overlay.classList.contains("open")) close();
    });

    /* ---------- Edit Profile (email and contact in place) ---------- */

    function setEditing(editing) {
        ["lpEmail", "lpContact"].forEach(id => { $(id).hidden = editing; });
        ["lpEmailInput", "lpContactInput"].forEach(id => { $(id).hidden = !editing; });
        $("lpEditNote").hidden = !editing;
        $("lpViewActions").hidden = editing;
        $("lpEditActions").hidden = !editing;

        if (editing) {
            $("lpEmailInput").value = profile?.email || "";
            $("lpContactInput").value = profile?.contact || "";
            $("lpEmailInput").focus();
        }
    }

    /* ---------- Change Password (inline under the Password row) ---------- */

    function setPasswordOpen(isOpen) {
        $("lpPasswordForm").hidden = !isOpen;
        overlay.querySelectorAll('[aria-controls="lpPasswordForm"]').forEach(button =>
            button.setAttribute("aria-expanded", String(isOpen)));
        if (!isOpen) $("lpPasswordForm").reset();
        message("lpPasswordMessage", "");
        if (isOpen) $("lpCurrentPassword").focus();
    }

    overlay.querySelectorAll("[data-lp-action]").forEach(button => button.addEventListener("click", () => {
        message("lpProfileMessage", "");
        if (button.dataset.lpAction === "edit") {
            setPasswordOpen(false);
            setEditing(true);
        } else {
            setEditing(false);
            setPasswordOpen(true);
        }
    }));

    $("lpCancelEdit").addEventListener("click", () => setEditing(false));
    $("lpCancelPassword").addEventListener("click", () => setPasswordOpen(false));

    $("lpProfileForm").addEventListener("submit", async event => {
        event.preventDefault();
        const email = $("lpEmailInput").value.trim();
        const contact = $("lpContactInput").value.trim();

        if (email && !$("lpEmailInput").checkValidity()) {
            message("lpProfileMessage", "Please enter a valid email address.", "error");
            $("lpEmailInput").focus();
            return;
        }

        $("lpSaveProfile").disabled = true;
        $("lpCancelEdit").disabled = true;
        try {
            const data = await api("/student/profile", { method: "PUT", body: { email, contact } });
            fill(data.user);
            setEditing(false);
            message("lpProfileMessage", "Your profile was updated.", "success");
        } catch (error) {
            message("lpProfileMessage", error.message, "error");
        } finally {
            $("lpSaveProfile").disabled = false;
            $("lpCancelEdit").disabled = false;
        }
    });

    overlay.querySelectorAll("[data-lp-toggle]").forEach(button => button.addEventListener("click", () => {
        const input = $(button.dataset.lpToggle);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.setAttribute("aria-label", button.getAttribute("aria-label").replace(show ? "Show" : "Hide", show ? "Hide" : "Show"));
        button.innerHTML = `<i class="fa-regular ${show ? "fa-eye-slash" : "fa-eye"}" aria-hidden="true"></i>`;
    }));

    $("lpPasswordForm").addEventListener("submit", async event => {
        event.preventDefault();
        const current = $("lpCurrentPassword").value;
        const next = $("lpNewPassword").value;
        const confirmation = $("lpConfirmPassword").value;

        if (!current || !next || !confirmation) return message("lpPasswordMessage", "Please fill in all three password fields.", "error");
        if (next.length < 8) return message("lpPasswordMessage", "The new password must be at least 8 characters.", "error");
        if (next !== confirmation) return message("lpPasswordMessage", "The new passwords do not match.", "error");
        if (next === current) return message("lpPasswordMessage", "The new password must be different from your current one.", "error");

        $("lpSavePassword").disabled = true;
        try {
            await api("/account/password", {
                method: "PUT",
                body: { current_password: current, password: next, password_confirmation: confirmation }
            });
            setPasswordOpen(false);
            message("lpProfileMessage", "Your password was changed.", "success");
        } catch (error) {
            message("lpPasswordMessage", error.message, "error");
        } finally {
            $("lpSavePassword").disabled = false;
        }
    });

    /* ---------- Profile Picture ---------- */

    function resetPhoto() {
        chosenPhoto = null;
        $("lpPhotoInput").value = "";
        $("lpPhotoName").textContent = "";
        $("lpUploadPhoto").hidden = true;
        message("lpPhotoMessage", "");
    }

    $("lpPhotoInput").addEventListener("change", event => {
        const file = event.target.files[0];
        resetPhoto();
        if (!file) return;

        if (!PHOTO_TYPES.includes(file.type)) {
            message("lpPhotoMessage", "Please choose a JPG, PNG or WEBP image.", "error");
            return;
        }
        if (file.size > MAX_PHOTO) {
            message("lpPhotoMessage", "The image is larger than 2 MB.", "error");
            return;
        }

        chosenPhoto = file;
        $("lpPhotoName").textContent = file.name;
        $("lpUploadPhoto").hidden = false;
    });

    $("lpUploadPhoto").addEventListener("click", async () => {
        if (!chosenPhoto) return;
        const button = $("lpUploadPhoto");
        button.disabled = true;
        button.textContent = "Uploading...";

        const form = new FormData();
        form.append("photo", chosenPhoto);

        try {
            const data = await api("/student/profile/photo", { method: "POST", body: form });
            fill(data.user);
            resetPhoto();
            message("lpPhotoMessage", "Profile picture updated.", "success");
        } catch (error) {
            message("lpPhotoMessage", error.message, "error");
        } finally {
            button.disabled = false;
            button.textContent = "Upload Photo";
        }
    });

    /* ---------- Start ---------- */

    // Load once so the header shows the learner's photo on every page.
    load();

    Portal.openProfile = open;
    Portal.profileOverlay = overlay;

    // The old profile.html opens the pop-up straight away.
    if (document.body.dataset.page === "profile") open();
})();
