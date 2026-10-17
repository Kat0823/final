/* =========================================================
   SIKNAYAN - SYSTEM ADMINISTRATOR
   NOTIFICATIONS
   Frontend prototype using localStorage
========================================================= */

const NOTIFICATION_STORAGE_KEY =
    "siknayan_system_admin_notifications";

/* =========================================================
   SAMPLE NOTIFICATIONS
   These are illustrative examples, not real events.
========================================================= */

const DEFAULT_NOTIFICATIONS = [
    {
        id: "security-signins",
        category: "security",
        title: "Repeated failed sign-ins",
        description:
            "This illustrative security alert represents multiple unsuccessful sign-in attempts. In the connected system, recorded authentication events would be evaluated before generating this notification.",
        recommendation:
            "Review the relevant audit records and investigate the sign-in attempts.",
        severity: "High",
        timestamp: "2026-10-09T10:30:00",
        read: false,
        icon: "shield-alert",
        href: "audit-logs.html",
        actionLabel: "Open Audit Logs"
    },
    {
        id: "backup-failed",
        category: "backups",
        title: "Backup failed",
        description:
            "This illustrative alert represents a scheduled database backup that did not complete successfully.",
        recommendation:
            "Review the backup configuration and investigate the failed backup job.",
        severity: "High",
        timestamp: "2026-10-09T09:15:00",
        read: false,
        icon: "database-backup",
        href: "backup.html",
        actionLabel: "Open Data Backup"
    },
    {
        id: "account-updated",
        category: "accounts",
        title: "Administrator account updated",
        description:
            "This illustrative notification represents a change to an administrator account's details.",
        recommendation:
            "Review the account change in the Academic Administrators section if further verification is needed.",
        severity: "Low",
        timestamp: "2026-10-08T15:45:00",
        read: true,
        icon: "user-round-check",
        href: "administrators.html",
        actionLabel: "Open Administrators"
    }
];

/* =========================================================
   DOM REFERENCES
========================================================= */

const notificationList =
    document.getElementById("notificationList");

const notificationCount =
    document.getElementById("notificationCount");

const notificationsEmpty =
    document.getElementById("notificationsEmpty");

const notificationDetail =
    document.getElementById("notificationDetail");

const notificationDot =
    document.getElementById("notificationDot");

const markAllReadButton =
    document.getElementById("markAllReadButton");

const markNotificationReadButton =
    document.getElementById("markNotificationReadButton");

const notificationActionLink =
    document.getElementById("notificationActionLink");

const detailTitle =
    document.getElementById("detailTitle");

const detailSeverity =
    document.getElementById("detailSeverity");

const detailCategory =
    document.getElementById("detailCategory");

const detailStatus =
    document.getElementById("detailStatus");

const detailTimestamp =
    document.getElementById("detailTimestamp");

const detailDescription =
    document.getElementById("detailDescription");

const detailRecommendation =
    document.getElementById("detailRecommendation");

/* =========================================================
   STATE
========================================================= */

let notifications = loadNotifications();

let activeFilter = "all";

let selectedNotificationId =
    notifications[0]?.id || null;

/* =========================================================
   STORAGE
========================================================= */

function loadNotifications() {
    try {
        const stored =
            localStorage.getItem(NOTIFICATION_STORAGE_KEY);

        if (!stored) {
            localStorage.setItem(
                NOTIFICATION_STORAGE_KEY,
                JSON.stringify(DEFAULT_NOTIFICATIONS)
            );

            return DEFAULT_NOTIFICATIONS.map(
                notification => ({ ...notification })
            );
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            throw new Error("Stored notifications must be an array.");
        }

        return parsed.filter(
            notification =>
                notification &&
                typeof notification.id === "string" &&
                typeof notification.title === "string"
        );

    } catch (error) {
        console.error(
            "Unable to load notifications:",
            error
        );

        return DEFAULT_NOTIFICATIONS.map(
            notification => ({ ...notification })
        );
    }
}

function saveNotifications() {
    try {
        localStorage.setItem(
            NOTIFICATION_STORAGE_KEY,
            JSON.stringify(notifications)
        );

        return true;

    } catch (error) {
        console.error(
            "Unable to save notifications:",
            error
        );

        alert(
            "The notification change could not be saved in this browser."
        );

        return false;
    }
}

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCategoryLabel(category) {
    const labels = {
        security: "Security",
        backups: "Backups",
        accounts: "Accounts",
        system: "System"
    };

    return labels[category] || "System";
}

function getCategoryIcon(category) {
    const icons = {
        security: "shield-alert",
        backups: "database-backup",
        accounts: "users",
        system: "server"
    };

    return icons[category] || "bell";
}

function formatTimestamp(value) {
    if (!value) {
        return "Date unavailable";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function refreshIcons() {
    if (
        typeof lucide !== "undefined" &&
        typeof lucide.createIcons === "function"
    ) {
        lucide.createIcons();
    }
}

/* =========================================================
   FILTERING
========================================================= */

function getFilteredNotifications() {
    switch (activeFilter) {
        case "unread":
            return notifications.filter(
                notification => !notification.read
            );

        case "security":
        case "backups":
        case "accounts":
        case "system":
            return notifications.filter(
                notification =>
                    notification.category === activeFilter
            );

        default:
            return [...notifications];
    }
}

/* =========================================================
   BELL UNREAD INDICATOR
========================================================= */

function updateUnreadIndicator() {
    const unreadCount = notifications.filter(
        notification => !notification.read
    ).length;

    if (notificationDot) {
        notificationDot.hidden = unreadCount === 0;
    }

    const notificationBell =
        document.getElementById("notificationBell");

    if (notificationBell) {
        notificationBell.setAttribute(
            "aria-label",
            unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications, no unread items"
        );

        notificationBell.title =
            unreadCount > 0
                ? `${unreadCount} unread notification(s)`
                : "Notifications";
    }

    if (markAllReadButton) {
        markAllReadButton.disabled = unreadCount === 0;
    }
}

/* =========================================================
   RENDER NOTIFICATION LIST
========================================================= */

function renderNotificationList() {
    if (!notificationList) {
        return;
    }

    const filteredNotifications =
        getFilteredNotifications();

    if (notificationCount) {
        const count = filteredNotifications.length;

        notificationCount.textContent =
            `${count} ${count === 1 ? "item" : "items"}`;
    }

    if (notificationsEmpty) {
        notificationsEmpty.hidden =
            filteredNotifications.length !== 0;
    }

    notificationList.hidden =
        filteredNotifications.length === 0;

    if (filteredNotifications.length === 0) {
        selectedNotificationId = null;

        if (notificationDetail) {
            notificationDetail.hidden = true;
        }

        updateUnreadIndicator();
        refreshIcons();

        return;
    }

    const selectedStillVisible =
        filteredNotifications.some(
            notification =>
                notification.id === selectedNotificationId
        );

    if (!selectedStillVisible) {
        selectedNotificationId =
            filteredNotifications[0].id;
    }

    notificationList.innerHTML =
        filteredNotifications.map(
            notification => {
                const selected =
                    notification.id === selectedNotificationId;

                const unread = !notification.read;

                const category =
                    getCategoryLabel(notification.category);

                const icon =
                    getCategoryIcon(notification.category);

                return `
                    <button
                        type="button"
                        class="notification-list-item
                            ${selected ? "is-selected" : ""}
                            ${unread ? "is-unread" : ""}"
                        data-notification-id="${escapeHtml(notification.id)}"
                        aria-pressed="${selected}"
                    >
                        <span class="notification-list-icon
                            ${notification.category === "security"
                                ? "security-icon"
                                : notification.category === "backups"
                                    ? "backup-icon"
                                    : notification.category === "accounts"
                                        ? "account-icon"
                                        : ""}">
                            <i data-lucide="${icon}"></i>
                        </span>

                        <span class="notification-list-content">
                            <span class="notification-list-meta">
                                <span>${escapeHtml(category)}</span>

                                <span class="${
                                    unread
                                        ? "notification-unread-label"
                                        : "notification-read-label"
                                }">
                                    ${unread ? "Unread" : "Read"}
                                </span>
                            </span>

                            <strong>
                                ${escapeHtml(notification.title)}
                            </strong>

                            <span class="notification-list-description">
                                ${escapeHtml(notification.description)}
                            </span>

                            <time>
                                ${escapeHtml(
                                    formatTimestamp(notification.timestamp)
                                )}
                            </time>
                        </span>

                        <span
                            class="notification-unread-dot"
                            ${unread ? 'aria-label="Unread"' : "hidden"}
                        ></span>
                    </button>
                `;
            }
        ).join("");

    if (notificationDetail) {
        notificationDetail.hidden = false;
    }

    renderNotificationDetails();
    updateUnreadIndicator();
    refreshIcons();
}

/* =========================================================
   RENDER SELECTED NOTIFICATION
========================================================= */

function renderNotificationDetails() {
    const notification = notifications.find(
        item => item.id === selectedNotificationId
    );

    if (!notification || !notificationDetail) {
        return;
    }

    const category =
        getCategoryLabel(notification.category);

    if (detailTitle) {
        detailTitle.textContent = notification.title;
    }

    if (detailSeverity) {
        const severity =
            ["High", "Medium", "Low"].includes(notification.severity)
                ? notification.severity
                : "Medium";

        detailSeverity.textContent = severity;

        detailSeverity.className =
            "notification-severity severity-" +
            severity.toLowerCase();
    }

    if (detailCategory) {
        detailCategory.innerHTML = `
            <i data-lucide="${getCategoryIcon(notification.category)}"></i>
            ${escapeHtml(category)}
        `;
    }

    if (detailStatus) {
        detailStatus.textContent =
            notification.read ? "Read" : "Unread";
    }

    if (detailTimestamp) {
        detailTimestamp.textContent =
            formatTimestamp(notification.timestamp);
    }

    if (detailDescription) {
        detailDescription.textContent =
            notification.description;
    }

    if (detailRecommendation) {
        detailRecommendation.textContent =
            notification.recommendation;
    }

    if (markNotificationReadButton) {
        markNotificationReadButton.disabled =
            notification.read;

        markNotificationReadButton.innerHTML =
            notification.read
                ? '<i data-lucide="check"></i> Already read'
                : '<i data-lucide="check"></i> Mark as read';
    }

    if (notificationActionLink) {
        const allowedPages = [
            "audit-logs.html",
            "backup.html",
            "administrators.html",
            "dashboard.html"
        ];

        const destination =
            allowedPages.includes(notification.href)
                ? notification.href
                : "audit-logs.html";

        notificationActionLink.href = destination;

        notificationActionLink.innerHTML = `
            <i data-lucide="external-link"></i>
            ${escapeHtml(
                notification.actionLabel || "Open related page"
            )}
        `;
    }

    refreshIcons();
}

/* =========================================================
   SELECT NOTIFICATION
========================================================= */

function selectNotification(id) {
    const notification = notifications.find(
        item => item.id === id
    );

    if (!notification) {
        return;
    }

    selectedNotificationId = id;

    if (!notification.read) {
        notification.read = true;
        saveNotifications();
    }

    renderNotificationList();
}

/* =========================================================
   FILTER BUTTONS
========================================================= */

document.querySelectorAll(
    ".notification-filter"
).forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter || "all";

        document.querySelectorAll(
            ".notification-filter"
        ).forEach(filterButton => {
            const active =
                filterButton === button;

            filterButton.classList.toggle(
                "active",
                active
            );

            filterButton.setAttribute(
                "aria-pressed",
                String(active)
            );
        });

        renderNotificationList();
    });
});

/* =========================================================
   NOTIFICATION SELECTION
========================================================= */

if (notificationList) {
    notificationList.addEventListener(
        "click",
        event => {
            const item = event.target.closest(
                ".notification-list-item"
            );

            if (!item) {
                return;
            }

            selectNotification(
                item.dataset.notificationId
            );
        }
    );
}

/* =========================================================
   MARK SELECTED AS READ
========================================================= */

if (markNotificationReadButton) {
    markNotificationReadButton.addEventListener(
        "click",
        () => {
            const notification = notifications.find(
                item => item.id === selectedNotificationId
            );

            if (!notification || notification.read) {
                return;
            }

            notification.read = true;
            saveNotifications();
            renderNotificationList();
        }
    );
}

/* =========================================================
   MARK ALL AS READ
========================================================= */

if (markAllReadButton) {
    markAllReadButton.addEventListener(
        "click",
        () => {
            const hasUnread = notifications.some(
                notification => !notification.read
            );

            if (!hasUnread) {
                return;
            }

            notifications.forEach(notification => {
                notification.read = true;
            });

            saveNotifications();
            renderNotificationList();
        }
    );
}

/* =========================================================
   INITIALIZE
========================================================= */

renderNotificationList();
updateUnreadIndicator();
refreshIcons();