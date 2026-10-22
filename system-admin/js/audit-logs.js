/* =========================================================
   SIKNAYAN - SYSTEM ADMINISTRATOR
   AUDIT LOGS
========================================================= */

/* =========================================================
   STORAGE
========================================================= */

const AUDIT_LOG_STORAGE_KEY =
    "siknayan_system_admin_audit_logs";

/* =========================================================
   ELEMENTS
========================================================= */

const auditLogBody =
    document.getElementById("auditLogBody");

const auditRecordCount =
    document.getElementById("auditRecordCount");

const dateFromInput =
    document.getElementById("auditDateFrom");

const dateToInput =
    document.getElementById("auditDateTo");

const administratorFilter =
    document.getElementById("auditAdministrator");

const actionFilter =
    document.getElementById("auditAction");

const searchInput =
    document.getElementById("auditSearch");

const clearFiltersButton =
    document.getElementById("clearAuditFilters");

const applyFiltersButton =
    document.getElementById("applyAuditFilters");

const exportButton =
    document.getElementById("exportAuditLog");

const auditPageSizeSelect =
    document.getElementById("auditPageSize");

const auditPreviousPageButton =
    document.getElementById("auditPreviousPage");

const auditNextPageButton =
    document.getElementById("auditNextPage");

const auditPageIndicator =
    document.getElementById("auditPageIndicator");

let auditCurrentPage = 1;

/* =========================================================
   STORAGE HELPERS
========================================================= */

/*
 * Audit records come from the server (GET /api/system-admin/audit-logs).
 * They're loaded once into this list; filtering, paging and export then
 * work on the list in the browser.
 */
let auditLogCache = [];

function getAuditLogs() {
    return auditLogCache;
}

const AUDIT_FIELD_LABELS = {
    name: "name",
    school_id: "school ID",
    email: "email",
    is_active: "status",
    profile_photo: "profile photo"
};

function formatAuditValue(value) {
    if (value === true) return "active";
    if (value === false) return "inactive";
    if (value === null || value === undefined || value === "") return "(none)";
    return String(value);
}

const AUDIT_ROLE_LABELS = {
    system_admin: "System Administrator",
    academic_admin: "Academic Administrator",
    instructor: "Instructor",
    learner: "Learner"
};

// "name: Old → New; changed profile photo"
function describeChanges(changes) {
    return Object.entries(changes || {}).map(([field, change]) => {
        const label = AUDIT_FIELD_LABELS[field] || field;

        if (field === "profile_photo") {
            return change && change.removed
                ? "removed profile photo"
                : "changed profile photo";
        }

        if (change && typeof change === "object" && "from" in change) {
            return `${label}: ${formatAuditValue(change.from)} → ${formatAuditValue(change.to)}`;
        }

        return label;
    });
}

function describeAuditEntry(entry) {
    const target = entry.target_name || "an account";
    const details = entry.details || {};
    const schoolId = details.school_id ? ` (${details.school_id})` : "";
    const fromIp = entry.ip ? ` from ${entry.ip}` : "";

    switch (String(entry.action || "").toLowerCase()) {
        case "login":
            return details.first_login
                ? `Signed in with a temporary password${fromIp}`
                : `Signed in${fromIp}`;
        case "logout":
            return `Signed out${fromIp}`;
        case "login_failed":
            return details.account_exists
                ? `Wrong password for ${target}${schoolId}${fromIp}`
                : `Sign-in attempt with unknown ID "${details.school_id || target}"${fromIp}`;
        case "login_blocked":
            return `Sign-in refused: account is deactivated${fromIp}`;
        case "account_locked": {
            const role = AUDIT_ROLE_LABELS[details.target_role] || "Account";
            return `${role} ${target}${schoolId} locked for ${details.seconds || 60} seconds after repeated failed sign-ins${fromIp}`;
        }
        case "password_setup":
            return "Replaced the temporary password with their own";
        case "password_change":
            return "Changed their own password";
        case "password_reset_request":
            return `Asked for a password reset link by email${fromIp}`;
        case "password_reset_email":
            return `Reset their password with the emailed link${fromIp}`;
        case "profile_update": {
            const changes = describeChanges(details.changes);
            return changes.length
                ? `Updated own profile: ${changes.join("; ")}`
                : "Updated own profile";
        }
        case "create":
            return `Created Academic Admin account ${target}${schoolId}`;
        case "delete":
            return `Deleted Academic Admin account ${target}${schoolId}`;
        case "activate":
            return `Activated Academic Admin account ${target}`;
        case "deactivate":
            return `Deactivated Academic Admin account ${target}`;
        case "reset_password":
            return `Reset the password for Academic Admin account ${target}${schoolId}`;
        case "update": {
            const changes = describeChanges(details);

            return changes.length
                ? `Updated ${target}: ${changes.join("; ")}`
                : `Updated ${target}`;
        }
        default:
            return `${formatAction(entry.action)} ${target}`;
    }
}

function toAuditRow(entry) {
    return {
        id: entry.id,
        timestamp: entry.created_at,
        actorName: entry.actor_name || "—",
        actorRole: AUDIT_ROLE_LABELS[entry.actor_role] || "—",
        action: entry.action,
        module: entry.module || "Academic Admin Accounts",
        details: describeAuditEntry(entry)
    };
}

async function loadAuditLogs() {
    renderEmptyState(
        "Loading audit records...",
        "Fetching the latest activity from the server."
    );

    try {
        const response = await fetch(
            `${window.SIKNAYAN_API_ROOT}/system-admin/audit-logs`,
            {
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${systemAdminToken}`
                }
            }
        );

        if (response.status === 401) {
            redirectToLogin();
            return;
        }

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.success || !Array.isArray(payload.logs)) {
            throw new Error(
                payload?.message || `The server returned an error (${response.status}).`
            );
        }

        auditLogCache = payload.logs.map(toAuditRow);
        refreshAuditLogs();
    } catch (error) {
        console.error("Unable to load audit records:", error);
        auditLogCache = [];
        renderEmptyState(
            "Unable to load audit records",
            error.message || "Check that the backend is running, then refresh the page."
        );
    }
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getDateOnly(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(
            2,
            "0"
        );

    const day =
        String(date.getDate()).padStart(
            2,
            "0"
        );

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );
}


function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
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

/* =========================================================
   ACTION LABEL
========================================================= */

function formatAction(action) {
    if (!action) {
        return "—";
    }

    const labels = {
        login: "Sign-in",
        logout: "Sign-out",
        login_failed: "Failed Sign-in",
        login_blocked: "Sign-in Refused",
        account_locked: "Account Locked",
        password_setup: "Password Set",
        password_change: "Password Change",
        password_reset_request: "Reset Link Sent",
        password_reset_email: "Password Reset by Email",
        profile_update: "Profile Update",
        create: "Create",
        update: "Update",
        activate: "Activate",
        deactivate: "Deactivate",
        reset_password: "Password Reset",
        delete: "Delete",
        backup: "Backup"
    };

    const normalizedAction =
        String(action).toLowerCase();

    return (
        labels[normalizedAction] ||
        String(action).charAt(0).toUpperCase() +
        String(action).slice(1)
    );
}

/* =========================================================
   AUDIT FIELD HELPERS
========================================================= */

function getAuditActor(log) {
    return (
        log.actorName ||
        log.actor ||
        log.administrator ||
        log.adminName ||
        "—"
    );
}


function getAuditRole(log) {
    return (
        log.actorRole ||
        log.role ||
        (
            log.administrator ||
            log.adminName
                ? "System Administrator"
                : "—"
        )
    );
}


function getAuditModule(log) {
    return (
        log.module ||
        log.area ||
        log.resource ||
        "—"
    );
}

/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   SORT LOGS
========================================================= */

function sortAuditLogs(logs) {
    return [...logs].sort(
        (a, b) => {

            const dateA =
                new Date(
                    a.timestamp ||
                    a.dateTime ||
                    a.createdAt ||
                    0
                ).getTime();

            const dateB =
                new Date(
                    b.timestamp ||
                    b.dateTime ||
                    b.createdAt ||
                    0
                ).getTime();

            return dateB - dateA;
        }
    );
}

/* =========================================================
   POPULATE ACTOR FILTER
========================================================= */

function populateAdministratorFilter(logs) {

    if (!administratorFilter) {
        return;
    }

    const currentValue =
        administratorFilter.value;

    const actors = [

        ...new Set(

            logs
                .map(
                    log =>
                        getAuditActor(log)
                )
                .filter(
                    actor =>
                        actor &&
                        actor !== "—"
                )

        )

    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );

    administratorFilter.innerHTML = `
        <option value="">
            All Actors
        </option>
    `;

    actors.forEach(
        actor => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                actor;

            option.textContent =
                actor;

            administratorFilter.appendChild(
                option
            );

        }
    );

    if (
        actors.includes(
            currentValue
        )
    ) {

        administratorFilter.value =
            currentValue;

    }
}

/* =========================================================
   FILTER LOGS
========================================================= */

function filterAuditLogs(logs) {

    const dateFrom =
        dateFromInput?.value ||
        "";

    const dateTo =
        dateToInput?.value ||
        "";

    const actor =
        administratorFilter?.value ||
        "";

    const action =
        actionFilter?.value ||
        "";

    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();

    return logs.filter(
        log => {

            const timestamp =
                log.timestamp ||
                log.dateTime ||
                log.createdAt ||
                "";

            const logDate =
                getDateOnly(
                    timestamp
                );

            const logActor =
                getAuditActor(log);

            const logRole =
                getAuditRole(log);

            const logModule =
                getAuditModule(log);

            const logAction =
                String(
                    log.action || ""
                ).toLowerCase();

            const logDetails =
                log.details ||
                "";

            if (
                dateFrom &&
                (
                    !logDate ||
                    logDate < dateFrom
                )
            ) {

                return false;

            }

            if (
                dateTo &&
                (
                    !logDate ||
                    logDate > dateTo
                )
            ) {

                return false;

            }

            if (
                actor &&
                logActor !== actor
            ) {

                return false;

            }

            if (
                action &&
                logAction !==
                    action.toLowerCase()
            ) {

                return false;

            }

            if (search) {

                const searchableText =
                    (
                        logActor +
                        " " +
                        logRole +
                        " " +
                        logModule +
                        " " +
                        logAction +
                        " " +
                        logDetails
                    )
                        .toLowerCase();

                if (
                    !searchableText.includes(
                        search
                    )
                ) {

                    return false;

                }

            }

            return true;

        }
    );
}

/* =========================================================
   RENDER EMPTY STATE
========================================================= */

function renderEmptyState(
    message,
    description
) {

    if (!auditLogBody) {
        return;
    }

    const columnCount =
        document.querySelector(
            ".audit-table thead tr"
        )?.children.length || 4;

    auditLogBody.innerHTML = `
        <tr>

            <td
                colspan="${columnCount}"
                class="audit-empty-state"
            >

                <div
                    class="audit-empty-content"
                >

                    <i
                        data-lucide="file-clock"
                    ></i>

                    <strong>
                        ${escapeHtml(
                            message
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            description
                        )}
                    </span>

                </div>

            </td>

        </tr>
    `;

    refreshIcons();
}

/* =========================================================
   RENDER LOGS
========================================================= */

function renderAuditLogs(logs) {

    if (!auditLogBody) {
        return;
    }

    const pageSize = Math.max(
        1,
        Number(auditPageSizeSelect?.value || 10)
    );

    const filteredCount = logs.length;

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCount / pageSize)
    );

    auditCurrentPage = Math.min(
        auditCurrentPage,
        totalPages
    );

    const startIndex = filteredCount > 0
        ? (auditCurrentPage - 1) * pageSize
        : 0;

    const pageLogs = logs.slice(
        startIndex,
        startIndex + pageSize
    );

    if (!logs.length) {

        const allLogs =
            getAuditLogs();

        if (!allLogs.length) {

            renderEmptyState(
                "No audit records yet",
                "Changes to Academic Admin accounts will appear here."
            );

        } else {

            renderEmptyState(
                "No matching records",
                "No audit records match the selected filters."
            );

        }

    } else {

        const columnCount =
            document.querySelector(
                ".audit-table thead tr"
            )?.children.length || 4;

        auditLogBody.innerHTML =
            pageLogs
                .map(
                    log => {

                        const timestamp =
                            log.timestamp ||
                            log.dateTime ||
                            log.createdAt ||
                            "";

                        const actor =
                            getAuditActor(
                                log
                            );

                        const role =
                            getAuditRole(
                                log
                            );

                        const action =
                            log.action ||
                            "";

                        const module =
                            getAuditModule(
                                log
                            );

                        const details =
                            log.details ||
                            "—";

                        /*
                         * Supports both the current 4-column
                         * Audit Logs HTML and the upcoming
                         * 6-column system-wide layout.
                         */

                        if (
                            columnCount >= 6
                        ) {

                            return `
                                <tr>

                                    <td>
                                        ${escapeHtml(
                                            formatDateTime(
                                                timestamp
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            actor
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            role
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            formatAction(
                                                action
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            module
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            details
                                        )}
                                    </td>

                                </tr>
                            `;

                        }

                        /*
                         * Current layout fallback
                         */

                        return `
                            <tr>

                                <td>
                                    ${escapeHtml(
                                        formatDateTime(
                                            timestamp
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        actor
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        formatAction(
                                            action
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        details
                                    )}
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

        refreshIcons();

    }

    if (auditRecordCount) {

    if (filteredCount === 0) {

        auditRecordCount.textContent =
            "Showing 0 of 0 records";

    } else {

            const firstRecord = startIndex + 1;

            const lastRecord = Math.min(
                startIndex + pageSize,
                filteredCount
            );

            auditRecordCount.textContent =
                `Showing ${firstRecord}–${lastRecord} of ${filteredCount} records`;

        }

    }

    if (auditPageIndicator) {

        auditPageIndicator.textContent =
            `Page ${auditCurrentPage} of ${totalPages}`;

    }

    if (auditPreviousPageButton) {

        auditPreviousPageButton.disabled =
            filteredCount === 0 || auditCurrentPage <= 1;

    }

    if (auditNextPageButton) {

        auditNextPageButton.disabled =
            filteredCount === 0 || auditCurrentPage >= totalPages;

    }
}

/* =========================================================
   REFRESH DISPLAY
========================================================= */

function refreshAuditLogs(resetPage = true) {

    if (resetPage) {
        auditCurrentPage = 1;
    }

    const allLogs =
        sortAuditLogs(
            getAuditLogs()
        );

    populateAdministratorFilter(
        allLogs
    );

    const filteredLogs =
        filterAuditLogs(
            allLogs
        );

    renderAuditLogs(filteredLogs);
}

/* =========================================================
   CSV ESCAPING
========================================================= */

function escapeCsv(value) {

    const text =
        String(
            value ?? ""
        );

    return (
        '"' +
        text.replace(
            /"/g,
            '""'
        ) +
        '"'
    );
}

/* =========================================================
   EXPORT CSV
========================================================= */

function exportAuditLogs() {

    const allLogs =
        sortAuditLogs(
            getAuditLogs()
        );

    const filteredLogs =
        filterAuditLogs(
            allLogs
        );

    if (!filteredLogs.length) {

        showAuditNotification(
            "There are no audit records to export."
        );

        return;
    }

    const rows = [];

    rows.push(
        [
            "Date & Time",
            "Actor",
            "Role",
            "Action",
            "Module",
            "Details"
        ]
            .map(
                escapeCsv
            )
            .join(",")
    );

    filteredLogs.forEach(
        log => {

            const timestamp =
                log.timestamp ||
                log.dateTime ||
                log.createdAt ||
                "";

            const actor =
                getAuditActor(
                    log
                );

            const role =
                getAuditRole(
                    log
                );

            const action =
                formatAction(
                    log.action
                );

            const module =
                getAuditModule(
                    log
                );

            const details =
                log.details ||
                "";

            rows.push(
                [
                    formatDateTime(
                        timestamp
                    ),
                    actor,
                    role,
                    action,
                    module,
                    details
                ]
                    .map(
                        escapeCsv
                    )
                    .join(",")
            );

        }
    );

    const csv =
        rows.join(
            "\r\n"
        );

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    const date =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );

    link.href =
        url;

    link.download =
        `siknayan-audit-log-${date}.csv`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

    showAuditNotification(
        "Audit log exported successfully."
    );
}

/* =========================================================
   NOTIFICATION
========================================================= */

function showAuditNotification(
    message
) {

    const existing =
        document.getElementById(
            "auditNotification"
        );

    if (existing) {

        existing.remove();

    }

    const notification =
        document.createElement(
            "div"
        );

    notification.id =
        "auditNotification";

    notification.textContent =
        message;

    notification.style.position =
        "fixed";

    notification.style.right =
        "24px";

    notification.style.bottom =
        "24px";

    notification.style.zIndex =
        "3000";

    notification.style.padding =
        "13px 16px";

    notification.style.borderRadius =
        "7px";

    notification.style.background =
        "#08683c";

    notification.style.color =
        "#ffffff";

    notification.style.fontSize =
        "13px";

    notification.style.fontWeight =
        "600";

    notification.style.boxShadow =
        "0 5px 18px rgba(0, 0, 0, 0.15)";

    document.body.appendChild(
        notification
    );

    setTimeout(
        () => {

            notification.remove();

        },
        3000
    );
}

/* =========================================================
   ICON REFRESH
========================================================= */

function refreshIcons() {

    if (
        typeof lucide !==
        "undefined"
    ) {

        lucide.createIcons();

    }
}

/* =========================================================
   EVENT LISTENERS
========================================================= */

if (applyFiltersButton) {

    applyFiltersButton.addEventListener(
        "click",
        () => {

            refreshAuditLogs();

        }
    );
}


if (clearFiltersButton) {

    clearFiltersButton.addEventListener(
        "click",
        () => {

            if (dateFromInput) {

                dateFromInput.value =
                    "";

            }

            if (dateToInput) {

                dateToInput.value =
                    "";

            }

            if (administratorFilter) {

                administratorFilter.value =
                    "";

            }

            if (actionFilter) {

                actionFilter.value =
                    "";

            }

            if (searchInput) {

                searchInput.value =
                    "";

            }

            refreshAuditLogs();

        }
    );
}


if (searchInput) {

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                refreshAuditLogs();

            }

        }
    );
}


if (exportButton) {

    exportButton.addEventListener(
        "click",
        exportAuditLogs
    );
}


/* =========================================================
   PAGINATION EVENTS
========================================================= */

if (auditPageSizeSelect) {

    auditPageSizeSelect.addEventListener(
        "change",
        () => {
            auditCurrentPage = 1;
            refreshAuditLogs(false);
        }
    );

}

if (auditPreviousPageButton) {

    auditPreviousPageButton.addEventListener(
        "click",
        () => {

            if (auditCurrentPage > 1) {

                auditCurrentPage--;

                refreshAuditLogs(false);

            }

        }
    );

}

if (auditNextPageButton) {

    auditNextPageButton.addEventListener(
        "click",
        () => {

            auditCurrentPage++;

            refreshAuditLogs(false);

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

loadAuditLogs();