const CLASSES_STORAGE_KEY =
    "siknayan_academic_admin_classes";

const LEARNERS_STORAGE_KEY =
    "siknayan_academic_admin_learners";

const MODULE_LIBRARY_STORAGE_KEYS = [
    "siknayan_academic_admin_module_library_v3",
    "siknayan_academic_admin_module_library_v2"
];

let currentClass = null;
let allLearners = [];
let filteredLearners = [];


document.addEventListener(
    "DOMContentLoaded",
    initializeClassDetails
);


function initializeClassDetails() {

    const classId =
        new URLSearchParams(
            window.location.search
        ).get("id");

    if (!classId) {

        showClassNotFound(
            "No class was specified."
        );

        return;
    }


    const classes =
        loadClasses();


    currentClass =
        classes.find(
            item =>
                String(item.id) ===
                String(classId)
        );


    if (!currentClass) {

        showClassNotFound(
            "The requested class could not be found."
        );

        return;
    }


    currentClass.learnerIds =
        Array.isArray(
            currentClass.learnerIds
        )
            ? currentClass.learnerIds
            : [];


    currentClass.moduleIds =
        Array.isArray(
            currentClass.moduleIds
        )
            ? currentClass.moduleIds
            : [];


    allLearners =
        loadLearners();


    filteredLearners =
        getClassLearners();


    renderClassDetails();

    setupModuleSidebar();

    setupSearch();

    setupButtons();

    initializeIcons();
}


function loadClasses() {

    try {

        const parsed =
            JSON.parse(
                localStorage.getItem(
                    CLASSES_STORAGE_KEY
                ) || "[]"
            );


        if (!Array.isArray(parsed)) {

            return [];

        }


        return parsed.map(
            item => ({

                ...item,

                learnerIds:
                    Array.isArray(
                        item?.learnerIds
                    )
                        ? [
                            ...item.learnerIds
                        ]
                        : [],

                moduleIds:
                    Array.isArray(
                        item?.moduleIds
                    )
                        ? [
                            ...item.moduleIds
                        ]
                        : [],

                status:
                    normalizeStatus(
                        item?.status
                    )

            })
        );

    } catch (error) {

        console.error(
            "Unable to load classes:",
            error
        );

        return [];

    }
}


function saveClasses(
    classes
) {

    try {

        localStorage.setItem(
            CLASSES_STORAGE_KEY,
            JSON.stringify(classes)
        );

        return true;

    } catch (error) {

        console.error(
            "Unable to save classes:",
            error
        );

        return false;
    }
}


function loadLearners() {

    try {

        const parsed =
            JSON.parse(
                localStorage.getItem(
                    LEARNERS_STORAGE_KEY
                ) || "[]"
            );


        if (
            parsed &&
            Array.isArray(
                parsed.learners
            )
        ) {

            return parsed.learners;

        }


        if (Array.isArray(parsed)) {

            return parsed;

        }


        if (
            parsed &&
            typeof parsed === "object"
        ) {

            return Object.values(
                parsed
            ).filter(
                item =>
                    item &&
                    typeof item === "object" &&
                    (
                        item.id ||
                        item.studentId ||
                        item.studentID ||
                        item.learnerId
                    )
            );

        }

    } catch (error) {

        console.error(
            "Unable to load learner storage:",
            error
        );

    }

    return [];
}


function saveLearnerRecords(
    learners
) {

    try {

        const stored =
            localStorage.getItem(
                LEARNERS_STORAGE_KEY
            );


        if (!stored) {

            return false;

        }


        const parsed =
            JSON.parse(
                stored
            );


        /*
         * Current learner storage is an object
         * keyed by learner ID.
         */

        if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed) &&
            Array.isArray(parsed.learners)
        ) {

            const learnerMap =
                {};

            learners.forEach(
                learner => {

                    const id =
                        String(
                            getLearnerId(
                                learner
                            )
                        );


                    if (id) {

                        learnerMap[id] =
                            learner;

                    }

                }
            );


            parsed.learners =
                Object.values(
                    learnerMap
                );


            localStorage.setItem(
                LEARNERS_STORAGE_KEY,
                JSON.stringify(
                    parsed
                )
            );


            return true;

        }


        /*
         * Object keyed directly by learner ID.
         */

        if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {

            const learnerMap =
                {
                    ...parsed
                };


            learners.forEach(
                learner => {

                    const id =
                        String(
                            getLearnerId(
                                learner
                            )
                        );


                    if (id) {

                        learnerMap[id] =
                            learner;

                    }

                }
            );


            localStorage.setItem(
                LEARNERS_STORAGE_KEY,
                JSON.stringify(
                    learnerMap
                )
            );


            return true;

        }


        /*
         * Fallback for array-based storage.
         */

        if (
            Array.isArray(parsed)
        ) {

            localStorage.setItem(
                LEARNERS_STORAGE_KEY,
                JSON.stringify(
                    learners
                )
            );


            return true;

        }


    } catch (error) {

        console.error(
            "Unable to save learner records:",
            error
        );

    }


    return false;
}


function synchronizeClassModulesToLearners(
    classItem,
    previousModuleIds = []
) {

    if (!classItem) {

        return;

    }


    const learnerIds =
        Array.isArray(
            classItem.learnerIds
        )
            ? classItem.learnerIds.map(
                id => String(id)
            )
            : [];


    const currentModuleIds =
        Array.isArray(
            classItem.moduleIds
        )
            ? classItem.moduleIds.map(
                id => String(id)
            )
            : [];


    const previousIds =
        Array.isArray(
            previousModuleIds
        )
            ? previousModuleIds.map(
                id => String(id)
            )
            : [];


    const libraryModules =
        getModuleLibraryModules();


    /*
     * All classes are needed so that we don't
     * remove a module from a learner when
     * another class still assigns it.
     */

    const allClasses =
        loadClasses();


    const learners =
        loadLearners();


    const enrolledSet =
        new Set(
            learnerIds
        );


    learners.forEach(
        learner => {

            const learnerId =
                String(
                    getLearnerId(
                        learner
                    )
                );


            if (!learnerId) {

                return;

            }


            if (
                !Array.isArray(
                    learner.modules
                )
            ) {

                learner.modules =
                    [];

            }


            /*
             * -------------------------------------------------
             * LEARNER IS ENROLLED IN THIS CLASS
             * -------------------------------------------------
             */

            if (
                enrolledSet.has(
                    learnerId
                )
            ) {

                currentModuleIds.forEach(
                    moduleId => {

                        const libraryModule =
                            libraryModules.find(
                                module =>
                                    String(
                                        module.id
                                    ) ===
                                    moduleId
                            );


                        if (!libraryModule) {

                            return;

                        }


                        const moduleName =
                            getModuleTitle(
                                libraryModule
                            );


                        /*
                         * Match by moduleId first.
                         *
                         * For old prototype records,
                         * also match by module name so
                         * existing progress isn't duplicated.
                         */

                        let learnerModule =
                            learner.modules.find(
                                module =>
                                    String(
                                        module?.moduleId ||
                                        ""
                                    ) ===
                                    moduleId
                            );


                        if (
                            !learnerModule
                        ) {

                            learnerModule =
                                learner.modules.find(
                                    module =>
                                        !module?.moduleId &&
                                        String(
                                            module?.name ||
                                            ""
                                        )
                                            .trim()
                                            .toLowerCase() ===
                                        moduleName
                                            .trim()
                                            .toLowerCase()
                                );

                        }


                        if (
                            learnerModule
                        ) {

                            /*
                             * Existing progress is preserved.
                             */

                            learnerModule.moduleId =
                                moduleId;

                            learnerModule.classId =
                                classItem.id;

                            learnerModule.name =
                                moduleName;

                            learnerModule.category =
                                libraryModule.programCode ||
                                classItem.program ||
                                learnerModule.category ||
                                "";

                            return;

                        }


                        /*
                         * New assignment.
                         */

                        learner.modules.push({

                            moduleId,

                            classId:
                                classItem.id,

                            name:
                                moduleName,

                            category:
                                libraryModule.programCode ||
                                classItem.program ||
                                "",

                            state:
                                "not-started"

                        });

                    }
                );

            }


            /*
             * -------------------------------------------------
             * REMOVE MODULES NO LONGER PROVIDED BY THIS CLASS
             * -------------------------------------------------
             *
             * Only remove a module if:
             *
             * 1. It was previously assigned by this class
             * 2. It is no longer assigned by this class
             * 3. No other class of this learner assigns it
             *
             * Existing progress is therefore protected.
             */

            const removedModuleIds =
                previousIds.filter(
                    id =>
                        !currentModuleIds.includes(
                            id
                        )
                );


            removedModuleIds.forEach(
                moduleId => {

                    const usedElsewhere =
                        allClasses.some(
                            otherClass => {

                                if (
                                    String(
                                        otherClass.id
                                    ) ===
                                    String(
                                        classItem.id
                                    )
                                ) {

                                    return false;

                                }


                                const otherLearnerIds =
                                    Array.isArray(
                                        otherClass.learnerIds
                                    )
                                        ? otherClass.learnerIds
                                            .map(
                                                id =>
                                                    String(id)
                                            )
                                        : [];


                                const otherModuleIds =
                                    Array.isArray(
                                        otherClass.moduleIds
                                    )
                                        ? otherClass.moduleIds
                                            .map(
                                                id =>
                                                    String(id)
                                            )
                                        : [];


                                return (
                                    otherLearnerIds.includes(
                                        learnerId
                                    ) &&
                                    otherModuleIds.includes(
                                        moduleId
                                    )
                                );

                            }
                        );


                    if (
                        usedElsewhere
                    ) {

                        return;

                    }


                    learner.modules =
                        learner.modules.filter(
                            module => {

                                const moduleIdMatches =
                                    String(
                                        module?.moduleId ||
                                        ""
                                    ) ===
                                    moduleId;


                                const legacyNameMatches =
                                    !module?.moduleId &&
                                    libraryModules.some(
                                        libraryModule =>
                                            String(
                                                libraryModule?.id ||
                                                ""
                                            ) ===
                                            moduleId &&
                                            String(
                                                getModuleTitle(
                                                    libraryModule
                                                )
                                            )
                                                .trim()
                                                .toLowerCase() ===
                                            String(
                                                module?.name ||
                                                ""
                                            )
                                                .trim()
                                                .toLowerCase()
                                    );


                                return !(
                                    moduleIdMatches ||
                                    legacyNameMatches
                                );

                            }
                        );

                }
            );


            /*
             * Update the derived assigned count.
             *
             * This preserves the existing prototype
             * progress value.
             */

            learner.modulesAssigned =
                Array.isArray(
                    learner.modules
                )
                    ? learner.modules.length
                    : 0;

        }
    );


    if (
        !saveLearnerRecords(
            learners
        )
    ) {

        console.error(
            "Class module synchronization failed."
        );

        return false;

    }


    allLearners =
        learners;


    return true;
}


function renderClassDetails() {

    setText(
        "classDetailsTitle",
        currentClass.classCode ||
        "Class Details"
    );


    setText(
        "classDetailsCourse",
        currentClass.courseName ||
        "—"
    );


    setText(
        "classDetailsCode",
        currentClass.classCode ||
        "—"
    );


    setText(
        "classDetailsProgram",
        currentClass.program ||
        "—"
    );


    setText(
        "classDetailsCourseCode",
        currentClass.courseCode ||
        "—"
    );


    setText(
        "classDetailsInstructor",
        currentClass.instructorName ||
        "Unassigned"
    );


    const status =
        document.getElementById(
            "classDetailsStatus"
        );


    if (status) {

        const value =
            normalizeStatus(
                currentClass.status
            );


        status.textContent =
            formatStatus(value);


        status.classList.remove(
            "active",
            "inactive"
        );


        status.classList.add(
            value
        );
    }


    filteredLearners =
        getClassLearners();


    renderLearnerRoster();

    renderAssignedModules();
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }
}


function getClassLearners() {

    if (!currentClass) {

        return [];

    }


    const ids =
        new Set(
            (
                currentClass.learnerIds ||
                []
            ).map(String)
        );


    return allLearners.filter(
        learner =>
            ids.has(
                String(
                    getLearnerId(
                        learner
                    )
                )
            )
    );
}


function getEligibleLearners() {

    if (!currentClass) {

        return [];

    }


    const program =
        String(
            currentClass.program ||
            ""
        )
            .trim()
            .toUpperCase();


    return allLearners.filter(
        learner =>
            String(
                learner?.program ||
                ""
            )
                .trim()
                .toUpperCase() ===
            program
    );
}


function getLearnerId(
    learner
) {

    return (
        learner?.id ??
        learner?.studentId ??
        learner?.studentID ??
        learner?.learnerId ??
        ""
    );
}


function getLearnerName(
    learner
) {

    if (learner?.name) {

        return learner.name;

    }


    if (learner?.fullName) {

        return learner.fullName;

    }


    return (
        `${learner?.firstName || ""} ${
            learner?.lastName || ""
        }`.trim() ||
        "Unnamed Learner"
    );
}


function getLearnerStatus(
    learner
) {

    const value =
        String(
            learner?.status ||
            "ACTIVE"
        )
            .trim()
            .toUpperCase();


    if (
        value ===
        "COMPLETED"
    ) {

        return "completed";

    }


    if (
        value ===
        "INACTIVE"
    ) {

        return "inactive";

    }


    return "active";
}


function renderLearnerRoster() {

    const body =
        document.getElementById(
            "classRosterBody"
        );


    const empty =
        document.getElementById(
            "classRosterEmpty"
        );


    const count =
        document.getElementById(
            "classRosterCount"
        );


    if (!body) {

        return;

    }


    body.innerHTML =
        "";


    const total =
        filteredLearners.length;


    if (count) {

        count.textContent =
            `${total} ${
                total === 1
                    ? "Learner"
                    : "Learners"
            }`;

    }


    if (!total) {

        if (empty) {

            empty.hidden =
                false;

        }

        return;
    }


    if (empty) {

        empty.hidden =
            true;

    }


    filteredLearners.forEach(
        learner => {

            const row =
                document.createElement(
                    "tr"
                );


            const status =
                getLearnerStatus(
                    learner
                );


            row.innerHTML = `
                <td>
                    ${escapeHtml(
                        getLearnerId(
                            learner
                        ) || "—"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getLearnerName(
                            learner
                        )
                    )}
                </td>

                <td>
                    <span
                        class="class-roster-status ${status}"
                    >
                        ${escapeHtml(
                            formatLearnerStatus(
                                status
                            )
                        )}
                    </span>
                </td>
            `;


            body.appendChild(
                row
            );

        }
    );


    initializeIcons();
}


function setupSearch() {

    const input =
        document.getElementById(
            "classRosterSearch"
        );


    if (!input) {

        return;

    }


    input.addEventListener(
        "input",
        () => {

            const query =
                input.value
                    .trim()
                    .toLowerCase();


            const learners =
                getClassLearners();


            filteredLearners =
                !query
                    ? learners
                    : learners.filter(
                        learner => {

                            const id =
                                String(
                                    getLearnerId(
                                        learner
                                    )
                                )
                                    .toLowerCase();


                            const name =
                                getLearnerName(
                                    learner
                                )
                                    .toLowerCase();


                            return (
                                id.includes(
                                    query
                                ) ||
                                name.includes(
                                    query
                                )
                            );

                        }
                    );


            renderLearnerRoster();

        }
    );
}


function setupButtons() {

    const edit =
        document.getElementById(
            "editClassButton"
        );


    const learners =
        document.getElementById(
            "manageLearnersButton"
        );


    if (edit) {

        edit.addEventListener(
            "click",
            () => {

                window.location.href =
                    `classes.html?edit=${encodeURIComponent(
                        currentClass.id
                    )}`;

            }
        );

    }


    if (learners) {

        learners.addEventListener(
            "click",
            openManageLearnersModal
        );

    }
}


/* =========================================================
   MODULE LIBRARY
========================================================= */


function getModuleLibraryProgram() {

    const data =
        window.SiknayanModuleLibraryData;


    if (
        data &&
        typeof data.getProgram ===
            "function"
    ) {

        const program =
            data.getProgram(
                currentClass?.program
            );


        if (program) {

            return program;

        }

    }


    return getModuleLibraryProgramFromStorage();
}


function getModuleLibraryProgramFromStorage() {

    const wanted =
        String(
            currentClass?.program ||
            ""
        )
            .trim()
            .toUpperCase();


    for (
        const key of
        MODULE_LIBRARY_STORAGE_KEYS
    ) {

        try {

            const stored =
                localStorage.getItem(
                    key
                );


            if (!stored) {

                continue;

            }


            const parsed =
                JSON.parse(
                    stored
                );


            let programs =
                [];


            if (
                parsed &&
                Array.isArray(
                    parsed.programs
                )
            ) {

                programs =
                    parsed.programs;

            } else if (
                Array.isArray(
                    parsed
                )
            ) {

                programs =
                    parsed;

            } else if (
                parsed &&
                typeof parsed ===
                    "object"
            ) {

                programs =
                    Object.values(
                        parsed
                    ).filter(
                        value =>
                            value &&
                            typeof value ===
                                "object"
                    );

            }


            const program =
                programs.find(
                    item =>
                        String(
                            item?.code ||
                            item?.programCode ||
                            item?.id ||
                            ""
                        )
                            .trim()
                            .toUpperCase() ===
                        wanted
                );


            if (program) {

                return program;

            }

        } catch (error) {

            console.warn(
                "Unable to read Module Library storage:",
                error
            );

        }
    }


    return null;
}


function getLibraryCourses(
    program
) {

    if (!program) {

        return [];

    }


    if (
        Array.isArray(
            program.courses
        )
    ) {

        return program.courses;

    }


    if (
        program.courses &&
        typeof program.courses ===
            "object"
    ) {

        return Object.values(
            program.courses
        );

    }


    return [];
}


function getLibraryModules(
    program
) {

    if (!program) {

        return [];

    }


    if (
        Array.isArray(
            program.modules
        )
    ) {

        return program.modules;

    }


    if (
        program.modules &&
        typeof program.modules ===
            "object"
    ) {

        return Object.values(
            program.modules
        );

    }


    return [];
}


function getModuleLibraryCourse() {

    const program =
        getModuleLibraryProgram();


    if (!program) {

        return null;

    }


    const courses =
        getLibraryCourses(
            program
        );


    const wantedCode =
        String(
            currentClass?.courseCode ||
            ""
        )
            .trim()
            .toUpperCase();


    const wantedName =
        String(
            currentClass?.courseName ||
            ""
        )
            .trim()
            .toLowerCase();


    return (
        courses.find(
            course =>
                String(
                    course?.code ||
                    ""
                )
                    .trim()
                    .toUpperCase() ===
                wantedCode
        )
    ) || (
        courses.find(
            course =>
                String(
                    course?.name ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                wantedName
        )
    ) || null;
}


function getModuleLibraryModules() {

    const data =
        window.SiknayanModuleLibraryData;

    if (
        !data ||
        typeof data.getPrograms !==
            "function"
    ) {

        return [];

    }


    const programs =
        data.getPrograms();


    if (
        !Array.isArray(programs)
    ) {

        return [];

    }


    const modules = [];


    programs.forEach(
        program => {

            const programCode =
                String(
                    program?.code ||
                    ""
                ).trim();


            if (!programCode) {

                return;

            }


            const courses =
                getLibraryCourses(
                    program
                );


            const programModules =
                getLibraryModules(
                    program
                );


            programModules.forEach(
                module => {

                    const moduleId =
                        String(
                            module?.id ||
                            ""
                        ).trim();


                    if (!moduleId) {

                        return;

                    }


                    const courseId =
                        String(
                            module?.courseId ||
                            ""
                        ).trim();


                    const course =
                        courses.find(
                            item =>
                                String(
                                    item?.id ||
                                    ""
                                ).trim() ===
                                courseId
                        );


                    modules.push({

                        ...module,

                        programCode,

                        programName:
                            String(
                                program?.name ||
                                programCode
                            ).trim(),

                        courseId,

                        courseCode:
                            String(
                                course?.code ||
                                ""
                            ).trim(),

                        courseName:
                            String(
                                course?.name ||
                                ""
                            ).trim()

                    });

                }
            );

        }
    );


    return modules;
}


function getModuleTitle(
    module
) {

    return (
        module?.title ||
        module?.name ||
        "Untitled Module"
    );
}


function getModuleStatus(
    module
) {

    return String(
        module?.status ||
        "active"
    )
        .trim()
        .toLowerCase();
}


function formatModuleStatus(
    status
) {

    const value =
        String(
            status ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        value ===
        "archived"
    ) {

        return "Archived";

    }


    if (
        value ===
        "inactive"
    ) {

        return "Inactive";

    }


    return "Active";
}


function getAssignedClassModules() {

    const availableModules =
        getModuleLibraryModules();


    const assignedIds =
        new Set(

            (
                Array.isArray(
                    currentClass?.moduleIds
                )
                    ? currentClass.moduleIds
                    : []
            ).map(
                id => String(id)
            )

        );


    return availableModules.filter(
        module =>
            assignedIds.has(
                String(
                    module?.id ||
                    ""
                )
            )
    );
}


function renderAssignedModules() {

    const list =
        document.getElementById(
            "classAssignedModuleList"
        );


    const empty =
        document.getElementById(
            "classAssignedModulesEmpty"
        );


    const count =
        document.getElementById(
            "classAssignedModuleCount"
        );


    if (!list) {

        return;

    }


    const modules =
        getAssignedClassModules();


    list.innerHTML =
        "";


    if (count) {

        count.textContent =
            `${modules.length} ${
                modules.length === 1
                    ? "Module"
                    : "Modules"
            }`;

    }


    if (!modules.length) {

        if (empty) {

            empty.hidden =
                false;

        }


        initializeIcons();

        return;
    }


    if (empty) {

        empty.hidden =
            true;

    }


    modules.forEach(
        module => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "class-assigned-module-item";


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "class-assigned-module-info";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                getModuleTitle(
                    module
                );


            const status =
                document.createElement(
                    "span"
                );


            status.textContent =
                formatModuleStatus(
                    getModuleStatus(
                        module
                    )
                );


            info.append(
                title,
                status
            );


            item.appendChild(
                info
            );


            list.appendChild(
                item
            );

        }
    );


    initializeIcons();
}


/* =========================================================
   PERMANENT RIGHT MODULE SIDEBAR
========================================================= */


function setupModuleSidebar() {

    const sidebar =
        document.getElementById(
            "classModulesSidebar"
        );


    if (
        !sidebar ||
        !currentClass
    ) {

        return;

    }


    const courseLabel =
        currentClass.courseCode ||
        currentClass.courseName ||
        "this course";


    const classLabel =
        currentClass.classCode ||
        "this class";


    const courseText =
        document.getElementById(
            "classModulesSidebarCourse"
        );


    if (courseText) {

        courseText.textContent =
            `${classLabel} · ${courseLabel}`;

    }


    const modules =
        getModuleLibraryModules();


    const selectedIds =
        new Set(
            (
                currentClass.moduleIds ||
                []
            ).map(String)
        );


    const search =
        document.getElementById(
            "manageModuleSearch"
        );


    const selectAll =
        document.getElementById(
            "manageModuleSelectAll"
        );


    const save =
        document.getElementById(
            "manageModulesSave"
        );


    const reset =
        document.getElementById(
            "manageModulesCancel"
        );


    sidebar.hidden =
        false;


    sidebar.setAttribute(
        "aria-hidden",
        "false"
    );


    let filterBar =
        sidebar.querySelector(
            "#manageModuleFilters"
        );


    if (!filterBar) {

        filterBar =
            document.createElement(
                "div"
            );


        filterBar.id =
            "manageModuleFilters";


        filterBar.style.display =
            "grid";


        filterBar.style.gridTemplateColumns =
            "1fr";


        filterBar.style.gap =
            "8px";


        filterBar.style.marginBottom =
            "12px";


        const searchBlock =
            sidebar.querySelector(
                ".class-modules-sidebar-search"
            );


        if (searchBlock) {

            searchBlock.after(
                filterBar
            );

        } else {

            const body =
                sidebar.querySelector(
                    ".class-modules-sidebar-body"
                );


            body?.prepend(
                filterBar
            );

        }

    }


    filterBar.innerHTML = `

        <div>

            <label
                for="manageModuleProgramFilter"
                style="
                    display:block;
                    font-size:12px;
                    font-weight:600;
                    margin-bottom:5px;
                "
            >
                Program
            </label>

            <select
                id="manageModuleProgramFilter"
                class="form-select"
                style="width:100%;"
            ></select>

        </div>


        <div>

            <label
                for="manageModuleCourseFilter"
                style="
                    display:block;
                    font-size:12px;
                    font-weight:600;
                    margin-bottom:5px;
                "
            >
                Course
            </label>

            <select
                id="manageModuleCourseFilter"
                class="form-select"
                style="width:100%;"
            ></select>

        </div>

    `;


    const programFilter =
        filterBar.querySelector(
            "#manageModuleProgramFilter"
        );


    const courseFilter =
        filterBar.querySelector(
            "#manageModuleCourseFilter"
        );


    populateManageModuleProgramFilter(
        programFilter,
        modules,
        currentClass.program
    );


    populateManageModuleCourseFilter(
        courseFilter,
        modules,
        programFilter.value,
        currentClass.courseCode
    );


    function renderFilteredModules() {

        const query =
            search
                ? search.value
                : "";


        const selectedProgram =
            programFilter?.value ||
            "all";


        const selectedCourse =
            courseFilter?.value ||
            "all";


        let filtered =
            filterModules(
                modules,
                query
            );


        filtered =
            filtered.filter(
                module => {

                    const matchesProgram =
                        selectedProgram ===
                            "all" ||
                        String(
                            module?.programCode ||
                            ""
                        ).toUpperCase() ===
                            String(
                                selectedProgram
                            ).toUpperCase();


                    const matchesCourse =
                        selectedCourse ===
                            "all" ||
                        String(
                            module?.courseCode ||
                            ""
                        ).toUpperCase() ===
                            String(
                                selectedCourse
                            ).toUpperCase();


                    return (
                        matchesProgram &&
                        matchesCourse
                    );

                }
            );


        filtered.sort(
            (a, b) => {

                const aRecommended =
                    String(
                        a?.programCode ||
                        ""
                    ).toUpperCase() ===
                        String(
                            currentClass.program ||
                            ""
                        ).toUpperCase() &&
                    String(
                        a?.courseCode ||
                        ""
                    ).toUpperCase() ===
                        String(
                            currentClass.courseCode ||
                            ""
                        ).toUpperCase();


                const bRecommended =
                    String(
                        b?.programCode ||
                        ""
                    ).toUpperCase() ===
                        String(
                            currentClass.program ||
                            ""
                        ).toUpperCase() &&
                    String(
                        b?.courseCode ||
                        ""
                    ).toUpperCase() ===
                        String(
                            currentClass.courseCode ||
                            ""
                        ).toUpperCase();


                if (
                    aRecommended &&
                    !bRecommended
                ) {

                    return -1;

                }


                if (
                    !aRecommended &&
                    bRecommended
                ) {

                    return 1;

                }


                return getModuleTitle(
                    a
                ).localeCompare(
                    getModuleTitle(
                        b
                    )
                );

            }
        );


        renderManageModuleList(
            sidebar,
            filtered,
            selectedIds
        );

    }


    if (search) {

        search.oninput =
            renderFilteredModules;

    }


    if (programFilter) {

        programFilter.onchange =
            () => {

                populateManageModuleCourseFilter(
                    courseFilter,
                    modules,
                    programFilter.value,
                    ""
                );


                renderFilteredModules();

            };

    }


    if (courseFilter) {

        courseFilter.onchange =
            renderFilteredModules;

    }


    if (selectAll) {

        selectAll.onchange =
            () => {

                sidebar
                    .querySelectorAll(
                        ".manage-module-checkbox"
                    )
                    .forEach(
                        checkbox => {

                            const id =
                                String(
                                    checkbox.value
                                );


                            checkbox.checked =
                                selectAll.checked;


                            if (
                                selectAll.checked
                            ) {

                                selectedIds.add(
                                    id
                                );

                            } else {

                                selectedIds.delete(
                                    id
                                );

                            }

                        }
                    );


                updateManageModuleSelectionState(
                    sidebar,
                    selectedIds
                );

            };

    }


    if (reset) {

        reset.onclick =
            () => {

                selectedIds.clear();


                (
                    currentClass.moduleIds ||
                    []
                ).forEach(
                    id =>
                        selectedIds.add(
                            String(id)
                        )
                );


                if (search) {

                    search.value =
                        "";

                }


                populateManageModuleProgramFilter(
                    programFilter,
                    modules,
                    currentClass.program
                );


                populateManageModuleCourseFilter(
                    courseFilter,
                    modules,
                    programFilter.value,
                    currentClass.courseCode
                );


                renderFilteredModules();

            };

    }


    if (save) {

        save.onclick =
            () =>
                saveManagedModules(
                    selectedIds
                );

    }


    renderFilteredModules();

    initializeIcons();
}


function populateManageModuleProgramFilter(
    select,
    modules,
    selectedProgram
) {

    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="all">
            All Programs
        </option>

    `;


    const programs =
        new Map();


    modules.forEach(
        module => {

            const code =
                String(
                    module?.programCode ||
                    ""
                ).trim();


            if (!code) {

                return;

            }


            const key =
                code.toUpperCase();


            if (
                !programs.has(
                    key
                )
            ) {

                programs.set(
                    key,
                    {
                        code,

                        name:
                            String(
                                module?.programName ||
                                code
                            ).trim()
                    }
                );

            }

        }
    );


    Array.from(
        programs.values()
    )
        .sort(
            (a, b) =>
                a.code.localeCompare(
                    b.code
                )
        )
        .forEach(
            program => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    program.code;


                option.textContent =
                    program.code;


                select.appendChild(
                    option
                );

            }
        );


    const wanted =
        String(
            selectedProgram ||
            ""
        ).trim();


    const matchingOption =
        Array.from(
            select.options
        ).find(
            option =>
                option.value.toUpperCase() ===
                wanted.toUpperCase()
        );


    select.value =
        matchingOption
            ? matchingOption.value
            : "all";
}


function populateManageModuleCourseFilter(
    select,
    modules,
    selectedProgram,
    selectedCourse
) {

    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="all">
            All Courses
        </option>

    `;


    const courses =
        new Map();


    modules.forEach(
        module => {

            const programCode =
                String(
                    module?.programCode ||
                    ""
                ).trim();


            if (
                selectedProgram !==
                    "all" &&
                programCode.toUpperCase() !==
                    String(
                        selectedProgram
                    ).toUpperCase()
            ) {

                return;

            }


            const courseCode =
                String(
                    module?.courseCode ||
                    ""
                ).trim();


            if (!courseCode) {

                return;

            }


            const key =
                courseCode.toUpperCase();


            if (
                !courses.has(
                    key
                )
            ) {

                courses.set(
                    key,
                    {
                        code:
                            courseCode,

                        name:
                            String(
                                module?.courseName ||
                                courseCode
                            ).trim()
                    }
                );

            }

        }
    );


    Array.from(
        courses.values()
    )
        .sort(
            (a, b) =>
                a.code.localeCompare(
                    b.code
                )
        )
        .forEach(
            course => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    course.code;


                option.textContent =
                    course.name &&
                    course.name !==
                        course.code
                        ? `${course.name} (${course.code})`
                        : course.code;


                select.appendChild(
                    option
                );

            }
        );


    const wanted =
        String(
            selectedCourse ||
            ""
        ).trim();


    const matchingOption =
        Array.from(
            select.options
        ).find(
            option =>
                option.value.toUpperCase() ===
                wanted.toUpperCase()
        );


    select.value =
        matchingOption
            ? matchingOption.value
            : "all";
}


function filterModules(
    modules,
    query
) {

    const value =
        String(
            query ||
            ""
        )
            .trim()
            .toLowerCase();


    if (!value) {

        return modules;

    }


    return modules.filter(
        module => {

            const title =
                getModuleTitle(
                    module
                )
                    .toLowerCase();


            const program =
                String(
                    module?.programCode ||
                    module?.programName ||
                    ""
                )
                    .toLowerCase();


            const course =
                String(
                    module?.courseCode ||
                    module?.courseName ||
                    ""
                )
                    .toLowerCase();


            return (
                title.includes(
                    value
                ) ||
                program.includes(
                    value
                ) ||
                course.includes(
                    value
                )
            );

        }
    );
}


function renderManageModuleList(
    container,
    modules,
    selectedIds
) {

    const list =
        container.querySelector(
            "#manageModuleList"
        );


    const noResults =
        container.querySelector(
            "#manageModuleNoResults"
        );


    if (!list) {

        return;

    }


    list.innerHTML =
        "";


    if (!modules.length) {

        if (noResults) {

            noResults.hidden =
                false;

        }


        updateManageModuleSelectionState(
            container,
            selectedIds
        );


        return;
    }


    if (noResults) {

        noResults.hidden =
            true;

    }


    modules.forEach(
        module => {

            const moduleId =
                String(
                    module?.id ||
                    ""
                );


            if (!moduleId) {

                return;

            }


            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "manage-module-item";


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";


            checkbox.className =
                "manage-module-checkbox";


            checkbox.value =
                moduleId;


            checkbox.checked =
                selectedIds.has(
                    moduleId
                );


            checkbox.addEventListener(
                "change",
                () => {

                    if (
                        checkbox.checked
                    ) {

                        selectedIds.add(
                            moduleId
                        );

                    } else {

                        selectedIds.delete(
                            moduleId
                        );

                    }


                    updateManageModuleSelectionState(
                        container,
                        selectedIds
                    );

                }
            );


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "manage-module-info";


            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                getModuleTitle(
                    module
                );


            const meta =
                document.createElement(
                    "span"
                );


            const programLabel =
                String(
                    module?.programCode ||
                    ""
                ).trim();


            const courseLabel =
                String(
                    module?.courseCode ||
                    ""
                ).trim();


            const statusLabel =
                formatModuleStatus(
                    getModuleStatus(
                        module
                    )
                );


            meta.textContent =
                [
                    programLabel,
                    courseLabel,
                    statusLabel
                ]
                    .filter(Boolean)
                    .join(" · ");


            info.append(
                title,
                meta
            );


            row.append(
                checkbox,
                info
            );


            list.appendChild(
                row
            );

        }
    );


    updateManageModuleSelectionState(
        container,
        selectedIds
    );
}


function updateManageModuleSelectionState(
    container,
    selectedIds
) {

    const count =
        container.querySelector(
            "#manageModuleSelectedCount"
        );


    if (count) {

        count.textContent =
            `${selectedIds.size} selected`;

    }


    const selectAll =
        container.querySelector(
            "#manageModuleSelectAll"
        );


    if (!selectAll) {

        return;

    }


    const boxes =
        Array.from(
            container.querySelectorAll(
                ".manage-module-checkbox"
            )
        );


    if (!boxes.length) {

        selectAll.checked =
            false;

        selectAll.indeterminate =
            false;

        return;

    }


    const checked =
        boxes.filter(
            box =>
                box.checked
        ).length;


    selectAll.checked =
        checked ===
        boxes.length;


    selectAll.indeterminate =
        checked > 0 &&
        checked <
            boxes.length;
}


function saveManagedModules(selectedIds) {

    if (!currentClass) {
        alert(
            "Unable to save module assignments because no class is selected."
        );
        return;
    }


    const newModuleIds =
        Array.from(
            selectedIds
        ).map(
            id => String(id)
        );


    const classes =
        loadClasses();


    const index =
        classes.findIndex(
            classItem =>
                String(
                    classItem.id
                ) ===
                String(
                    currentClass.id
                )
        );


    if (
        index ===
        -1
    ) {
        alert(
            "Unable to save module assignments because the class could not be found."
        );
        return;
    }


    /*
     * Keep the old assignment list so we can
     * synchronize learner module assignments later.
     */
    const previousModuleIds =
        Array.isArray(
            classes[index].moduleIds
        )
            ? [
                ...classes[index].moduleIds
            ]
            : [];


    /*
     * Save the new module assignment list
     * directly to the class record.
     */
    classes[index] = {
        ...classes[index],

        moduleIds:
            newModuleIds
    };


    /*
     * Persist the updated class list.
     */
    const saved =
        saveClasses(
            classes
        );


    if (!saved) {
        alert(
            "Unable to save module assignments."
        );
        return;
    }


    /*
     * Update the page's current class object
     * immediately.
     */
    currentClass = {
        ...currentClass,

        moduleIds:
            newModuleIds
    };


    /*
     * Re-render the Assigned Modules section.
     *
     * This should immediately change:
     * 3 Modules -> 2 Modules
     */
    renderAssignedModules();


    /*
     * Refresh the sidebar so its checkboxes
     * reflect the newly saved state.
     */
    setupModuleSidebar();


    initializeIcons();


    /*
     * Debug confirmation.
     * We can remove this after testing.
     */
    console.log(
        "Module assignments saved:",
        {
            classId:
                currentClass.id,

            previousModuleIds,

            newModuleIds
        }
    );
}   


/* =========================================================
   MANAGE LEARNERS
========================================================= */


function openManageLearnersModal() {

    if (!currentClass) {

        return;

    }


    const eligible =
        getEligibleLearners();


    const selectedIds =
        new Set(
            (
                currentClass.learnerIds ||
                []
            ).map(String)
        );


    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "modal-overlay active";


    overlay.id =
        "manageLearnersModal";


    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    overlay.innerHTML = `
        <div
            class="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manageLearnersTitle"
        >

            <div class="modal-header">

                <h3 id="manageLearnersTitle">
                    Manage Learners
                </h3>

                <p>
                    Assign learners to
                    <strong>
                        ${escapeHtml(
                            currentClass.classCode ||
                            "this class"
                        )}
                    </strong>.

                    Only learners from
                    <strong>
                        ${escapeHtml(
                            currentClass.program ||
                            "this program"
                        )}
                    </strong>
                    are shown.
                </p>

            </div>


            <div class="form-group">

                <label
                    for="manageLearnerSearch"
                >
                    Search Learners
                </label>

                <input
                    type="text"
                    id="manageLearnerSearch"
                    class="form-input"
                    placeholder="Search by student ID or name..."
                    autocomplete="off"
                >

            </div>


            <div
                class="manage-learners-toolbar"
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:10px 0;
                    margin-bottom:8px;
                    border-bottom:1px solid #d8d8d8;
                "
            >

                <label
                    style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        cursor:pointer;
                        font-weight:600;
                    "
                >

                    <input
                        type="checkbox"
                        id="manageLearnerSelectAll"
                    >

                    <span>
                        Select All
                    </span>

                </label>


                <span
                    id="manageLearnerSelectedCount"
                    style="
                        color:#6b7280;
                        font-size:13px;
                    "
                >
                    ${selectedIds.size} selected
                </span>

            </div>


            <div
                id="manageLearnerList"
                style="
                    max-height:340px;
                    overflow-y:auto;
                    border:1px solid #d8d8d8;
                    border-radius:10px;
                "
            ></div>


            <div
                id="manageLearnerNoResults"
                style="
                    display:none;
                    padding:32px 20px;
                    text-align:center;
                    color:#6b7280;
                "
            >

                <div
                    style="
                        font-size:18px;
                        font-weight:700;
                        margin-bottom:6px;
                    "
                >
                    No eligible learners found
                </div>

                <div
                    style="
                        font-size:13px;
                    "
                >
                    There are no learners in this program
                    matching your search.
                </div>

            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="modal-button cancel"
                    id="manageLearnersCancel"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="modal-button primary"
                    id="manageLearnersSave"
                >
                    Save Learners
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    renderManageLearnerList(
        overlay,
        eligible,
        selectedIds
    );


    const search =
        overlay.querySelector(
            "#manageLearnerSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            () => {

                const q =
                    search.value
                        .trim()
                        .toLowerCase();


                const filtered =
                    eligible.filter(
                        learner => {

                            const id =
                                String(
                                    getLearnerId(
                                        learner
                                    )
                                )
                                    .toLowerCase();


                            const name =
                                getLearnerName(
                                    learner
                                )
                                    .toLowerCase();


                            return (
                                !q ||
                                id.includes(
                                    q
                                ) ||
                                name.includes(
                                    q
                                )
                            );

                        }
                    );


                renderManageLearnerList(
                    overlay,
                    filtered,
                    selectedIds
                );

            }
        );

    }


    const selectAll =
        overlay.querySelector(
            "#manageLearnerSelectAll"
        );


    if (selectAll) {

        selectAll.addEventListener(
            "change",
            () => {

                overlay
                    .querySelectorAll(
                        ".manage-learner-checkbox"
                    )
                    .forEach(
                        box => {

                            const id =
                                String(
                                    box.value
                                );


                            box.checked =
                                selectAll.checked;


                            if (
                                selectAll.checked
                            ) {

                                selectedIds.add(
                                    id
                                );

                            } else {

                                selectedIds.delete(
                                    id
                                );

                            }

                        }
                    );


                updateManageLearnerSelectionState(
                    overlay,
                    selectedIds
                );

            }
        );

    }


    overlay
        .querySelector(
            "#manageLearnersCancel"
        )
        ?.addEventListener(
            "click",
            () =>
                closeManageLearnersModal(
                    overlay
                )
        );


    overlay
        .querySelector(
            "#manageLearnersSave"
        )
        ?.addEventListener(
            "click",
            () =>
                saveManagedLearners(
                    overlay,
                    selectedIds
                )
        );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeManageLearnersModal(
                    overlay
                );

            }

        }
    );


    const escape =
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeManageLearnersModal(
                    overlay
                );

            }

        };


    overlay._learnerEscapeHandler =
        escape;


    document.addEventListener(
        "keydown",
        escape
    );


    initializeIcons();
}


function renderManageLearnerList(
    overlay,
    learners,
    selectedIds
) {

    const list =
        overlay.querySelector(
            "#manageLearnerList"
        );


    const noResults =
        overlay.querySelector(
            "#manageLearnerNoResults"
        );


    if (!list) {

        return;

    }


    list.innerHTML =
        "";


    if (!learners.length) {

        if (noResults) {

            noResults.style.display =
                "block";

        }


        updateManageLearnerSelectionState(
            overlay,
            selectedIds
        );


        return;
    }


    if (noResults) {

        noResults.style.display =
            "none";

    }


    learners.forEach(
        learner => {

            const id =
                String(
                    getLearnerId(
                        learner
                    )
                );


            const row =
                document.createElement(
                    "label"
                );


            row.className =
                "manage-learner-row";


            row.style.cssText =
                "display:flex;align-items:center;gap:12px;padding:13px 15px;border-bottom:1px solid #eeeeee;cursor:pointer;";


            row.innerHTML = `
                <input
                    type="checkbox"
                    class="manage-learner-checkbox"
                    value="${escapeHtml(
                        id
                    )}"
                    ${
                        selectedIds.has(
                            id
                        )
                            ? "checked"
                            : ""
                    }
                >

                <div
                    style="
                        flex:1;
                        min-width:0;
                    "
                >

                    <div
                        style="
                            font-weight:600;
                            color:#1f2937;
                        "
                    >
                        ${escapeHtml(
                            getLearnerName(
                                learner
                            )
                        )}
                    </div>

                    <div
                        style="
                            margin-top:3px;
                            font-size:12px;
                            color:#6b7280;
                        "
                    >
                        ${escapeHtml(
                            id
                        )}

                        ·

                        ${escapeHtml(
                            learner?.program ||
                            "—"
                        )}

                    </div>

                </div>

                <span
                    style="
                        font-size:12px;
                        color:#6b7280;
                    "
                >
                    ${escapeHtml(
                        formatLearnerStatus(
                            getLearnerStatus(
                                learner
                            )
                        )
                    )}
                </span>
            `;


            list.appendChild(
                row
            );

        }
    );


    list
        .querySelectorAll(
            ".manage-learner-checkbox"
        )
        .forEach(
            box => {

                box.addEventListener(
                    "change",
                    () => {

                        const id =
                            String(
                                box.value
                            );


                        if (
                            box.checked
                        ) {

                            selectedIds.add(
                                id
                            );

                        } else {

                            selectedIds.delete(
                                id
                            );

                        }


                        updateManageLearnerSelectionState(
                            overlay,
                            selectedIds
                        );

                    }
                );

            }
        );


    updateManageLearnerSelectionState(
        overlay,
        selectedIds
    );
}


function updateManageLearnerSelectionState(
    overlay,
    selectedIds
) {

    const count =
        overlay.querySelector(
            "#manageLearnerSelectedCount"
        );


    if (count) {

        count.textContent =
            `${selectedIds.size} selected`;

    }


    const selectAll =
        overlay.querySelector(
            "#manageLearnerSelectAll"
        );


    if (!selectAll) {

        return;

    }


    const boxes =
        Array.from(
            overlay.querySelectorAll(
                ".manage-learner-checkbox"
            )
        );


    if (!boxes.length) {

        selectAll.checked =
            false;

        selectAll.indeterminate =
            false;

        return;

    }


    const checked =
        boxes.filter(
            box =>
                box.checked
        ).length;


    selectAll.checked =
        checked ===
        boxes.length;


    selectAll.indeterminate =
        checked > 0 &&
        checked <
            boxes.length;
}


function saveManagedLearners(
    overlay,
    selectedIds
) {

    const newLearnerIds =
        Array.from(
            selectedIds
        ).map(
            id => String(id)
        );


    const classes =
        loadClasses();


    const index =
        classes.findIndex(
            classItem =>
                String(
                    classItem.id
                ) ===
                String(
                    currentClass.id
                )
        );


    if (
        index ===
        -1
    ) {

        alert(
            "Unable to save learner assignments because the class could not be found."
        );

        return;

    }


    const previousLearnerIds =
        Array.isArray(
            classes[index].learnerIds
        )
            ? [
                ...classes[index].learnerIds
            ]
            : [];


    classes[index] = {

        ...classes[index],

        learnerIds:
            newLearnerIds,

        learners:
            newLearnerIds.length

    };


    if (
        !saveClasses(
            classes
        )
    ) {

        alert(
            "Unable to save learner assignments."
        );

        return;

    }


    currentClass.learnerIds =
        newLearnerIds;


    currentClass.learners =
        newLearnerIds.length;


    /*
     * Synchronize modules for learners who
     * were added or removed from this class.
     *
     * The synchronization function protects
     * modules that are still assigned through
     * another class.
     */

    synchronizeClassModulesToLearners(
        currentClass,
        currentClass.moduleIds || []
    );


    closeManageLearnersModal(
        overlay
    );


    allLearners =
        loadLearners();


    filteredLearners =
        getClassLearners();


    renderLearnerRoster();

    renderAssignedModules();

    initializeIcons();
}


function closeManageLearnersModal(
    overlay
) {

    if (!overlay) {

        return;

    }


    if (
        overlay._learnerEscapeHandler
    ) {

        document.removeEventListener(
            "keydown",
            overlay._learnerEscapeHandler
        );

    }


    overlay.remove();
}


/* =========================================================
   ERROR / HELPERS
========================================================= */


function showClassNotFound(
    message
) {

    setText(
        "classDetailsTitle",
        "Class Not Found"
    );


    setText(
        "classDetailsCourse",
        message
    );


    const roster =
        document.getElementById(
            "classRosterBody"
        );


    const rosterEmpty =
        document.getElementById(
            "classRosterEmpty"
        );


    const moduleList =
        document.getElementById(
            "classAssignedModuleList"
        );


    const moduleEmpty =
        document.getElementById(
            "classAssignedModulesEmpty"
        );


    const moduleCount =
        document.getElementById(
            "classAssignedModuleCount"
        );


    if (roster) {

        roster.innerHTML =
            "";

    }


    if (rosterEmpty) {

        rosterEmpty.hidden =
            false;

    }


    if (moduleList) {

        moduleList.innerHTML =
            "";

    }


    if (moduleCount) {

        moduleCount.textContent =
            "—";

    }


    if (moduleEmpty) {

        moduleEmpty.hidden =
            false;


        const heading =
            moduleEmpty.querySelector(
                "h4"
            );


        const paragraph =
            moduleEmpty.querySelector(
                "p"
            );


        if (heading) {

            heading.textContent =
                "Unable to load modules";

        }


        if (paragraph) {

            paragraph.textContent =
                "The selected class could not be loaded.";

        }

    }


    disableClassActions();

    initializeIcons();
}


function disableClassActions() {

    [
        "editClassButton",
        "manageLearnersButton"
    ].forEach(
        id => {

            const button =
                document.getElementById(
                    id
                );


            if (button) {

                button.disabled =
                    true;

            }

        }
    );
}


function normalizeStatus(
    status
) {

    return String(
        status ||
        "active"
    )
        .trim()
        .toLowerCase() ===
        "inactive"

        ? "inactive"

        : "active";
}


function formatStatus(
    status
) {

    return normalizeStatus(
        status
    ) ===
        "inactive"

        ? "Inactive"

        : "Active";
}


function formatLearnerStatus(
    status
) {

    if (
        status ===
        "inactive"
    ) {

        return "Inactive";

    }


    if (
        status ===
        "completed"
    ) {

        return "Completed";

    }


    return "Active";
}


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


function initializeIcons() {

    if (
        typeof lucide !== "undefined" &&
        typeof lucide.createIcons ===
            "function"
    ) {

        lucide.createIcons();

    }
}