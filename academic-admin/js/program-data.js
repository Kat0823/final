/* =========================================================
   SIKNAYAN - PROGRAM DATA
   ---------------------------------------------------------
   Single authoritative program source for the Academic Admin
   frontend.

   CURRENT:
       JavaScript data source

   FUTURE:
       FastAPI -> PostgreSQL -> Programs

   CANONICAL PROGRAMS:
       BSIT
       BSCRIM
       BSEEd
       BSOA
       BSN
       BSTM

   DO NOT hardcode program lists separately in page files.
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       PROGRAM DEFINITIONS
    ===================================================== */

    const PROGRAMS = [

        {
            id: "ga5fvd",
            code: "BSIT",
            name:
                "Bachelor of Science in Information Technology"
        },

        {
            id: "cr8m2k",
            code: "BSCRIM",
            name:
                "Bachelor of Science in Criminology"
        },

        {
            id: "ed7p4q",
            code: "BSEEd",
            name:
                "Bachelor of Elementary Education"
        },

        {
            id: "oa6n3r",
            code: "BSOA",
            name:
                "Bachelor of Science in Office Administration"
        },

        {
            id: "sn5k8m",
            code: "BSN",
            name:
                "Bachelor of Science in Nursing"
        },

        {
            id: "tm9v2x",
            code: "BSTM",
            name:
                "Bachelor of Science in Tourism Management"
        }

    ];


    /* =====================================================
       ALL PROGRAMS = the list above + every program in the
       Module Library (including ones the admin added there),
       so dropdowns always match the Module Library.
    ===================================================== */

    const LIBRARY_STORAGE_KEY =
        "siknayan_academic_admin_module_library_v3";

    function libraryPrograms() {
        try {
            if (
                window.SiknayanModuleLibraryData &&
                typeof window.SiknayanModuleLibraryData.getPrograms === "function"
            ) {
                return window.SiknayanModuleLibraryData.getPrograms();
            }

            const stored = JSON.parse(
                localStorage.getItem(LIBRARY_STORAGE_KEY) || "null"
            );

            return stored && stored.programs
                ? Object.values(stored.programs)
                : [];
        } catch (error) {
            return [];
        }
    }

    function allPrograms() {
        const list = PROGRAMS.map(program => ({ ...program }));

        libraryPrograms().forEach(program => {
            const code = String(program?.code || "").trim();
            if (!code) return;

            const known = list.some(
                item => item.code.toLowerCase() === code.toLowerCase()
            );

            if (!known) {
                list.push({
                    id: code.toLowerCase(),
                    code,
                    name: program.name || code
                });
            }
        });

        return list;
    }


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    function normalizeCode(
        code
    ) {

        return String(
            code ?? ""
        )
            .trim()
            .toLowerCase();

    }


    /* =====================================================
       GET ALL PROGRAMS
    ===================================================== */

    function getAll() {

        return allPrograms().map(
            program => ({
                ...program
            })
        );

    }


    /* =====================================================
       GET PROGRAM CODES
    ===================================================== */

    function getCodes() {

        return allPrograms().map(
            program =>
                program.code
        );

    }


    /* =====================================================
       GET PROGRAM BY CODE
    ===================================================== */

    function getByCode(
        code
    ) {

        const normalized =
            normalizeCode(
                code
            );


        return allPrograms().find(
            program =>
                normalizeCode(
                    program.code
                ) === normalized

        ) || null;

    }


    /* =====================================================
       GET PROGRAM BY ID
    ===================================================== */

    function getById(
        id
    ) {

        const normalized =
            String(
                id ?? ""
            )
                .trim()
                .toLowerCase();


        return allPrograms().find(
            program =>
                String(
                    program.id
                )
                    .trim()
                    .toLowerCase() ===
                normalized

        ) || null;

    }


    /* =====================================================
       CHECK PROGRAM EXISTENCE
    ===================================================== */

    function exists(
        code
    ) {

        return Boolean(
            getByCode(
                code
            )
        );

    }


    /* =====================================================
       RENDER PROGRAM OPTIONS
    ===================================================== */

    function renderOptions(
        select,
        options = {}
    ) {

        if (
            !select
        ) {

            return;

        }


        const {

            includeAll =
                false,

            allLabel =
                "All Programs",

            includePlaceholder =
                false,

            placeholder =
                "Select program",

            preserveValue =
                true

        } = options;


        const previousValue =
            preserveValue
                ? select.value
                : "";


        let html =
            "";


        /* -------------------------------------------------
           ALL PROGRAMS OPTION
        ------------------------------------------------- */

        if (
            includeAll
        ) {

            html += `
                <option value="all">
                    ${allLabel}
                </option>
            `;

        }


        /* -------------------------------------------------
           PLACEHOLDER OPTION
        ------------------------------------------------- */

        else if (
            includePlaceholder
        ) {

            html += `
                <option value="">
                    ${placeholder}
                </option>
            `;

        }


        /* -------------------------------------------------
           PROGRAM OPTIONS
        ------------------------------------------------- */

        allPrograms().forEach(
            program => {

                html += `
                    <option
                        value="${program.code}"
                    >
                        ${program.code}
                    </option>
                `;

            }
        );


        select.innerHTML =
            html;


        /* -------------------------------------------------
           RESTORE PREVIOUS VALUE
        ------------------------------------------------- */

        if (
            preserveValue &&
            allPrograms().some(
                program =>
                    program.code ===
                    previousValue
            )
        ) {

            select.value =
                previousValue;

        }


        /* -------------------------------------------------
           KEEP "ALL" VALUE
           when applicable
        ------------------------------------------------- */

        else if (
            preserveValue &&
            includeAll &&
            previousValue === "all"
        ) {

            select.value =
                "all";

        }


        /* -------------------------------------------------
           KEEP EMPTY VALUE
           when placeholder is used
        ------------------------------------------------- */

        else if (
            preserveValue &&
            includePlaceholder &&
            previousValue === ""
        ) {

            select.value =
                "";

        }

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.SiknayanPrograms = {

        getAll,

        getCodes,

        getByCode,

        getById,

        exists,

        renderOptions

    };

})();