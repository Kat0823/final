/* =====================================================

           STORAGE

        ===================================================== */

        const ADMIN_STORAGE_KEY =

            "siknayan_system_admin_academic_administrators";

        const AUDIT_LOG_STORAGE_KEY =

            "siknayan_system_admin_audit_logs";

        /* =====================================================

           DOM REFERENCES

        ===================================================== */

        const academicAdministratorsCount =

            document.getElementById(

                "academicAdministratorsCount"

            );

        const backupStatusValue =

            document.getElementById(

                "backupStatusValue"

            );

        const auditEventsTodayCount =

            document.getElementById(

                "auditEventsTodayCount"

            );

        const recentActivityBody =

            document.getElementById(

                "recentActivityBody"

            );

        /* =====================================================

           SAFE STORAGE READ

        ===================================================== */

        function readLocalStorageArray(

            key

        ) {

            try {

                const stored =

                    localStorage.getItem(

                        key

                    );

                if (!stored) {

                    return [];

                }

                const parsed =

                    JSON.parse(

                        stored

                    );

                return Array.isArray(

                    parsed

                )

                    ? parsed

                    : [];

            } catch (error) {

                console.error(

                    `Unable to read ${key}:`,

                    error

                );

                return [];

            }

        }

        /* =====================================================

           HTML ESCAPING

        ===================================================== */

        function escapeHtml(

            value

        ) {

            return String(

                value ?? ""

            )

                .replace(

                    /&/g,

                    "&amp;"

                )

                .replace(

                    /</g,

                    "&lt;"

                )

                .replace(

                    />/g,

                    "&gt;"

                )

                .replace(

                    /"/g,

                    "&quot;"

                )

                .replace(

                    /'/g,

                    "&#039;"

                );

        }

        /* =====================================================

           DATE HELPERS

        ===================================================== */

        function formatDateTime(

            value

        ) {

            if (!value) {

                return "—";

            }

            const date =

                new Date(

                    value

                );

            if (

                Number.isNaN(

                    date.getTime()

                )

            ) {

                return "—";

            }

            return date.toLocaleString(

                undefined,

                {

                    year:

                        "numeric",

                    month:

                        "short",

                    day:

                        "numeric",

                    hour:

                        "numeric",

                    minute:

                        "2-digit"

                }

            );

        }

        function getDateOnly(

            value

        ) {

            if (!value) {

                return "";

            }

            const date =

                new Date(

                    value

                );

            if (

                Number.isNaN(

                    date.getTime()

                )

            ) {

                return "";

            }

            const year =

                date.getFullYear();

            const month =

                String(

                    date.getMonth() + 1

                ).padStart(

                    2,

                    "0"

                );

            const day =

                String(

                    date.getDate()

                ).padStart(

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

        /* =====================================================

           AUDIT HELPERS

        ===================================================== */

        function getAuditActor(

            log

        ) {

            return (

                log.actorName

                ||

                log.actor

                ||

                log.administrator

                ||

                log.adminName

                ||

                "—"

            );

        }

        function getAuditModule(

            log

        ) {

            return (

                log.module

                ||

                log.area

                ||

                log.resource

                ||

                "—"

            );

        }

        function formatAction(

            action

        ) {

            if (!action) {

                return "—";

            }

            const labels = {

                login:

                    "Login",

                logout:

                    "Logout",

                create:

                    "Create",

                update:

                    "Update",

                delete:

                    "Delete",

                backup:

                    "Backup"

            };

            const normalized =

                String(

                    action

                ).toLowerCase();

            return (

                labels[

                    normalized

                ]

                ||

                (

                    String(

                        action

                    )

                        .charAt(0)

                        .toUpperCase()

                    +

                    String(

                        action

                    )

                        .slice(1)

                )

            );

        }

        function sortAuditLogs(

            logs

        ) {

            return [

                ...logs

            ].sort(

                (

                    a,

                    b

                ) => {

                    const dateA =

                        new Date(

                            a.timestamp

                            ||

                            a.dateTime

                            ||

                            a.createdAt

                            ||

                            0

                        ).getTime();

                    const dateB =

                        new Date(

                            b.timestamp

                            ||

                            b.dateTime

                            ||

                            b.createdAt

                            ||

                            0

                        ).getTime();

                    return (

                        dateB -

                        dateA

                    );

                }

            );

        }

        /* =====================================================

           ACADEMIC ADMINISTRATORS COUNT

        ===================================================== */

        function updateAdministratorCount() {

            const administrators =

                readLocalStorageArray(

                    ADMIN_STORAGE_KEY

                );

            if (

                academicAdministratorsCount

            ) {

                academicAdministratorsCount.textContent =

                    administrators.length;

            }

        }

        /* =====================================================

           AUDIT EVENTS TODAY

        ===================================================== */

        function updateAuditEventsToday() {

            const logs =

                readLocalStorageArray(

                    AUDIT_LOG_STORAGE_KEY

                );

            const today =

                getDateOnly(

                    new Date()

                );

            const todayLogs =

                logs.filter(

                    log => {

                        const timestamp =

                            log.timestamp

                            ||

                            log.dateTime

                            ||

                            log.createdAt

                            ||

                            "";

                        return (

                            getDateOnly(

                                timestamp

                            )

                            ===

                            today

                        );

                    }

                );

            if (

                auditEventsTodayCount

            ) {

                auditEventsTodayCount.textContent =

                    todayLogs.length;

            }

        }

        /* =====================================================

           BACKUP STATUS

        ===================================================== */

        function updateBackupStatus() {

            const logs =

                sortAuditLogs(

                    readLocalStorageArray(

                        AUDIT_LOG_STORAGE_KEY

                    )

                );

            const successfulBackup =

                logs.find(

                    log => {

                        const action =

                            String(

                                log.action

                                ||

                                ""

                            ).toLowerCase();

                        const outcome =

                            String(

                                log.outcome

                                ||

                                ""

                            ).toUpperCase();

                        return (

                            action ===

                            "backup"

                            &&

                            outcome ===

                            "SUCCESS"

                        );

                    }

                );

            if (!backupStatusValue) {

                return;

            }

            if (

                successfulBackup

            ) {

                backupStatusValue.textContent =

                    "Healthy";

                backupStatusValue.title =

                    "Last successful backup: " +

                    formatDateTime(

                        successfulBackup.timestamp

                        ||

                        successfulBackup.dateTime

                        ||

                        successfulBackup.createdAt

                    );

            } else {

                backupStatusValue.textContent =

                    "Not Ready";

                backupStatusValue.title =

                    "MySQL backup service is not connected.";

            }

        }

        /* =====================================================

           RECENT SYSTEM ACTIVITY

        ===================================================== */

        function renderEmptyActivity() {

            if (

                !recentActivityBody

            ) {

                return;

            }

            recentActivityBody.innerHTML = `

                <tr>

                    <td colspan="4">

                        <div

                            class="dashboard-activity-empty"

                        >

                            <i

                                data-lucide="inbox"

                            ></i>

                            <strong>

                                No recent activity

                            </strong>

                            <span>

                                System activity will appear here once actions are recorded.

                            </span>

                        </div>

                    </td>

                </tr>

            `;

            refreshIcons();

        }

        function renderRecentActivity() {

            if (

                !recentActivityBody

            ) {

                return;

            }

            const logs =

                sortAuditLogs(

                    readLocalStorageArray(

                        AUDIT_LOG_STORAGE_KEY

                    )

                );

            const recentLogs =

                logs.slice(

                    0,

                    5

                );

            if (

                recentLogs.length ===

                0

            ) {

                renderEmptyActivity();

                return;

            }

            recentActivityBody.innerHTML =

                recentLogs

                    .map(

                        log => {

                            const timestamp =

                                log.timestamp

                                ||

                                log.dateTime

                                ||

                                log.createdAt

                                ||

                                "";

                            const actor =

                                getAuditActor(

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

                                log.details

                                ||

                                "No additional details.";

                            return `

                                <tr>

                                    <td

                                        class="dashboard-activity-time"

                                    >

                                        ${escapeHtml(

                                            formatDateTime(

                                                timestamp

                                            )

                                        )}

                                    </td>

                                    <td

                                        class="dashboard-activity-actor"

                                    >

                                        ${escapeHtml(

                                            actor

                                        )}

                                    </td>

                                    <td

                                        class="dashboard-activity-action"

                                    >

                                        <strong>

                                            ${escapeHtml(

                                                action

                                            )}

                                        </strong>

                                        <span>

                                            ${escapeHtml(

                                                details

                                            )}

                                        </span>

                                    </td>

                                    <td

                                        class="dashboard-activity-module"

                                    >

                                        ${escapeHtml(

                                            module

                                        )}

                                    </td>

                                </tr>

                            `;

                        }

                    )

                    .join("");

            refreshIcons();

        }

        /* =====================================================

           INITIALIZE

        ===================================================== */

        function refreshDashboard() {

            updateAdministratorCount();

            updateAuditEventsToday();

            updateBackupStatus();

            renderRecentActivity();

        }

        refreshDashboard();

        refreshIcons();
