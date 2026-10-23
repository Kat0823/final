/* =========================================================
   SIKNAYAN - SHARED MODULE LIBRARY DATA
========================================================= */

(function () {

    "use strict";


    const STORAGE_KEY =
        "siknayan_academic_admin_module_library_v3";


    const LEGACY_STORAGE_KEY =
        "siknayan_academic_admin_module_library_v2";


    const LEARNER_STORAGE_KEY =
        "siknayan_academic_admin_learners";


    /* =====================================================
       PROGRAM SEEDS
       -----------------------------------------------------
       These are prototype course seeds for the Module
       Library. Actual approved curriculum data can replace
       these later without changing the storage structure.
    ===================================================== */

    const PROGRAM_SEEDS = {

        BSIT: {

            code:
                "BSIT",

            name:
                "Bachelor of Science in Information Technology",

            courses: [

                [
                    "bsit-intro-computing",
                    "Introduction to Computing",
                    "IT 101"
                ],

                [
                    "bsit-programming-1",
                    "Computer Programming 1",
                    "IT 102"
                ],

                [
                    "bsit-programming-2",
                    "Computer Programming 2",
                    "IT 103"
                ],

                [
                    "bsit-data-structures",
                    "Data Structures and Algorithms",
                    "IT 104"
                ],

                [
                    "bsit-web-systems",
                    "Web Systems and Technologies",
                    "IT 105"
                ]

            ],

            modules: []

        },


        BSCRIM: {

            code:
                "BSCRIM",

            name:
                "Bachelor of Science in Criminology",

            courses: [

                [
                    "criminal-law",
                    "Criminal Law Fundamentals",
                    "CRIM 101"
                ],

                [
                    "forensic-science",
                    "Forensic Science",
                    "CRIM 102"
                ],

                [
                    "criminal-investigation",
                    "Criminal Investigation",
                    "CRIM 103"
                ],

                [
                    "correctional-administration",
                    "Correctional Administration",
                    "CRIM 104"
                ],

                [
                    "criminalistics",
                    "Criminalistics",
                    "CRIM 105"
                ],

                [
                    "evidence-handling",
                    "Evidence Handling",
                    "CRIM 106"
                ],

                [
                    "criminal-procedure",
                    "Criminal Procedure",
                    "CRIM 107"
                ]

            ],

            modules: [

                {
                    id:
                        "criminal-law-introduction",

                    courseId:
                        "criminal-law",

                    title:
                        "Introduction to Criminal Law",

                    uploaded:
                        "June 12",

                    assigned:
                        0,

                    status:
                        "active",

                    fileName:
                        "",

                    fileSize:
                        0,

                    fileType:
                        "",

                    version:
                        1
                },


                {
                    id:
                        "criminal-law-terminology",

                    courseId:
                        "criminal-law",

                    title:
                        "Legal Terminology Basics",

                    uploaded:
                        "June 12",

                    assigned:
                        0,

                    status:
                        "active",

                    fileName:
                        "",

                    fileSize:
                        0,

                    fileType:
                        "",

                    version:
                        1
                },


                {
                    id:
                        "forensic-science-basics",

                    courseId:
                        "forensic-science",

                    title:
                        "Forensic Science Basics",

                    uploaded:
                        "June 15",

                    assigned:
                        0,

                    status:
                        "active",

                    fileName:
                        "",

                    fileSize:
                        0,

                    fileType:
                        "",

                    version:
                        1
                },


                {
                    id:
                        "crime-scene-analysis",

                    courseId:
                        "forensic-science",

                    title:
                        "Crime Scene Analysis",

                    uploaded:
                        "July 2",

                    assigned:
                        0,

                    status:
                        "active",

                    fileName:
                        "",

                    fileSize:
                        0,

                    fileType:
                        "",

                    version:
                        1
                },


                {
                    id:
                        "dna-analysis",

                    courseId:
                        "forensic-science",

                    title:
                        "DNA Analysis",

                    uploaded:
                        "July 4",

                    assigned:
                        0,

                    status:
                        "archived",

                    fileName:
                        "",

                    fileSize:
                        0,

                    fileType:
                        "",

                    version:
                        1
                }

            ]

        },


        BSEED: {

            code:
                "BSEEd",

            name:
                "Bachelor of Elementary Education",

            courses: [

                [
                    "bseed-child-adolescent",
                    "The Child and Adolescent Learner",
                    "BEEd 101"
                ],

                [
                    "bseed-teaching-profession",
                    "The Teaching Profession",
                    "BEEd 102"
                ],

                [
                    "bseed-learner-centered",
                    "Facilitating Learner-Centered Teaching",
                    "BEEd 103"
                ],

                [
                    "bseed-assessment",
                    "Assessment in Learning",
                    "BEEd 104"
                ],

                [
                    "bseed-new-literacies",
                    "Building and Enhancing New Literacies",
                    "BEEd 105"
                ]

            ],

            modules: []

        },


        BSOA: {

            code:
                "BSOA",

            name:
                "Bachelor of Science in Office Administration",

            courses: [

                [
                    "bsoa-business-communication",
                    "Business Communication",
                    "BSOA 101"
                ],

                [
                    "bsoa-office-procedures",
                    "Office Procedures and Systems",
                    "BSOA 102"
                ],

                [
                    "bsoa-records-management",
                    "Records Management",
                    "BSOA 103"
                ],

                [
                    "bsoa-office-management",
                    "Administrative Office Management",
                    "BSOA 104"
                ]

            ],

            modules: []

        },


        BSN: {

            code:
                "BSN",

            name:
                "Bachelor of Science in Nursing",

            courses: [

                [
                    "bsn-anatomy",
                    "Anatomy and Physiology",
                    "NURS 101"
                ],

                [
                    "bsn-fundamentals",
                    "Fundamentals of Nursing Practice",
                    "NURS 102"
                ],

                [
                    "bsn-health-assessment",
                    "Health Assessment",
                    "NURS 103"
                ],

                [
                    "bsn-pharmacology",
                    "Pharmacology",
                    "NURS 104"
                ],

                [
                    "bsn-community-health",
                    "Community Health Nursing",
                    "NURS 105"
                ],

                [
                    "bsn-maternal-child",
                    "Maternal and Child Nursing",
                    "NURS 106"
                ],

                [
                    "bsn-medical-surgical",
                    "Medical-Surgical Nursing",
                    "NURS 107"
                ],

                [
                    "bsn-nursing-informatics",
                    "Nursing Informatics",
                    "NURS 108"
                ]

            ],

            modules: []

        },


        BSBA: {

            code:
                "BSBA",

            name:
                "Bachelor of Science in Business Administration",

            majors: [
                "Financial Management",
                "Marketing Management"
            ],

            courses: [

                [
                    "bsba-principles-management",
                    "Principles of Management",
                    "BSBA 101"
                ],

                [
                    "bsba-financial-management",
                    "Financial Management",
                    "BSBA 102"
                ],

                [
                    "bsba-marketing-management",
                    "Marketing Management",
                    "BSBA 103"
                ]

            ],

            modules: []

        },


        BSA: {

            code:
                "BSA",

            name:
                "Bachelor of Science in Accountancy",

            courses: [

                [
                    "bsa-financial-accounting",
                    "Financial Accounting and Reporting",
                    "ACCT 101"
                ],

                [
                    "bsa-cost-accounting",
                    "Cost Accounting",
                    "ACCT 102"
                ],

                [
                    "bsa-auditing",
                    "Auditing Theory",
                    "ACCT 103"
                ],

                [
                    "bsa-taxation",
                    "Taxation",
                    "ACCT 104"
                ],

                [
                    "bsa-accounting-information",
                    "Accounting Information Systems",
                    "ACCT 105"
                ]

            ],

            modules: []

        },


        BAPS: {

            code:
                "BAPS",

            name:
                "Bachelor of Arts in Political Science",

            courses: [

                [
                    "baps-intro-political-science",
                    "Introduction to Political Science",
                    "POLS 101"
                ],

                [
                    "baps-philippine-government",
                    "Philippine Government and Constitution",
                    "POLS 102"
                ],

                [
                    "baps-comparative-politics",
                    "Comparative Politics",
                    "POLS 103"
                ]

            ],

            modules: []

        },


        /* Added programs: courses are added by the Academic Admin
           on each program's page (+ Add Course). */

        BSNED: {

            code:
                "BSNED",

            name:
                "Bachelor of Special Needs Education",

            courses: [],

            modules: []

        },


        BSED: {

            code:
                "BSED",

            name:
                "Bachelor of Science in Secondary Education",

            majors: [
                "English",
                "Mathematics",
                "Science",
                "Social Studies"
            ],

            courses: [],

            modules: []

        },


        BECED: {

            code:
                "BECED",

            name:
                "Bachelor of Early Childhood Education",

            courses: [],

            modules: []

        },


        BSHM: {

            code:
                "BSHM",

            name:
                "Bachelor of Science in Hospitality Management",

            courses: [],

            modules: []

        },


        AAHM: {

            code:
                "AAHM",

            name:
                "Associate of Arts in Hospitality Management",

            courses: [],

            modules: []

        },


        BSTM: {

            code:
                "BSTM",

            name:
                "Bachelor of Science in Tourism Management",

            courses: [],

            modules: []

        }

    };


    const DEFAULT_ICONS = {

        BSIT:
            "monitor-up",

        BSCRIM:
            "clock-3",

        BSEEd:
            "feather",

        BSOA:
            "briefcase",

        BSN:
            "heart",

        BSBA:
            "tag",

        BSA:
            "dollar-sign",

        BAPS:
            "bar-chart-3",

        BSNED:
            "accessibility",

        BSED:
            "school",

        BECED:
            "baby",

        BSHM:
            "chef-hat",

        AAHM:
            "utensils",

        BSTM:
            "plane"

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function clone(
        value
    ) {

        return JSON.parse(
            JSON.stringify(
                value
            )
        );

    }


    function normalizeCode(
        value
    ) {

        const code =
            String(
                value ||
                ""
            )
                .trim();


        if (
            code.toUpperCase() ===
            "BSEED"
        ) {

            return "BSEEd";

        }


        return code.toUpperCase();

    }


    function seedProgram(
        code,
        custom
    ) {

        const normalized =
            normalizeCode(
                code
            );


        let seed =
            PROGRAM_SEEDS[
                normalized
            ];


        if (
            !seed
        ) {

            seed =
                PROGRAM_SEEDS[
                    normalized.toUpperCase()
                ];

        }


        if (
            !seed
        ) {

            return {

                code:
                    normalized,

                name:
                    custom?.name ||
                    normalized,

                icon:
                    custom?.icon ||
                    "monitor-up",

                majors:
                    Array.isArray(custom?.majors)
                        ? custom.majors
                        : [],

                courses:
                    [],

                modules:
                    []

            };

        }


        return {

            code:
                seed.code,

            name:
                seed.name,

            icon:
                custom?.icon ||
                DEFAULT_ICONS[
                    seed.code
                ] ||
                "monitor-up",

            majors:
                clone(
                    seed.majors ||
                    []
                ),

            courses:
                clone(
                    seed.courses
                ).map(
                    item => ({

                        id:
                            item[0],

                        name:
                            item[1],

                        code:
                            item[2]

                    })
                ),

            modules:
                clone(
                    seed.modules
                ).map(
                    module => ({

                        ...module,

                        program:
                            seed.code

                    })
                )

        };

    }


    function normalizeProgram(
        program,
        code
    ) {

        const normalizedCode =
            normalizeCode(
                code ||
                program?.code
            );


        const fallback =
            seedProgram(
                normalizedCode
            );


        return {

            code:
                normalizedCode,

            name:
                program?.name ||
                fallback.name,

            icon:
                program?.icon ||
                fallback.icon,

            majors:
                Array.isArray(
                    program?.majors
                ) &&
                program.majors.length
                    ? program.majors
                    : fallback.majors,

            courses:
                Array.isArray(
                    program?.courses
                )
                    ? program.courses
                    : fallback.courses,

            modules:
                Array.isArray(
                    program?.modules
                )
                    ? program.modules
                    : fallback.modules

        };

    }


    /* =====================================================
       LOAD
    ===================================================== */

    function readRaw() {

        try {

            const current =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (
                current
            ) {

                return JSON.parse(
                    current
                );

            }


            const legacy =
                localStorage.getItem(
                    LEGACY_STORAGE_KEY
                );


            if (
                legacy
            ) {

                return JSON.parse(
                    legacy
                );

            }

        } catch (
            error
        ) {

            console.error(
                "Module Library Data: unable to read storage.",
                error
            );

        }


        return null;

    }


    function load() {

        const raw =
            readRaw();


        const programs =
            {};


        Object.keys(
            PROGRAM_SEEDS
        ).forEach(
            key => {

                const seed =
                    PROGRAM_SEEDS[
                        key
                    ];


                programs[
                    seed.code
                ] =
                    seedProgram(
                        seed.code
                    );

            }
        );


        if (
            raw?.programs &&
            typeof raw.programs ===
                "object"
        ) {

            Object.values(
                raw.programs
            ).forEach(
                storedProgram => {

                    const code =
                        normalizeCode(
                            storedProgram?.code
                        );


                    if (
                        !code
                    ) {

                        return;

                    }


                    programs[
                        code
                    ] =
                        normalizeProgram(
                            storedProgram,
                            code
                        );

                }
            );

        }


        const state = {

            version:
                "v3",

            programs

        };


        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                state
            )

        );


        return state;

    }


    function save(
        state
    ) {

        state.version =
            "v3";


        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                state
            )

        );

    }


    function getProgram(
        code
    ) {

        const state =
            load();


        const normalized =
            normalizeCode(
                code
            );


        if (
            !state.programs[
                normalized
            ]
        ) {

            state.programs[
                normalized
            ] =
                seedProgram(
                    normalized
                );


            save(
                state
            );

        }


        return state.programs[
            normalized
        ];

    }


    function saveProgram(
        program
    ) {

        const state =
            load();


        const code =
            normalizeCode(
                program.code
            );


        state.programs[
            code
        ] =
            normalizeProgram(
                program,
                code
            );


        save(
            state
        );

    }


    function getPrograms() {

        return Object.values(
            load().programs
        );

    }


    /* =====================================================
       ACTUAL LEARNER ASSIGNMENT COUNTS
    ===================================================== */

    function getLearnerState() {

        try {

            const raw =
                localStorage.getItem(
                    LEARNER_STORAGE_KEY
                );


            if (
                !raw
            ) {

                return {

                    learners:
                        [],

                    modules:
                        {}

                };

            }


            const parsed =
                JSON.parse(
                    raw
                );


            return {

                learners:
                    Array.isArray(
                        parsed?.learners
                    )
                        ? parsed.learners
                        : [],

                modules:
                    parsed?.modules &&
                    typeof parsed.modules ===
                        "object"

                        ? parsed.modules

                        : {}

            };

        } catch (
            error
        ) {

            console.error(
                "Module Library Data: unable to read learner assignments.",
                error
            );


            return {

                learners:
                    [],

                modules:
                    {}

            };

        }

    }


    function getLearnerModuleRecords() {

        const state =
            getLearnerState();


        const records =
            [];


        Object.entries(
            state.modules
        ).forEach(
            (
                [
                    learnerId,
                    moduleList
                ]
            ) => {

                if (
                    !Array.isArray(
                        moduleList
                    )
                ) {

                    return;

                }


                moduleList.forEach(
                    record => {

                        records.push({

                            ...record,

                            learnerId

                        });

                    }
                );

            }
        );


        return records;

    }


    function countAssigned(
        module
    ) {

        const records =
            getLearnerModuleRecords();


        const state =
            getLearnerState();


        const targetId =
            String(
                module.id
            );


        const targetTitle =
            String(
                module.title ||
                ""
            )
                .trim()
                .toLowerCase();


        const targetProgram =
            String(
                module.program ||
                ""
            )
                .trim()
                .toLowerCase();


        const program =
            getProgram(
                module.program ||
                ""
            );


        const course =
            program.courses.find(
                item =>
                    String(
                        item.id
                    ).toLowerCase() ===
                    String(
                        module.courseId ||
                        ""
                    ).toLowerCase()
            );


        const targetCourseName =
            String(
                course?.name ||
                ""
            )
                .trim()
                .toLowerCase();


        const matchedLearners =
            new Set();


        records.forEach(
            record => {

                const learner =
                    state.learners.find(
                        item =>
                            String(
                                item.id
                            ) ===
                            String(
                                record.learnerId
                            )
                    );


                const learnerProgram =
                    String(
                        learner?.program ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const recordId =
                    String(
                        record.libraryModuleId ||
                        record.moduleId ||
                        ""
                    );


                const recordTitle =
                    String(
                        record.title ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const recordCourse =
                    String(
                        record.courseId ||
                        record.course ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                const idMatch =
                    recordId ===
                    targetId;


                const titleMatch =
                    recordTitle ===
                    targetTitle;


                const courseMatch =

                    !recordCourse ||

                    recordCourse ===
                    String(
                        module.courseId ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ||

                    recordCourse ===
                    targetCourseName;


                const programMatch =
                    !learnerProgram ||
                    learnerProgram ===
                    targetProgram;


                if (
                    (
                        idMatch ||
                        (
                            titleMatch &&
                            courseMatch
                        )
                    ) &&
                    programMatch
                ) {

                    matchedLearners.add(
                        String(
                            record.learnerId
                        )
                    );

                }

            }
        );


        return matchedLearners.size;

    }


    function syncAssignedCounts(
        code
    ) {

        const program =
            getProgram(
                code
            );


        program.modules.forEach(
            module => {

                module.assigned =
                    countAssigned(
                        module
                    );

            }
        );


        saveProgram(
            program
        );


        return program;

    }


    /* =====================================================
       ADD PROGRAM
    ===================================================== */

    function addProgram(
        program
    ) {

        const state =
            load();


        const code =
            normalizeCode(
                program.code
            );


        if (
            state.programs[
                code
            ]
        ) {

            return null;

        }


        state.programs[
            code
        ] = {

            code,

            name:
                program.name ||
                code,

            icon:
                program.icon ||
                "monitor-up",

            majors:
                [],

            courses:
                [],

            modules:
                []

        };


        save(
            state
        );


        return state.programs[
            code
        ];

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.SiknayanModuleLibraryData = {

        STORAGE_KEY,

        PROGRAM_SEEDS,

        normalizeCode,

        load,

        save,

        getProgram,

        saveProgram,

        getPrograms,

        countAssigned,

        syncAssignedCounts,

        addProgram

    };


})();