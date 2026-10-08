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

/* =========================================================
   STORAGE HELPERS
========================================================= */

function getAuditLogs() {
    try {
        const stored =
            localStorage.getItem(
                AUDIT_LOG_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const logs =
            JSON.parse(stored);

        return Array.isArray(logs)
            ? logs
            : [];
    } catch (error) {
        console.error(
            "Unable to read audit log data:",
            error
        );

        return [];
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
        login: "Login",
        logout: "Logout",
        create: "Create",
        update: "Update",
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

function renderAuditLogs(
    logs,
    totalCount
) {

    if (!auditLogBody) {
        return;
    }

    if (!logs.length) {

        const allLogs =
            getAuditLogs();

        if (!allLogs.length) {

            renderEmptyState(
                "No audit records yet",
                "System activity will appear here once audit logging is connected to the system."
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
            logs
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

        auditRecordCount.textContent =
            `Showing ${logs.length} of ${totalCount} records`;

    }
}

/* =========================================================
   REFRESH DISPLAY
========================================================= */

function refreshAuditLogs() {

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

    renderAuditLogs(
        filteredLogs,
        allLogs.length
    );
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
   INITIALIZE
========================================================= */

refreshAuditLogs();