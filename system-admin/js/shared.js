
/* =========================================================
   SIKNAYAN - SYSTEM ADMINISTRATOR
   GLOBAL JAVASCRIPT
========================================================= */

/* =========================================================
   SYSTEM ADMIN API SESSION
========================================================= */

const systemAdminToken =
    sessionStorage.getItem("authToken") ||
    localStorage.getItem("siknayan_api_token");

function clearSiknayanAuthenticationState() {
    [
        "authToken",
        "token",
        "user",
        "isLoggedIn",
        "studentId",
        "userRole",
        "userName",
        "firstLogin",
        "firstLoginVerified"
    ].forEach((key) => sessionStorage.removeItem(key));

    [
        "siknayan_api_token",
        "token",
        "access_token",
        "isLoggedIn"
    ].forEach((key) => localStorage.removeItem(key));
}

function redirectToLogin() {
    clearSiknayanAuthenticationState();
    window.location.replace("../index.html");
}

if (!systemAdminToken) {
    redirectToLogin();
} else if (!window.SIKNAYAN_API_ROOT) {
    console.error("System Admin API configuration is unavailable.");
} else {
    window.SIKNAYAN_SYSTEM_ADMIN_AUTH_READY = fetch(
        `${window.SIKNAYAN_API_ROOT}/system-admin/session`,
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${systemAdminToken}`
            }
        }
    )
        .then((response) => {
            if (response.status === 401 || response.status === 403) {
                redirectToLogin();
                return false;
            }

            if (!response.ok) {
                throw new Error(
                    `System Admin session verification failed (${response.status}).`
                );
            }

            return response.json();
        })
        .then((data) => {
            if (data === false) {
                return false;
            }

            if (!data || data.success !== true) {
                throw new Error(
                    "The server did not confirm the System Admin session."
                );
            }

            return true;
        })
        .catch((error) => {
            console.error(
                "Unable to verify the System Admin session:",
                error
            );
            return false;
        });
}

const logoutDialog = document.createElement("dialog");
logoutDialog.className = "system-admin-logout-dialog";
logoutDialog.setAttribute("aria-labelledby", "systemAdminLogoutTitle");
logoutDialog.setAttribute("aria-describedby", "systemAdminLogoutMessage");
logoutDialog.innerHTML = `
    <h2 id="systemAdminLogoutTitle">Confirm Logout</h2>
    <p id="systemAdminLogoutMessage">Are you sure you want to log out?</p>
    <div class="system-admin-logout-actions">
        <button type="button" class="secondary-button" data-logout-cancel>
            Cancel
        </button>
        <button type="button" class="danger-button" data-logout-confirm>
            Yes, Log Out
        </button>
    </div>
`;
document.body.appendChild(logoutDialog);

let logoutInProgress = false;

logoutDialog.addEventListener("click", (event) => {
    if (event.target === logoutDialog) {
        logoutDialog.close();
    }
});

logoutDialog
    .querySelector("[data-logout-cancel]")
    .addEventListener("click", () => logoutDialog.close());

logoutDialog
    .querySelector("[data-logout-confirm]")
    .addEventListener("click", async (event) => {
        if (logoutInProgress) {
            return;
        }

        logoutInProgress = true;
        const confirmButton = event.currentTarget;
        const cancelButton = logoutDialog.querySelector("[data-logout-cancel]");
        confirmButton.disabled = true;
        cancelButton.disabled = true;

        try {
            if (systemAdminToken && window.SIKNAYAN_API_ROOT) {
                const response = await fetch(
                    `${window.SIKNAYAN_API_ROOT}/logout`,
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${systemAdminToken}`
                        }
                    }
                );

                if (!response.ok && response.status !== 401) {
                    throw new Error(
                        `Server logout failed (${response.status}).`
                    );
                }
            }
        } catch (error) {
            console.error(
                "Server logout could not be confirmed; clearing local credentials:",
                error
            );
        } finally {
            clearSiknayanAuthenticationState();
            const loginUrl = logoutDialog.dataset.loginUrl;
            window.location.replace(loginUrl || "../index.html");
        }
    });

document.addEventListener("click", (event) => {
    const logoutLink =
        event.target instanceof window.Element
            ? event.target.closest("[data-system-admin-logout]")
            : null;

    if (!logoutLink || logoutInProgress) {
        return;
    }

    event.preventDefault();
    logoutDialog.dataset.loginUrl = logoutLink.href;

    if (!logoutDialog.open) {
        logoutDialog.showModal();
        logoutDialog.querySelector("[data-logout-cancel]").focus();
    }
});


/* =========================================================
   LUCIDE ICONS
========================================================= */

function refreshIcons() {
    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}


/* =========================================================
   SIDEBAR
========================================================= */

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");

const SIDEBAR_STORAGE_KEY =
    "siknayan_system_admin_sidebar_collapsed";

function applySidebarState() {
    if (!sidebar) return;

    const collapsed =
        localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";

    sidebar.classList.toggle("collapsed", collapsed);
}

applySidebarState();

if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
        const collapsed =
            sidebar.classList.toggle("collapsed");

        localStorage.setItem(
            SIDEBAR_STORAGE_KEY,
            String(collapsed)
        );
    });
}


/* =========================================================
   SIDEBAR LABEL TOOLTIPS
========================================================= */

document
    .querySelectorAll(".sidebar-nav .nav-item")
    .forEach((link) => {
        const label = link.querySelector(".nav-label");

        if (!label) return;

        const fullLabel =
            label.textContent.trim().replace(/\s+/g, " ");

        link.setAttribute("title", fullLabel);
        link.setAttribute("aria-label", fullLabel);
    });

const sidebarProfileName =
    document.querySelector(".sidebar-profile-name");

if (sidebarProfileName) {
    sidebarProfileName.setAttribute(
        "title",
        sidebarProfileName.textContent.trim().replace(/\s+/g, " ")
    );
}


/* =========================================================
   PROFILE DISPLAY SYNC
   Demo persistence is browser-local until a backend exists.
========================================================= */

const SIKNAYAN_SYSTEM_ADMIN_PROFILE_KEY =
    "siknayan_system_admin_profile";

function getSiknayanSystemAdminProfile() {
    const defaults = {
        fullName: "Arcana",
        username: "admin",
        email: "",
        photo: ""
    };

    try {
        const saved = JSON.parse(
            localStorage.getItem(
                SIKNAYAN_SYSTEM_ADMIN_PROFILE_KEY
            ) || "{}"
        );

        const profile = {
            ...defaults,
            ...(saved && typeof saved === "object" ? saved : {})
        };

        const savedName =
            String(profile.fullName || "").trim();

        if (
            !savedName ||
            savedName === "System Administrator"
        ) {
            profile.fullName = "Arcana";
        }

        return profile;
    } catch (error) {
        return defaults;
    }
}

function applySiknayanSystemAdminProfile(
    profile = getSiknayanSystemAdminProfile()
) {
    const name =
        String(profile.fullName || "Arcana").trim() || "Arcana";

    const photo =
        typeof profile.photo === "string" ? profile.photo : "";

    document
        .querySelectorAll(
            ".profile-info strong, " +
            ".sidebar-profile-name, " +
            ".profile-page-name"
        )
        .forEach((element) => {
            element.textContent = name;

            if (
                element.classList.contains("sidebar-profile-name")
            ) {
                element.setAttribute("title", name);
            }
        });

    document
        .querySelectorAll(
            ".profile-avatar, " +
            ".sidebar-avatar, " +
            ".profile-page-avatar"
        )
        .forEach((image) => {
            if (!image.dataset.defaultSrc) {
                image.dataset.defaultSrc =
                    image.getAttribute("src") || "";
            }

            image.src = photo || image.dataset.defaultSrc;
            image.alt = `${name} profile photo`;
        });
}

window.SIKNAYAN_SYSTEM_ADMIN_PROFILE_KEY =
    SIKNAYAN_SYSTEM_ADMIN_PROFILE_KEY;

window.getSiknayanSystemAdminProfile =
    getSiknayanSystemAdminProfile;

window.applySiknayanSystemAdminProfile =
    applySiknayanSystemAdminProfile;

applySiknayanSystemAdminProfile();


/* =========================================================
   GLOBAL NOTIFICATION BELL
   Sample notifications are stored in browser localStorage.
========================================================= */

(function initializeSystemAdminNotifications() {
    "use strict";

    const STORAGE_KEY =
        "siknayan_system_admin_notifications";

    const NOTIFICATIONS_PAGE = "notifications.html";
    const MAX_DROPDOWN_ITEMS = 4;

    /*
       These are demonstration notifications only.
       They do not represent live security or backup monitoring.
    */

    const DEFAULT_NOTIFICATIONS = [
        {
            id: "security-signins",
            category: "security",
            categoryLabel: "Security",
            title: "Repeated failed sign-ins",
            message:
                "Multiple failed sign-in attempts were recorded. Review the audit logs.",
            description:
                "Multiple failed sign-in attempts were recorded. Review the audit logs.",
            severity: "high",
            priority: "high",
            time: "10 minutes ago",
            timestamp: new Date(
                Date.now() - 10 * 60 * 1000
            ).toISOString(),
            read: false,
            href: "audit-logs.html",
            icon: "shield-alert"
        },
        {
            id: "backup-failed",
            category: "backups",
            categoryLabel: "Backups",
            title: "Backup failed",
            message:
                "A sample backup operation failed. Review the backup configuration and history.",
            description:
                "A sample backup operation failed. Review the backup configuration and history.",
            severity: "high",
            priority: "high",
            time: "30 minutes ago",
            timestamp: new Date(
                Date.now() - 30 * 60 * 1000
            ).toISOString(),
            read: false,
            href: "backup.html",
            icon: "database"
        },
        {
            id: "account-updated",
            category: "accounts",
            categoryLabel: "Accounts",
            title: "Administrator account updated",
            message:
                "A sample administrator account update is available for review.",
            description:
                "A sample administrator account update is available for review.",
            severity: "low",
            priority: "low",
            time: "1 hour ago",
            timestamp: new Date(
                Date.now() - 60 * 60 * 1000
            ).toISOString(),
            read: true,
            href: "administrators.html",
            icon: "user-cog"
        }
    ];

    let notificationWrapper = null;
    let notificationDropdown = null;
    let notificationList = null;
    let notificationSummary = null;
    let notificationViewAll = null;

    
    function getNotifications() {
        const detailsById = {
            "security-signins": {
                severity: "High",
                recommendation:
                    "Review the relevant audit records and investigate the sign-in attempts.",
                actionLabel: "Open Audit Logs"
            },
            "backup-failed": {
                severity: "High",
                recommendation:
                    "Review the backup configuration and investigate the failed backup job.",
                actionLabel: "Open Data Backup"
            },
            "account-updated": {
                severity: "Low",
                recommendation:
                    "Review the account change in the Academic Administrators section if further verification is needed.",
                actionLabel: "Open Administrators"
            }
        };

        let shouldSave = false;

        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            let parsed;

            if (stored === null) {
                parsed = DEFAULT_NOTIFICATIONS.map(
                    item => ({ ...item })
                );
                shouldSave = true;
            } else {
                parsed = JSON.parse(stored);
            }

            if (!Array.isArray(parsed)) {
                throw new Error("Invalid notification data.");
            }

            const normalized = parsed.map(item => {
                const source =
                    item && typeof item === "object" ? item : {};

                const defaults = detailsById[source.id] || {};

                const rawSeverity = String(
                    source.severity || defaults.severity || "Medium"
                ).toLowerCase();

                const severity =
                    rawSeverity === "high" ? "High" :
                    rawSeverity === "medium" ? "Medium" :
                    rawSeverity === "low" ? "Low" : "Medium";

                const recommendation =
                    source.recommendation ||
                    defaults.recommendation || "";

                const actionLabel =
                    source.actionLabel ||
                    defaults.actionLabel ||
                    "View details";

                if (
                    source.severity !== severity ||
                    source.recommendation !== recommendation ||
                    source.actionLabel !== actionLabel
                ) {
                    shouldSave = true;
                }

                return {
                    ...source,
                    severity,
                    recommendation,
                    actionLabel
                };
            });

            if (shouldSave) {
                saveNotifications(normalized);
            }

            return normalized;

        } catch (error) {
            console.warn("Unable to load notifications:", error);

            return DEFAULT_NOTIFICATIONS.map(
                item => ({ ...item })
            );
        }
    }


    function saveNotifications(notifications) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(notifications)
            );
        } catch (error) {
            console.warn(
                "Unable to save System Admin notifications.",
                error
            );
        }
    }

    function isUnread(notification) {
        return notification.read !== true &&
            notification.isRead !== true;
    }

    function getUnreadCount(notifications) {
        return notifications.filter(isUnread).length;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(
            /[&<>"']/g,
            (character) => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[character]
        );
    }

    function getCategoryLabel(notification) {
        const labels = {
            security: "Security",
            backups: "Backups",
            accounts: "Accounts",
            system: "System"
        };

        const category =
            String(notification.category || "system").toLowerCase();

        return notification.categoryLabel ||
            labels[category] ||
            "System";
    }

    function getMessage(notification) {
        return notification.message ||
            notification.description ||
            notification.body ||
            notification.detail ||
            "Open Notifications to view this item.";
    }

    function getTimeLabel(notification) {
        return notification.time ||
            notification.dateLabel ||
            "Recent";
    }

    function syncNotificationDots(notifications) {
        const unreadExists =
            getUnreadCount(notifications) > 0;

        document
            .querySelectorAll(".notification-dot")
            .forEach((dot) => {
                dot.hidden = !unreadExists;
            });

        document
            .querySelectorAll(
                ".notification-button, #notificationBell"
            )
            .forEach((button) => {
                button.setAttribute(
                    "aria-label",
                    unreadExists
                        ? `Notifications, ${getUnreadCount(notifications)} unread`
                        : "Notifications"
                );
            });
    }

    function createDropdown() {
        const bell = document.querySelector(
            ".notification-button, #notificationBell"
        );

        if (!bell || notificationWrapper) return;

        notificationWrapper =
            document.createElement("div");

        notificationWrapper.className =
            "notification-menu-wrapper";

        notificationWrapper.dataset.notificationMenu = "true";

        const originalParent = bell.parentElement;

        if (!originalParent) return;

        originalParent.insertBefore(
            notificationWrapper,
            bell
        );

        notificationWrapper.appendChild(bell);

        notificationDropdown =
            document.createElement("section");

        notificationDropdown.className =
            "notification-dropdown";

        notificationDropdown.id =
            "systemAdminNotificationDropdown";

        notificationDropdown.hidden = true;

        notificationDropdown.setAttribute("aria-label", "Notifications");

        notificationDropdown.innerHTML = `
            <div class="notification-dropdown-header">
                <div>
                    <h3>Notifications</h3>
                    <p class="notification-dropdown-summary"></p>
                </div>
                <span class="notification-sample-label">SAMPLE</span>
            </div>

            <div class="notification-dropdown-list"></div>

            <a class="notification-dropdown-footer"
               href="${NOTIFICATIONS_PAGE}">
                View all notifications
                <span aria-hidden="true">→</span>
            </a>
        `;

        notificationWrapper.appendChild(
            notificationDropdown
        );

        notificationList =
            notificationDropdown.querySelector(
                ".notification-dropdown-list"
            );

        notificationSummary =
            notificationDropdown.querySelector(
                ".notification-dropdown-summary"
            );

        notificationViewAll =
            notificationDropdown.querySelector(
                ".notification-dropdown-footer"
            );

        bell.setAttribute("aria-haspopup", "true");
        bell.setAttribute("aria-expanded", "false");
        bell.setAttribute(
            "aria-controls",
            "systemAdminNotificationDropdown"
        );

        bell.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            setDropdownOpen(
                notificationDropdown.hidden
            );
        });

        notificationDropdown.addEventListener(
            "click",
            (event) => event.stopPropagation()
        );

        document.addEventListener("click", (event) => {
            if (
                notificationWrapper &&
                !notificationWrapper.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                setDropdownOpen(false);
            }
        });
    }

    function setDropdownOpen(open) {
        if (!notificationDropdown) return;

        notificationDropdown.hidden = !open;

        const bell = notificationWrapper.querySelector(
            ".notification-button, #notificationBell"
        );

        if (bell) {
            bell.setAttribute(
                "aria-expanded",
                String(open)
            );
        }

        if (open) {
            renderDropdown();
        }
    }

    function markNotificationRead(id) {
        const notifications = getNotifications();

        const updated = notifications.map((notification) => {
            if (notification.id !== id) {
                return notification;
            }

            return {
                ...notification,
                read: true,
                ...(Object.prototype.hasOwnProperty.call(
                    notification,
                    "isRead"
                ) ? { isRead: true } : {})
            };
        });

        saveNotifications(updated);

        syncNotificationDots(updated);
        renderDropdown();
    }

    function renderDropdown() {
        if (
            !notificationList ||
            !notificationSummary
        ) {
            return;
        }

        const notifications = getNotifications();
        const unreadCount = getUnreadCount(notifications);
        const recentNotifications =
            notifications.slice(0, MAX_DROPDOWN_ITEMS);

        notificationSummary.textContent =
            unreadCount === 0
                ? "You're all caught up"
                : `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`;

        if (recentNotifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-dropdown-empty">
                    <span class="notification-empty-icon">
                        <i data-lucide="bell-ring"></i>
                    </span>
                    <strong>No notifications yet</strong>
                    <p>New notifications will appear here.</p>
                </div>
            `;

            refreshIcons();
            syncNotificationDots(notifications);
            return;
        }

        notificationList.innerHTML =
            recentNotifications.map((notification) => {
                const unread = isUnread(notification);
                const title =
                    escapeHTML(notification.title || "Notification");
                const message =
                    escapeHTML(getMessage(notification));
                const category =
                    escapeHTML(getCategoryLabel(notification));
                const time =
                    escapeHTML(getTimeLabel(notification));
                const icon =
                    escapeHTML(notification.icon || "bell");
                const id =
                    escapeHTML(notification.id || "");
                const unreadClass = unread ? " unread" : "";

                return `
                    <button
                        class="notification-dropdown-item${unreadClass}"
                        type="button"
                        data-notification-id="${id}"
                        aria-label="${title}"
                    >
                        <span class="notification-dropdown-icon">
                            <i data-lucide="${icon}"></i>
                        </span>

                        <span class="notification-dropdown-content">
                            <span class="notification-dropdown-item-heading">
                                <strong>${title}</strong>
                                ${unread
                                    ? '<span class="notification-unread-indicator" aria-label="Unread"></span>'
                                    : ""}
                            </span>

                            <span class="notification-dropdown-message">
                                ${message}
                            </span>

                            <span class="notification-dropdown-meta">
                                <span>${category}</span>
                                <span aria-hidden="true">·</span>
                                <span>${time}</span>
                            </span>
                        </span>
                    </button>
                `;
            }).join("");

        notificationList
            .querySelectorAll("[data-notification-id]")
            .forEach((button) => {
                button.addEventListener("click", () => {
                    const id =
                        button.dataset.notificationId;

                    const selected = getNotifications().find(
                        (item) => String(item.id) === String(id)
                    );

                    markNotificationRead(id);
                    setDropdownOpen(false);

                    const destination =
                        selected && typeof selected.href === "string"
                            ? selected.href.trim()
                            : "";

                    window.location.href =
                        destination || NOTIFICATIONS_PAGE;
                });
            });

        if (notificationViewAll) {
            notificationViewAll.href = NOTIFICATIONS_PAGE;
        }

        syncNotificationDots(notifications);
        refreshIcons();
    }

    function initialize() {
        createDropdown();

        if (!notificationWrapper) return;

        const notifications = getNotifications();

        syncNotificationDots(notifications);
        renderDropdown();
    }

    /*
       Refresh if notification status changes in another browser tab.
    */

    window.addEventListener("storage", (event) => {
        if (event.key !== STORAGE_KEY) return;

        const notifications = getNotifications();

        syncNotificationDots(notifications);
        renderDropdown();
    });

    /*
       Other page scripts may dispatch this event after changing
       notification state in the same tab.
    */

    window.addEventListener(
        "siknayan:notifications-updated",
        () => {
            const notifications = getNotifications();

            syncNotificationDots(notifications);
            renderDropdown();
        }
    );

    initialize();
})();
