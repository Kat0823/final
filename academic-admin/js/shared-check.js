/* =========================================================
   SIKNAYAN - ACADEMIC ADMIN
   shared.js
========================================================= */


/* =========================================================
   ICONS
========================================================= */

function refreshIcons() {

    if (typeof lucide !== "undefined") {

        lucide.createIcons();

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

const sidebar =
    document.getElementById(
        "sidebar"
    );

const sidebarToggle =
    document.getElementById(
        "sidebarToggle"
    );


const SIDEBAR_STORAGE_KEY =
    "siknayan_academic_admin_sidebar_collapsed";


function applySidebarState() {

    if (!sidebar) {
        return;
    }


    const collapsed =
        localStorage.getItem(
            SIDEBAR_STORAGE_KEY
        ) === "true";


    sidebar.classList.toggle(
        "collapsed",
        collapsed
    );

}


applySidebarState();


if (
    sidebar &&
    sidebarToggle
) {

    sidebarToggle.addEventListener(
        "click",
        () => {

            const collapsed =
                sidebar.classList.toggle(
                    "collapsed"
                );


            localStorage.setItem(
                SIDEBAR_STORAGE_KEY,
                String(collapsed)
            );

        }
    );

}


/* =========================================================
   SIDEBAR PAGE DETECTION
========================================================= */

const currentPath =
    window.location.pathname
        .toLowerCase();


const insidePagesFolder =
    currentPath.includes(
        "/pages/"
    );


const currentFile =
    currentPath
        .split("/")
        .pop()
        .toLowerCase();


/* =========================================================
   ACCOUNTS SIDEBAR NAVIGATION
   ---------------------------------------------------------
   Root:
       academic-admin/index.html

   Pages:
       academic-admin/pages/*.html
========================================================= */

document.querySelectorAll(
    ".sidebar-nav .nav-item"
).forEach(
    link => {

        const label =
            link.querySelector(
                ".nav-label"
            );


        if (!label) {
            return;
        }


        const labelText =
            label.textContent
                .trim()
                .toLowerCase();


        /* -------------------------------------------------
           ACCOUNTS
        ------------------------------------------------- */

        if (
            labelText ===
            "accounts"
        ) {

            link.href =
                insidePagesFolder
                    ? "accounts.html"
                    : "pages/accounts.html";


            if (
                currentFile ===
                "accounts.html"
            ) {

                link.classList.add(
                    "active"
                );


                link.setAttribute(
                    "aria-current",
                    "page"
                );

            }


            return;
        }


        /* -------------------------------------------------
           REPORTS
        ------------------------------------------------- */

        if (
            labelText ===
            "reports"
        ) {

            link.href =
                insidePagesFolder
                    ? "reports.html"
                    : "pages/reports.html";


            if (
                currentFile ===
                "reports.html"
            ) {

                link.classList.add(
                    "active"
                );


                link.setAttribute(
                    "aria-current",
                    "page"
                );

            }


            return;
        }

    }
);

/* =========================================================
   NOTIFICATIONS SIDEBAR NAVIGATION
   ---------------------------------------------------------
   Keeps Notifications navigation working from both:
       academic-admin/index.html
       academic-admin/pages/*.html
========================================================= */

document.querySelectorAll(
    ".sidebar-nav .nav-item"
).forEach(
    link => {

        const label =
            link.querySelector(
                ".nav-label"
            );


        if (!label) {
            return;
        }


        const labelText =
            label.textContent
                .trim()
                .toLowerCase();


        if (
            labelText !==
            "notifications"
        ) {

            return;

        }


        const currentPath =
            window.location.pathname
                .toLowerCase();


        const insidePagesFolder =
            currentPath.includes(
                "/pages/"
            );


        link.href =
            insidePagesFolder
                ? "notifications.html"
                : "pages/notifications.html";


        const currentFile =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        if (
            currentFile ===
            "notifications.html"
        ) {

            link.classList.add(
                "active"
            );

            link.setAttribute(
                "aria-current",
                "page"
            );

        }

    }
);


/* =========================================================
   TOPBAR NOTIFICATION BUTTON
   ---------------------------------------------------------
   Clicking the bell opens the Notifications workspace.
========================================================= */

document.querySelectorAll(
    ".notification-button"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const currentPath =
                    window.location.pathname
                        .toLowerCase();


                const insidePagesFolder =
                    currentPath.includes(
                        "/pages/"
                    );


                window.location.href =
                    insidePagesFolder
                        ? "notifications.html"
                        : "pages/notifications.html";

            }
        );

    }
);

/* =========================================================
   INITIAL ICON RENDER
========================================================= */

refreshIcons();

/* =========================================
   ACADEMIC ADMIN LOGOUT CONFIRMATION
   Reusable across Academic Admin pages
========================================= */

(function () {
    // Prevent duplicate initialization.
    if (window.siknayanLogoutInitialized) return;
    window.siknayanLogoutInitialized = true;

    // Add the confirmation card styles.
    const logoutStyle = document.createElement("style");

    logoutStyle.textContent = `
        #sikLogoutOverlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, 0.45);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
        }

        #sikLogoutOverlay.open {
            display: flex;
        }

        .sik-logout-card {
            width: 100%;
            max-width: 420px;
            padding: 32px;
            border-radius: 18px;
            background: #ffffff;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
            animation: sikLogoutAppear 0.2s ease-out;
        }

        @keyframes sikLogoutAppear {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .sik-logout-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #e8f5ee;
            color: #0a7549;
        }

        .sik-logout-icon svg {
            width: 30px;
            height: 30px;
        }

        .sik-logout-card h2 {
            margin: 0 0 12px;
            color: #202124;
            font-size: 23px;
        }

        .sik-logout-card p {
            margin: 0 0 26px;
            color: #667085;
            font-size: 15px;
            line-height: 1.6;
        }

        .sik-logout-actions {
            display: flex;
            gap: 12px;
        }

        .sik-logout-actions button {
            flex: 1;
            min-height: 46px;
            padding: 12px 16px;
            border: 1px solid #d0d5dd;
            border-radius: 9px;
            font: inherit;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        #sikLogoutCancel {
            background: #ffffff;
            color: #344054;
        }

        #sikLogoutCancel:hover {
            background: #f2f4f7;
        }

        #sikLogoutConfirm {
            border-color: #0a7549;
            background: #0a7549;
            color: #ffffff;
        }

        #sikLogoutConfirm:hover {
            background: #075b3b;
        }

        #sikLogoutConfirm:disabled {
            cursor: wait;
            opacity: 0.7;
        }

        @media (max-width: 420px) {
            .sik-logout-card {
                padding: 26px 20px;
            }

            .sik-logout-actions {
                flex-direction: column-reverse;
            }
        }
    `;

    document.head.appendChild(logoutStyle);

    // Create the confirmation card once.
    const logoutOverlay = document.createElement("div");

    logoutOverlay.id = "sikLogoutOverlay";
    logoutOverlay.setAttribute("role", "dialog");
    logoutOverlay.setAttribute("aria-modal", "true");
    logoutOverlay.setAttribute(
        "aria-labelledby",
        "sikLogoutTitle"
    );

    logoutOverlay.innerHTML = `
        <section class="sik-logout-card">
            <div class="sik-logout-icon">
                <i data-lucide="log-out"></i>
            </div>

            <h2 id="sikLogoutTitle">Confirm Logout</h2>

            <p>
                Are you sure you want to log out of your account?
            </p>

            <div class="sik-logout-actions">
                <button type="button" id="sikLogoutCancel">
                    Cancel
                </button>

                <button type="button" id="sikLogoutConfirm">
                    Yes, Log Out
                </button>
            </div>
        </section>
    `;

    document.body.appendChild(logoutOverlay);

    const cancelButton =
        document.getElementById("sikLogoutCancel");

    const confirmButton =
        document.getElementById("sikLogoutConfirm");

    let previousFocus = null;

    function openLogoutConfirmation() {
        previousFocus = document.activeElement;

        logoutOverlay.classList.add("open");
        document.body.style.overflow = "hidden";

        if (window.lucide) {
            window.lucide.createIcons();
        }

        cancelButton.focus();
    }

    function closeLogoutConfirmation() {
        logoutOverlay.classList.remove("open");
        document.body.style.overflow = "";

        if (previousFocus && previousFocus.isConnected) {
            previousFocus.focus();
        }
    }

    // Listen for the logout button on every page.
    // The button must have id="academicAdminLogoutBtn".
    document.addEventListener("click", function (event) {
        const logoutButton = event.target.closest(
            "#academicAdminLogoutBtn"
        );

        if (!logoutButton) return;

        event.preventDefault();
        openLogoutConfirmation();
    });

    // Cancel logout.
    cancelButton.addEventListener("click", function () {
        closeLogoutConfirmation();
    });

    // Clicking the shaded background closes the card.
    logoutOverlay.addEventListener("click", function (event) {
        if (event.target === logoutOverlay) {
            closeLogoutConfirmation();
        }
    });

    // Escape closes the confirmation card.
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            logoutOverlay.classList.contains("open")
        ) {
            closeLogoutConfirmation();
        }
    });

    // Confirm logout and clear saved authentication information.
    confirmButton.addEventListener("click", function () {
        confirmButton.disabled = true;
        confirmButton.textContent = "Logging out...";

        sessionStorage.removeItem("isLoggedIn");
        sessionStorage.removeItem("studentId");
        sessionStorage.removeItem("userRole");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("firstLogin");

        localStorage.removeItem("siknayan_api_token");
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");

        // Return to the existing login page.
       window.location.href = new URL(
    "../../index.html",
    document.currentScript?.src || window.location.href
).href;
    });

    // Render the logout icon.
    if (window.lucide) {
        window.lucide.createIcons();
    }
})();

    
/* ==========================================================
   SIKNAYAN LMS - ACADEMIC ADMIN PROFILE MODAL
   Opens when the admin clicks the header or sidebar profile.
   ========================================================== */

(() => {
    if (window.siknayanProfileModalInitialized) return;
    window.siknayanProfileModalInitialized = true;

    const API_URL = "http://127.0.0.1:8000/api/admin/profile";

    const style = document.createElement("style");
    style.textContent = `
        #sikProfileOverlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 23, 42, .45);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
            overflow-y: auto;
        }

        #sikProfileOverlay.open {
            display: flex;
        }

        .sik-profile-modal {
            position: relative;
            width: 100%;
            max-width: 650px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 20px 65px rgba(0,0,0,.25);
            animation: sikProfileIn .2s ease-out;
        }

        @keyframes sikProfileIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .sik-profile-cover {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 28px;
            padding-right: 60px;
            color: #fff;
            background: linear-gradient(125deg, #0a7549, #075b3b);
        }

        .sik-profile-avatar {
            width: 90px;
            height: 90px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            overflow: hidden;
            border: 3px solid rgba(255,255,255,.8);
            border-radius: 50%;
            background: #e7f4ed;
            color: #086642;
        }
            
        button.sik-profile-avatar {
        padding: 0;
        cursor: pointer;
        font: inherit;
        }

        button.sik-profile-avatar:focus-visible {
      outline: 3px solid #d6ad45;
        outline-offset: 3px;
        }


        .sik-profile-avatar svg {
            width: 38px;
            height: 38px;
        }
        
        
/* Hide the fallback icon whenever the profile photo is visible. */
.sik-profile-avatar:has(img:not([hidden])) svg,
.sik-profile-avatar:has(img:not([hidden])) i {
    display: none !important;
}


        
.sik-profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

        .sik-profile-cover h2 {
            margin: 0 0 8px;
            font-size: 23px;
            overflow-wrap: anywhere;
        }

        .sik-profile-cover p {
            margin: 0 0 10px;
            color: #e0f2e9;
            line-height: 1.5;
        }

        .sik-profile-role {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 14px;
            color: #e0f2e9;
        }

        .sik-profile-close {
            position: absolute;
            top: 13px;
            right: 13px;
            z-index: 2;
            width: 36px;
            height: 36px;
            display: grid;
            place-items: center;
            border: 0;
            border-radius: 50%;
            background: #fff;
            color: #333;
            cursor: pointer;
        }

        .sik-profile-body {
            padding: 26px 28px;
        }

        .sik-profile-body h3 {
            margin: 0 0 20px;
            font-size: 19px;
        }

        .sik-profile-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 25px;
        }

        .sik-profile-field label {
            display: block;
            margin-bottom: 7px;
            color: #667085;
            font-size: 14px;
        }

        .sik-profile-field p {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            overflow-wrap: anywhere;
        }

        .sik-profile-security {
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
        }

        .sik-profile-security-row {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 20px;
        }

        .sik-profile-security-icon {
            width: 46px;
            height: 46px;
            flex-shrink: 0;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: #f2f4f7;
        }

        .sik-profile-security-icon svg {
            width: 22px;
            height: 22px;
        }

        .sik-profile-security-info {
            flex: 1;
            min-width: 0;
        }

        .sik-profile-security-info h4 {
            margin: 0 0 5px;
            font-size: 16px;
        }

        .sik-profile-security-info p {
            margin: 0;
            color: #667085;
            font-size: 14px;
            line-height: 1.5;
        }

        .sik-profile-change {
            padding: 8px;
            border: 0;
            background: transparent;
            color: #086642;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }

        .sik-profile-status {
            color: #087443;
            font-weight: 600;
        }

        .sik-profile-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 24px;
            padding-top: 22px;
            border-top: 1px solid #e5e7eb;
        }

        .sik-profile-button {
            min-height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            padding: 12px;
            border: 1px solid #d0d5dd;
            border-radius: 11px;
            background: #fff;
            color: #202124;
            font: inherit;
            cursor: pointer;
        }

        .sik-profile-button:hover {
            border-color: #086642;
            background: #f8fbf9;
        }

        #sikProfileMessage {
            margin: 0 0 16px;
            color: #667085;
            font-size: 14px;
        }

        #sikProfileMessage.error {
            color: #b42318;
        }

        @media (max-width: 600px) {
            #sikProfileOverlay {
                padding: 12px;
            }

            .sik-profile-modal {
                max-height: calc(100vh - 24px);
            }

            .sik-profile-cover {
                gap: 13px;
                padding: 22px 16px;
                padding-right: 44px;
            }

            .sik-profile-avatar {
                width: 65px;
                height: 65px;
            }

            .sik-profile-cover h2 {
                font-size: 18px;
            }

            .sik-profile-cover p {
                font-size: 13px;
            }

            .sik-profile-body {
                padding: 22px 17px;
            }

            .sik-profile-grid {
                gap: 20px 12px;
            }

            .sik-profile-field p {
                font-size: 14px;
            }

            .sik-profile-actions {
                grid-template-columns: 1fr;
            }
        }

       
        @media (max-width: 360px) {
            .sik-profile-cover {
                align-items: flex-start;
                flex-direction: column;
            }

            .sik-profile-grid {
                grid-template-columns: 1fr;
            }
        }

        /* Profile photo upload */
        .sik-profile-photo-upload {
            padding: 16px 28px;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fbf9;
        }

        .sik-profile-photo-upload > label {
            display: block;
            margin-bottom: 10px;
            color: #344054;
            font-size: 14px;
            font-weight: 600;
        }

        .sik-profile-photo-actions {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        #sikProfilePhotoInput {
            max-width: 100%;
            font: inherit;
            font-size: 13px;
        }

        #sikUploadProfilePhoto {
            padding: 9px 15px;
            border: 0;
            border-radius: 8px;
            background: #087443;
            color: #fff;
            font: inherit;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        #sikUploadProfilePhoto:hover {
            background: #065c36;
        }

        #sikUploadProfilePhoto:disabled {
            opacity: .6;
            cursor: not-allowed;
        }

        /* Primary action button */
        .sik-profile-button.primary {
            border-color: #087443;
            background: #087443;
            color: #fff;
            font-weight: 600;
        }

        .sik-profile-button.primary:hover {
            border-color: #065c36;
            background: #065c36;
        }

        .sik-profile-button[hidden] {
            display: none !important;
        }

        /* Responsive photo upload spacing */
        @media (max-width: 600px) {
            .sik-profile-photo-upload {
                padding: 16px;
            }

            .sik-profile-photo-actions {
                align-items: flex-start;
                flex-direction: column;
            }
        }

    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "sikProfileOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Profile settings");

    overlay.innerHTML = `
        <section class="sik-profile-modal">
            <button type="button" class="sik-profile-close"
                    id="sikProfileClose" aria-label="Close profile">
                <i data-lucide="x"></i>
            </button>

<header class="sik-profile-cover">
    <button
        type="button"
        class="sik-profile-avatar"
        id="sikOpenPhotoViewer"
        aria-label="View profile picture"
    >
        <img
            id="sikProfileCoverPhoto"
            src=""
            alt="Administrator profile picture"
            hidden
        >
        <i data-lucide="user-round" id="sikProfileCoverIcon"></i>
    </button>

    <div>
        <h2 id="sikProfileName">Loading...</h2>
        <p>Mountain Province State University</p>
        <div class="sik-profile-role">
            <i data-lucide="shield-check"></i>
            <span id="sikProfileRole">Academic Administrator</span>
        </div>
    </div>
</header>


<div class="sik-profile-photo-upload">
    <label for="sikProfilePhotoInput">Profile Picture</label>

    <div class="sik-profile-photo-actions">
        <input
            id="sikProfilePhotoInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
        >

        <button type="button" id="sikUploadProfilePhoto">
            Upload Photo
        </button>
    </div>
</div>


            <div class="sik-profile-body">
                <p id="sikProfileMessage" role="status" aria-live="polite">
                    Loading profile...
                </p>

                

<section>
    <h3>Personal Information</h3>

    <div class="sik-profile-grid">
        <div class="sik-profile-field">
            <label>Full Name</label>
            <p id="sikProfileFullName">—</p>
            <input
                id="sikProfileNameInput"
                type="text"
                value=""
                maxlength="255"
                autocomplete="name"
                hidden
            >
        </div>

        <div class="sik-profile-field">
            <label>School ID</label>
            <p id="sikProfileSchoolId">—</p>
        </div>

        <div class="sik-profile-field">
            <label>Email Address</label>
            <p id="sikProfileEmail">—</p>
        </div>

        <div class="sik-profile-field">
            <label>Account Role</label>
            <p id="sikProfileRoleDetail">—</p>
        </div>
    </div>
</section>


                <section class="sik-profile-security">
                    <h3>Account &amp; Security</h3>

                    <div class="sik-profile-security-row">
                        <div class="sik-profile-security-icon">
                            <i data-lucide="key-round"></i>
                        </div>
                        <div class="sik-profile-security-info">
                            <h4>Password</h4>
                            <p>Keep your account secure.</p>
                        </div>
                        <button type="button" class="sik-profile-change"
                                data-sik-action="password">
                            Change
                        </button>
                    </div>
                </section>

                
<div class="sik-profile-actions">
    <button
        type="button"
        class="sik-profile-button primary"
        id="sikEditProfile"
    >
        <i data-lucide="pencil"></i>
        Edit Profile
    </button>

    <button
        type="button"
        class="sik-profile-button primary"
        id="sikSaveProfile"
        hidden
    >
        <i data-lucide="check"></i>
        Save Changes
    </button>

    <button
        type="button"
        class="sik-profile-button"
        id="sikCancelProfileEdit"
        hidden
    >
        <i data-lucide="x"></i>
        Cancel
    </button>
</div>

        </section>
    `;

    document.body.appendChild(overlay);

    const $ = id => document.getElementById(id);

    function refreshIcons() {
        if (window.lucide) window.lucide.createIcons();
    }

    function getToken() {
        return (
            window.SIKNAYAN_API_TOKEN ||
            sessionStorage.getItem("authToken") ||
            sessionStorage.getItem("token") ||
            localStorage.getItem("siknayan_api_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("access_token") ||
            ""
        );
    }

    function setText(id, value) {
        $(id).textContent =
            value === null || value === undefined || value === ""
                ? "Not provided"
                : String(value);
    }

    async function loadProfile() {
        $("sikProfileMessage").classList.remove("error");
        $("sikProfileMessage").textContent = "Loading profile...";

        const token = getToken();

        if (!token) {
            $("sikProfileMessage").classList.add("error");
            $("sikProfileMessage").textContent =
                "No login token found. Please sign in again.";
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success || !data.profile) {
                throw new Error(
                    response.status === 401 || response.status === 403
                        ? "Your session is not authorized. Please sign in again."
                        : data.message || `Unable to load profile (HTTP ${response.status}).`
                );
            }

        
const profile = data.profile;

const role = String(profile.role || "academic_admin")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());

const savedName = String(profile.name || "").trim();
const savedPhotoUrl = String(profile.profile_photo_url || "").trim();

// Update every shared profile picture on the current page.
document.querySelectorAll(
    ".profile-avatar, .sidebar-avatar"
).forEach((img) => {
    if (savedPhotoUrl) {
        img.src =
            savedPhotoUrl +
            (savedPhotoUrl.includes("?") ? "&" : "?") +
            "t=" + Date.now();

        img.alt = savedName
            ? `${savedName}'s profile picture`
            : "Administrator profile picture";

        img.hidden = false;
    } else {
        // Never keep displaying the previous administrator's photo.
        img.removeAttribute("src");
        img.alt = "No profile picture";
        img.hidden = true;
    }
});

// Update names everywhere the shared profile is displayed.
const displayName = savedName || "Administrator";
const firstName = displayName.split(/\s+/)[0];

document.querySelectorAll(
    "#topbarAdminName"
).forEach((element) => {
    element.textContent = displayName;
});

document.querySelectorAll(
    "#sidebarAdminName, .sidebar-profile-name"
).forEach((element) => {
    element.textContent = firstName;
});

// Update the profile modal details.
setText("sikProfileName", displayName);
setText("sikProfileFullName", displayName);
setText("sikProfileSchoolId", profile.school_id);
setText("sikProfileEmail", profile.email);
setText("sikProfileRole", role);
setText("sikProfileRoleDetail", role);

// Keep the saved name available for existing session-dependent UI.
if (savedName) {
    sessionStorage.setItem("userName", savedName);
}

// Update the large photo preview in the profile modal.
const coverPhoto = $("sikProfileCoverPhoto");
const coverIcon = $("sikProfileCoverIcon");

if (coverPhoto && coverIcon) {
    if (savedPhotoUrl) {
        coverPhoto.src =
            savedPhotoUrl +
            (savedPhotoUrl.includes("?") ? "&" : "?") +
            "t=" + Date.now();

        coverPhoto.hidden = false;
        coverIcon.style.display = "none";
    } else {
        coverPhoto.removeAttribute("src");
        coverPhoto.hidden = true;
        coverIcon.style.display = "";
    }
}
document.querySelectorAll(
    "#topbarAdminName"
).forEach((element) => {
    element.textContent = displayName;
});

        } catch (error) {
            console.error("Profile load error:", error);
            $("sikProfileMessage").classList.add("error");
            $("sikProfileMessage").textContent =
                error.message || "Could not load profile.";
        }
    }


    // Restore profile modal open and close behavior.
    function openProfileModal() {
        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
        refreshIcons();
        loadProfile();
        $("sikProfileClose").focus();
    }

    function closeProfileModal() {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
    }

    document.addEventListener("click", (event) => {
    const trigger = event.target.closest(
        "#profileHeaderButton, .topbar-profile, #sidebarAdminProfile, .sidebar-user"
    );

    if (!trigger) return;
    if (overlay.contains(trigger)) return;

    event.preventDefault();
    openProfileModal();
});

    $("sikProfileClose").addEventListener("click", closeProfileModal);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeProfileModal();
    });

       document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            overlay.classList.contains("open")
        ) {
            closeProfileModal();
        }
    });
    
        // Profile editing: keep a snapshot so Cancel can discard changes.
    let originalProfileValues = { name: "", email: "" };


function setProfileEditMode(editing) {
    $("sikProfileFullName").hidden = editing;
    $("sikProfileNameInput").hidden = !editing;

    $("sikEditProfile").hidden = editing;
    $("sikSaveProfile").hidden = !editing;
    $("sikCancelProfileEdit").hidden = !editing;

    updateSaveButtonState();
}


function updateSaveButtonState() {
    const nameInput = $("sikProfileNameInput");
    const name = nameInput.value.trim();

    const originalName = originalProfileValues.name || "";
    const changed = name !== originalName;

    $("sikSaveProfile").disabled = !changed || !name;
}
$("sikProfileNameInput").addEventListener(
    "input",
    updateSaveButtonState
);

function startProfileEdit() {
    originalProfileValues = {
        name: $("sikProfileFullName").textContent === "Not provided"
            ? ""
            : $("sikProfileFullName").textContent
    };

    $("sikProfileNameInput").value = originalProfileValues.name;
    $("sikProfileNameInput").required = true;

    $("sikProfileMessage").classList.remove("error");
    $("sikProfileMessage").textContent = "";

    setProfileEditMode(true);
    $("sikProfileNameInput").focus();
}

    
function cancelProfileEdit() {
    $("sikProfileNameInput").value = originalProfileValues.name || "";

    setProfileEditMode(false);

    $("sikProfileMessage").classList.remove("error");
    $("sikProfileMessage").textContent = "";
}


    $("sikEditProfile").addEventListener("click", startProfileEdit);
    $("sikCancelProfileEdit").addEventListener("click", cancelProfileEdit);

    
$("sikSaveProfile").addEventListener("click", async () => {
    console.log("SAVE HANDLER STARTED");

    const nameInput = $("sikProfileNameInput");
    const saveButton = $("sikSaveProfile");
    const cancelButton = $("sikCancelProfileEdit");

    nameInput.value = nameInput.value.trim();

    if (!nameInput.reportValidity()) {
        return;
    }

    if (!nameInput.value) {
        nameInput.setCustomValidity("Full name is required.");
        nameInput.reportValidity();
        nameInput.setCustomValidity("");
        return;
    }

    const token = getToken();
    console.log("Save clicked. Token available:", Boolean(token));

    if (!token) {
        $("sikProfileMessage").classList.add("error");
        $("sikProfileMessage").textContent =
            "Your login session is missing. Please sign in again.";
        return;
    }

    saveButton.disabled = true;
    cancelButton.disabled = true;

    $("sikProfileMessage").classList.remove("error");
    $("sikProfileMessage").textContent = "Saving changes...";

    try {
        const response = await fetch(API_URL, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: nameInput.value
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.message || `Unable to save changes (HTTP ${response.status}).`
            );
        }

        const updatedName =
            data.profile?.name ??
            data.data?.profile?.name ??
            data.name ??
            nameInput.value;

        $("sikProfileFullName").textContent = updatedName;
        $("sikProfileName").textContent = updatedName;
        nameInput.value = updatedName;

        const topbarName = $("topbarAdminName");
        if (topbarName) {
            topbarName.textContent = updatedName;
        }

        const sidebarName = $("sidebarAdminName");
        if (sidebarName) {
            sidebarName.textContent =
                updatedName.trim().split(/\s+/)[0] || "Administrator";
        }

        cancelProfileEdit();

        $("sikProfileMessage").classList.remove("error");
        $("sikProfileMessage").textContent =
            "Profile updated successfully.";

    } catch (error) {
        console.error("Save profile error:", error);
        $("sikProfileMessage").classList.add("error");
        $("sikProfileMessage").textContent =
            error.message || "Could not save your profile.";
    } finally {
        saveButton.disabled = false;
        cancelButton.disabled = false;
    }
});

overlay.querySelectorAll('[data-sik-action="password"]').forEach(button => {
        button.addEventListener("click", () => {
            $("sikProfileMessage").classList.remove("error");
            $("sikProfileMessage").textContent =
                "Password changes need a separate secure backend endpoint.";
        });
    });

   
    // Profile photo preview and upload
    const photoInput = $("sikProfilePhotoInput");
    const uploadPhotoButton = $("sikUploadProfilePhoto");

    let selectedProfilePhoto = null;

    photoInput.addEventListener("change", () => {
        const file = photoInput.files[0];

        if (!file) {
            selectedProfilePhoto = null;
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            alert("Please choose a JPG, PNG, or WebP image.");
            photoInput.value = "";
            selectedProfilePhoto = null;
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("The image must not exceed 2 MB.");
            photoInput.value = "";
            selectedProfilePhoto = null;
            return;
        }

        selectedProfilePhoto = file;

        const reader = new FileReader();

        reader.onload = () => {
            const coverPhoto = $("sikProfileCoverPhoto");
            const coverIcon = $("sikProfileCoverIcon");

            if (coverPhoto && coverIcon) {
                coverPhoto.src = reader.result;
                coverPhoto.hidden = false;
                coverIcon.style.display = "none";
                coverIcon.setAttribute("aria-hidden", "true");
            }
        };

        reader.readAsDataURL(file);
    });

    uploadPhotoButton.addEventListener("click", async () => {
        if (!selectedProfilePhoto) {
            alert("Please choose a profile picture first.");
            return;
        }

        const token = getToken();

        if (!token) {
            alert("Your login session has expired. Please sign in again.");
            return;
        }

        const formData = new FormData();
        formData.append("photo", selectedProfilePhoto);

        uploadPhotoButton.disabled = true;
        uploadPhotoButton.textContent = "Uploading...";

        try {
            const response = await fetch(`${API_URL}/photo`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message || `Upload failed (HTTP ${response.status}).`
                );
            }

            if (!data.profile_photo_url) {
                throw new Error(
                    "Upload succeeded, but the photo URL was not returned."
                );
            }

            const uploadedPhotoUrl = data.profile_photo_url;

            // Update profile pictures displayed elsewhere on the page.
            document.querySelectorAll(
                ".profile-avatar, .sidebar-avatar"
            ).forEach((img) => {
                img.src = uploadedPhotoUrl;
            });

            // Update the profile modal picture.
            const coverPhoto = $("sikProfileCoverPhoto");
            const coverIcon = $("sikProfileCoverIcon");

           
if (coverPhoto && coverIcon) {
    coverPhoto.src =
        uploadedPhotoUrl +
        (uploadedPhotoUrl.includes("?") ? "&" : "?") +
        "t=" + Date.now();

    coverPhoto.hidden = false;
    coverIcon.style.display = "none";
    coverIcon.setAttribute("aria-hidden", "true");
}

            selectedProfilePhoto = null;
            photoInput.value = "";

            alert("Profile picture updated successfully.");
        } catch (error) {
            console.error("Profile photo upload error:", error);
            alert(error.message || "Could not upload the profile picture.");
        } finally {
            uploadPhotoButton.disabled = false;
            uploadPhotoButton.textContent = "Upload Photo";
        }
    });

(function () {
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const userRole = sessionStorage.getItem("userRole");
    const token =
        localStorage.getItem("siknayan_api_token") ||
        sessionStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

    // Allow access only to a logged-in Academic Admin.
    if (
        isLoggedIn !== "true" ||
        userRole !== "academic_admin" ||
        !token
    ) {
        const path = window.location.pathname.toLowerCase();

        const loginUrl = path.includes("/academic-admin/pages/")
            ? "../../index.html"
            : "../index.html";

        window.location.replace(loginUrl);
    }
})();
console.count("shared.js initialization");
console.trace("Initial loadProfile call");

  // Load the saved admin profile when the page initializes.
  console.count("loadProfile called");
console.trace("loadProfile call source");  
  loadProfile();


    refreshIcons();
})();