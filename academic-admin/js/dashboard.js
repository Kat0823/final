/* =========================================================
   SIKNAYAN - ACADEMIC ADMIN
   dashboard.js
========================================================= */

(function initDashboard() {

    const page =
        document.querySelector(".dashboard-page");

    if (!page) {
        return;
    }


    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const LEARNER_STORAGE_KEY =
        "siknayan_academic_admin_learners";

    const CLASS_STORAGE_KEY =
        "siknayan_academic_admin_classes";

    const INSTRUCTOR_STORAGE_KEY =
        "siknayan_academic_admin_instructors";

    const LEARNER_ACCOUNT_STORAGE_KEY =
        "siknayan_academic_admin_learner_accounts";

    const INSTRUCTOR_ACCOUNT_STORAGE_KEY =
        "siknayan_academic_admin_instructor_accounts";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const totalLearners =
        document.getElementById(
            "totalLearners"
        );

    const learnerProgramSummary =
        document.getElementById(
            "learnerProgramSummary"
        );

    const totalClasses =
        document.getElementById(
            "totalClasses"
        );

    const classEnrollmentSummary =
        document.getElementById(
            "classEnrollmentSummary"
        );

    const totalInstructors =
        document.getElementById(
            "totalInstructors"
        );

    const instructorAccountSummary =
        document.getElementById(
            "instructorAccountSummary"
        );

    const totalModuleAssignments =
        document.getElementById(
            "totalModuleAssignments"
        );

    const activeLearners =
        document.getElementById(
            "activeLearners"
        );

    const inactiveLearners =
        document.getElementById(
            "inactiveLearners"
        );

    const completedLearners =
        document.getElementById(
            "completedLearners"
        );

    const averageProgress =
        document.getElementById(
            "averageProgress"
        );

    const queueLearnersWithoutClass =
        document.getElementById(
            "queueLearnersWithoutClass"
        );

    const queueAwaitingGrade =
        document.getElementById(
            "queueAwaitingGrade"
        );

    const queueEmptyClasses =
        document.getElementById(
            "queueEmptyClasses"
        );

    const activeClassesList =
        document.getElementById(
            "activeClassesList"
        );

    const recentAccountActivity =
        document.getElementById(
            "recentAccountActivity"
        );

    const dashboardUpdated =
        document.getElementById(
            "dashboardUpdated"
        );


    /* =====================================================
       STORAGE HELPERS
    ===================================================== */

    function readStorage(key) {

        try {

            const raw =
                localStorage.getItem(key);

            if (!raw) {
                return null;
            }

            return JSON.parse(raw);

        } catch (error) {

            console.error(
                `Dashboard: unable to read ${key}`,
                error
            );

            return null;
        }
    }


    function readArrayStorage(key) {

        const stored =
            readStorage(key);

        if (Array.isArray(stored)) {
            return stored;
        }

        if (
            stored &&
            Array.isArray(stored.items)
        ) {
            return stored.items;
        }

        if (
            stored &&
            Array.isArray(stored.accounts)
        ) {
            return stored.accounts;
        }

        if (
            stored &&
            Array.isArray(stored.instructors)
        ) {
            return stored.instructors;
        }

        if (
            stored &&
            Array.isArray(stored.learners)
        ) {
            return stored.learners;
        }

        if (
            stored &&
            Array.isArray(stored.classes)
        ) {
            return stored.classes;
        }

        return [];
    }


    /* =====================================================
       DATA LOADERS
    ===================================================== */

    function loadLearnerState() {

        const stored =
            readStorage(
                LEARNER_STORAGE_KEY
            );

        if (
            stored &&
            typeof stored === "object" &&
            !Array.isArray(stored)
        ) {

            return {
                learners:
                    Array.isArray(
                        stored.learners
                    )
                        ? stored.learners
                        : [],

                modules:
                    stored.modules &&
                    typeof stored.modules === "object"
                        ? stored.modules
                        : {}
            };
        }

        if (Array.isArray(stored)) {

            return {
                learners: stored,
                modules: {}
            };
        }

        return {
            learners: [],
            modules: {}
        };
    }


    function loadClasses() {

        return readArrayStorage(
            CLASS_STORAGE_KEY
        );
    }


    function loadInstructors() {

        return readArrayStorage(
            INSTRUCTOR_STORAGE_KEY
        );
    }


    function loadLearnerAccounts() {

        return readArrayStorage(
            LEARNER_ACCOUNT_STORAGE_KEY
        );
    }


    function loadInstructorAccounts() {

        return readArrayStorage(
            INSTRUCTOR_ACCOUNT_STORAGE_KEY
        );
    }


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    function normalizeText(value) {

        return String(
            value ?? ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                " "
            );
    }


    function normalizeStatus(value) {

        return normalizeText(value)
            .replace(
                /[_-]+/g,
                " "
            );
    }


    function getLearnerStatus(
        learner
    ) {

        return normalizeStatus(
            learner?.status
        );
    }


    function getLearnerProgress(
        learner
    ) {

        const value =
            Number(
                learner?.progress
            );

        if (
            !Number.isFinite(value)
        ) {
            return null;
        }

        return Math.max(
            0,
            Math.min(
                100,
                value
            )
        );
    }


    function getClassEnrollmentCount(
        classItem
    ) {

        if (
            Array.isArray(
                classItem?.learnerIds
            )
        ) {

            return classItem.learnerIds.length;
        }

        return 0;
    }

    function calculateActiveLearnersWithoutClass(
        learners,
        classes
    ) {

        const assignedLearnerIds =
            new Set();


        classes.forEach(
            classItem => {

                if (
                    !Array.isArray(
                        classItem?.learnerIds
                    )
                ) {
                    return;
                }


                classItem.learnerIds.forEach(
                    learnerId => {

                        const id =
                            String(
                                learnerId ?? ""
                            ).trim();

                        if (id) {
                            assignedLearnerIds.add(
                                id
                            );
                        }

                    }
                );

            }
        );


        return learners.filter(
            learner => {

                const status =
                    getLearnerStatus(
                        learner
                    );

                const learnerId =
                    String(
                        learner?.id ?? ""
                    ).trim();


                return (
                    status === "active" &&
                    learnerId &&
                    !assignedLearnerIds.has(
                        learnerId
                    )
                );

            }
        ).length;
    }


    /* =====================================================
       MODULE CALCULATIONS
    ===================================================== */

    function calculateModuleAssignments(
        learnerState
    ) {

        const modules =
            learnerState.modules;

        if (
            modules &&
            typeof modules === "object"
        ) {

            let total = 0;

            Object.values(
                modules
            ).forEach(
                learnerModules => {

                    if (
                        Array.isArray(
                            learnerModules
                        )
                    ) {

                        total +=
                            learnerModules.length;
                    }

                }
            );

            if (total > 0) {
                return total;
            }
        }


        /*
            Fallback for compatibility with older
            learner records.
        */

        return learnerState.learners.reduce(
            (
                total,
                learner
            ) => {

                return (
                    total +
                    Math.max(
                        0,
                        Number(
                            learner?.modulesAssigned ||
                            0
                        )
                    )
                );

            },
            0
        );
    }


    function calculateAwaitingGrade(
        learnerState
    ) {

        let total = 0;

        const modules =
            learnerState.modules;

        if (
            !modules ||
            typeof modules !== "object"
        ) {
            return 0;
        }

        Object.values(
            modules
        ).forEach(
            learnerModules => {

                if (
                    !Array.isArray(
                        learnerModules
                    )
                ) {
                    return;
                }

                learnerModules.forEach(
                    module => {

                        const status =
                            normalizeStatus(
                                module?.status
                            );

                        if (
                            status.includes(
                                "awaiting grade"
                            )
                        ) {

                            total++;
                        }

                    }
                );

            }
        );

        return total;
    }


    /* =====================================================
       INSTRUCTOR CALCULATIONS
    ===================================================== */

    function buildInstructorMap(
        instructors,
        classes
    ) {

        const map =
            new Map();


        instructors.forEach(
            instructor => {

                if (
                    !instructor?.id
                ) {
                    return;
                }

                map.set(
                    String(
                        instructor.id
                    ),
                    instructor
                );

            }
        );


        /*
            If instructor records have not yet been
            initialized, derive missing instructors
            from class relationships.
        */

        classes.forEach(
            classItem => {

                const id =
                    classItem?.instructorId;

                if (!id) {
                    return;
                }

                const key =
                    String(id);

                if (
                    map.has(key)
                ) {
                    return;
                }

                map.set(
                    key,
                    {
                        id: key,
                        name:
                            classItem.instructorName ||
                            "Unknown Instructor",
                        status: "ACTIVE"
                    }
                );

            }
        );


        return map;
    }


    /* =====================================================
       HTML HELPERS
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


    function formatCount(
        value,
        singular,
        plural = `${singular}s`
    ) {

        const count =
            Number(value) || 0;

        return `${count} ${
            count === 1
                ? singular
                : plural
        }`;
    }


    function formatRelativeTime(
        value
    ) {

        if (!value) {
            return "Date unavailable";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Date unavailable";
        }

        const now =
            new Date();

        const difference =
            Math.max(
                0,
                now.getTime() -
                date.getTime()
            );

        const minutes =
            Math.floor(
                difference /
                60000
            );

        if (minutes < 1) {
            return "Just now";
        }

        if (minutes < 60) {

            return `${minutes} ${
                minutes === 1
                    ? "minute"
                    : "minutes"
            } ago`;
        }

        const hours =
            Math.floor(
                minutes / 60
            );

        if (hours < 24) {

            return `${hours} ${
                hours === 1
                    ? "hour"
                    : "hours"
            } ago`;
        }

        const days =
            Math.floor(
                hours / 24
            );

        if (days < 30) {

            return `${days} ${
                days === 1
                    ? "day"
                    : "days"
            } ago`;
        }

        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       RENDER OVERVIEW
    ===================================================== */

    function renderOverview(
        learnerState,
        classes,
        instructorMap,
        learnerAccounts,
        instructorAccounts
    ) {

        const learners =
            learnerState.learners;


        const programSet =
            new Set();

        learners.forEach(
            learner => {

                const program =
                    String(
                        learner?.program || ""
                    ).trim();

                if (program) {
                    programSet.add(
                        program
                    );
                }

            }
        );


        const activeClassRecords =
            classes.filter(
                classItem =>
                    normalizeStatus(
                        classItem?.status
                    ) === "active"
            );


        const totalEnrollment =
            activeClassRecords.reduce(
                (
                    total,
                    classItem
                ) => {

                    return (
                        total +
                        getClassEnrollmentCount(
                            classItem
                        )
                    );

                },
                0
            );


        const activeCount =
            learners.filter(
                learner =>
                    getLearnerStatus(
                        learner
                    ) === "active"
            ).length;


        const inactiveCount =
            learners.filter(
                learner =>
                    getLearnerStatus(
                        learner
                    ) === "inactive"
            ).length;


        const learnersWithoutClassCount =
            calculateActiveLearnersWithoutClass(
                learners,
                classes
            );


        const completedCount =
            learners.filter(
                learner =>
                    getLearnerStatus(
                        learner
                    ) === "completed"
            ).length;


        const progressValues =
            learners
                .map(
                    learner =>
                        getLearnerProgress(
                            learner
                        )
                )
                .filter(
                    value =>
                        value !== null
                );


        const average =
            progressValues.length
                ? (
                    progressValues.reduce(
                        (
                            total,
                            value
                        ) =>
                            total + value,
                        0
                    ) /
                    progressValues.length
                )
                : null;


        const moduleAssignments =
            calculateModuleAssignments(
                learnerState
            );


        const awaitingGrade =
            calculateAwaitingGrade(
                learnerState
            );


        const activeLearnerAccounts =
            learnerAccounts.filter(
                account =>
                    normalizeStatus(
                        account?.status
                    ) === "active"
            ).length;


        const activeInstructorAccounts =
            instructorAccounts.filter(
                account =>
                    normalizeStatus(
                        account?.status
                    ) === "active"
            ).length;


        const emptyActiveClasses =
            activeClassRecords.filter(
                classItem =>
                    getClassEnrollmentCount(
                        classItem
                    ) === 0
            ).length;


        if (totalLearners) {
            totalLearners.textContent =
                learners.length;
        }


        if (learnerProgramSummary) {
            learnerProgramSummary.textContent =
                formatCount(
                    programSet.size,
                    "Program"
                );
        }


        if (totalClasses) {
            totalClasses.textContent =
                activeClassRecords.length;
        }


        if (classEnrollmentSummary) {
            classEnrollmentSummary.textContent =
                formatCount(
                    totalEnrollment,
                    "learner enrollment"
                );
        }


        if (totalInstructors) {
            totalInstructors.textContent =
                instructorMap.size;
        }


        if (instructorAccountSummary) {
            instructorAccountSummary.textContent =
                formatCount(
                    activeInstructorAccounts,
                    "active account"
                );
        }


        if (totalModuleAssignments) {
            totalModuleAssignments.textContent =
                moduleAssignments;
        }


        if (activeLearners) {
            activeLearners.textContent =
                activeCount;
        }


        if (inactiveLearners) {
            inactiveLearners.textContent =
                inactiveCount;
        }


        if (completedLearners) {
            completedLearners.textContent =
                completedCount;
        }


        if (averageProgress) {

            averageProgress.textContent =
                average === null
                    ? "—"
                    : `${Math.round(
                        average
                    )}%`;
        }


        if (queueLearnersWithoutClass) {
            queueLearnersWithoutClass.textContent =
                learnersWithoutClassCount;
        }


        if (queueAwaitingGrade) {
            queueAwaitingGrade.textContent =
                awaitingGrade;
        }


        if (queueEmptyClasses) {
            queueEmptyClasses.textContent =
                emptyActiveClasses;
        }


        if (dashboardUpdated) {

            dashboardUpdated.textContent =
                `Updated ${new Date().toLocaleTimeString(
                    "en-US",
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                )}`;
        }
    }


    /* =====================================================
       RENDER ACTIVE CLASSES
    ===================================================== */

    function renderActiveClasses(
        classes
    ) {

        if (!activeClassesList) {
            return;
        }


        const activeClasses =
            classes.filter(
                classItem =>
                    normalizeStatus(
                        classItem?.status
                    ) === "active"
            );


        if (
            activeClasses.length === 0
        ) {

            activeClassesList.innerHTML = `
                <div class="dashboard-empty-state">
                    No active classes are currently recorded.
                </div>
            `;

            return;
        }


        activeClasses.sort(
            (
                first,
                second
            ) =>
                String(
                    first?.classCode || ""
                ).localeCompare(
                    String(
                        second?.classCode || ""
                    )
                )
        );


        let html = `

            <div class="dashboard-class-header">

                <span>Class</span>

                <span>Course</span>

                <span>Instructor</span>

                <span>Learners</span>

            </div>

            <div class="dashboard-class-scroll">

        `;


        activeClasses.forEach(
            classItem => {

                const learnerCount =
                    getClassEnrollmentCount(
                        classItem
                    );


                const classId =
                    encodeURIComponent(
                        classItem?.id || ""
                    );


                html += `

                    <a
                        class="dashboard-class-row"
                        href="pages/class-details.html?id=${classId}"
                    >

                        <div class="dashboard-class-code">

                            <strong>
                                ${escapeHtml(
                                    classItem?.classCode ||
                                    "—"
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    classItem?.program ||
                                    ""
                                )}
                            </small>

                        </div>


                        <div class="dashboard-class-course">

                            <strong>
                                ${escapeHtml(
                                    classItem?.courseCode ||
                                    "—"
                                )}
                            </strong>

                            <span>
                                ${escapeHtml(
                                    classItem?.courseName ||
                                    "Unnamed Course"
                                )}
                            </span>

                        </div>


                        <div class="dashboard-class-instructor">

                            <span>
                                ${escapeHtml(
                                    classItem?.instructorName ||
                                    "Unassigned"
                                )}
                            </span>

                        </div>


                        <div class="dashboard-class-learners">

                            <strong>
                                ${learnerCount}
                            </strong>

                            <span>
                                ${
                                    learnerCount === 1
                                        ? "enrolled"
                                        : "enrolled"
                                }
                            </span>

                        </div>

                    </a>

                `;
            }
        );


        html += `
            </div>
        `;


        activeClassesList.innerHTML =
            html;
    }


    /* =====================================================
       RENDER RECENT ACCOUNT ACTIVITY
    ===================================================== */

    function renderRecentAccountActivity(
        learners,
        learnerAccounts,
        instructorAccounts
    ) {

        if (!recentAccountActivity) {
            return;
        }


        const learnerMap =
            new Map(
                learners.map(
                    learner => [
                        String(
                            learner?.id
                        ),
                        learner
                    ]
                )
            );


        const activities = [];


        learnerAccounts.forEach(
            account => {

                if (
                    !account?.createdAt
                ) {
                    return;
                }

                const learner =
                    learnerMap.get(
                        String(
                            account.learnerId
                        )
                    );


                activities.push({
                    type: "Learner Account",
                    name:
                        learner?.name ||
                        account?.email ||
                        "Unknown Learner",
                    email:
                        account?.email ||
                        "",
                    createdAt:
                        account.createdAt,
                    icon:
                        "user-plus"
                });

            }
        );


        instructorAccounts.forEach(
            account => {

                if (
                    !account?.createdAt
                ) {
                    return;
                }

                activities.push({
                    type: "Instructor Account",
                    name:
                        account?.name ||
                        account?.fullName ||
                        account?.email ||
                        "Unknown Instructor",
                    email:
                        account?.email ||
                        "",
                    createdAt:
                        account.createdAt,
                    icon:
                        "user-plus"
                });

            }
        );


        activities.sort(
            (
                first,
                second
            ) => {

                return (
                    new Date(
                        second.createdAt
                    ).getTime() -
                    new Date(
                        first.createdAt
                    ).getTime()
                );

            }
        );


        const recent =
            activities.slice(
                0,
                8
            );


        if (
            recent.length === 0
        ) {

            recentAccountActivity.innerHTML = `
                <div class="dashboard-empty-state">
                    No account creation activity has been recorded yet.
                </div>
            `;

            return;
        }


        recentAccountActivity.innerHTML =
            recent.map(
                activity => `

                    <div class="dashboard-activity-row">

                        <div class="dashboard-activity-icon">

                            <i data-lucide="${escapeHtml(
                                activity.icon
                            )}"></i>

                        </div>


                        <div class="dashboard-activity-content">

                            <strong>
                                Account Created
                            </strong>

                            <span>
                                ${escapeHtml(
                                    activity.name
                                )}
                            </span>

                            <small>
                                ${escapeHtml(
                                    activity.type
                                )}
                                ${
                                    activity.email
                                        ? ` · ${escapeHtml(
                                            activity.email
                                        )}`
                                        : ""
                                }
                            </small>

                        </div>


                        <time>
                            ${escapeHtml(
                                formatRelativeTime(
                                    activity.createdAt
                                )
                            )}
                        </time>

                    </div>

                `
            ).join("");
    }


    /* =====================================================
       STARTUP
    ===================================================== */

    function refreshDashboard() {

        const learnerState =
            loadLearnerState();

        const classes =
            loadClasses();

        const instructors =
            loadInstructors();

        const learnerAccounts =
            loadLearnerAccounts();

        const instructorAccounts =
            loadInstructorAccounts();


        const instructorMap =
            buildInstructorMap(
                instructors,
                classes
            );


        renderOverview(
            learnerState,
            classes,
            instructorMap,
            learnerAccounts,
            instructorAccounts
        );


        renderActiveClasses(
            classes
        );


        renderRecentAccountActivity(
            learnerState.learners,
            learnerAccounts,
            instructorAccounts
        );


        if (
            typeof refreshIcons ===
            "function"
        ) {
            refreshIcons();
        }
    }


    refreshDashboard();


    /*
        Refresh when returning to the tab so
        Dashboard reflects changes made in
        other pages.
    */

    window.addEventListener(
        "storage",
        refreshDashboard
    );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible"
            ) {

                refreshDashboard();
            }

        }
    );

})();