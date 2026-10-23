/* =========================================================
   SIKNAYAN - MODULE LIBRARY LANDING PAGE
========================================================= */

(function initModuleLibrary() {

    "use strict";


    const page =
        document.querySelector(
            ".module-library-page"
        );


    if (!page) {
        return;
    }


    const data =
        window.SiknayanModuleLibraryData;


    if (!data) {

        console.error(
            "Module Library: module-library-data.js must load first."
        );

        return;

    }


    const programGrid =
        document.getElementById(
            "programGrid"
        );


    const librarySummary =
        document.getElementById(
            "librarySummary"
        );


    const addProgramModal =
        document.getElementById(
            "addProgramModal"
        );


    const openAddProgramButton =
        document.getElementById(
            "openAddProgramBtn"
        );


    const cancelAddProgramButton =
        document.getElementById(
            "cancelAddProgramBtn"
        );


    const addProgramForm =
        document.getElementById(
            "addProgramForm"
        );


    const programNameInput =
        document.getElementById(
            "programName"
        );


    const programCodeInput =
        document.getElementById(
            "programCode"
        );


    const iconChoices =
        document.querySelectorAll(
            ".icon-choice"
        );


    if (
        !programGrid ||
        !librarySummary ||
        !addProgramModal ||
        !addProgramForm ||
        !programNameInput ||
        !programCodeInput
    ) {

        console.error(
            "Module Library: required elements are missing."
        );

        return;

    }


    let selectedIcon =
        "monitor-up";


    function refreshIcons() {

        if (
            window.lucide &&
            typeof window.lucide.createIcons ===
                "function"
        ) {

            window.lucide.createIcons();

        }

    }


    function escapeHtml(
        value
    ) {

        return String(
            value ??
            ""
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


    function createProgramCard(
        program
    ) {

        const card =
            document.createElement(
                "a"
            );


        card.className =
            "program-card";


        card.dataset.program =
            program.code;


        card.href =
            `module-library-program.html?program=${encodeURIComponent(
                program.code
            )}`;


        const subjects =
            Array.isArray(
                program.courses
            )
                ? program.courses.length
                : 0;


        const modules =
            Array.isArray(
                program.modules
            )
                ? program.modules.length
                : 0;


        card.innerHTML =
            `
                <div
                    class="program-card-content"
                >

                    <div
                        class="program-card-top"
                    >

                        <i
                            data-lucide="${escapeHtml(
                                program.icon ||
                                "monitor-up"
                            )}"
                            class="program-icon"
                        ></i>


                        <h3>
                            ${escapeHtml(
                                program.code
                            )}
                        </h3>

                    </div>


                    <p
                        class="program-card-name"
                    >
                        ${escapeHtml(
                            program.name ||
                            ""
                        )}
                    </p>

                    ${
                        Array.isArray(program.majors) &&
                        program.majors.length
                            ? `<p class="program-card-majors">Majors: ${program.majors
                                .map(major => escapeHtml(major))
                                .join(" · ")}</p>`
                            : ""
                    }


                    <div
                        class="program-card-stats"
                    >

                        <span>
                            ${subjects}
                            Subjects ·
                            ${modules}
                        </span>


                        <span>
                            Modules
                        </span>

                    </div>

                </div>
            `;


        return card;

    }


    function renderPrograms() {

        const programs =
            data.getPrograms();


        let moduleTotal =
            0;


        programGrid.innerHTML =
            "";


        programs.forEach(
            program => {

                moduleTotal +=
                    Array.isArray(
                        program.modules
                    )
                        ? program.modules.length
                        : 0;


                programGrid.appendChild(
                    createProgramCard(
                        program
                    )
                );

            }
        );


        librarySummary.textContent =
            `${moduleTotal} modules across ${programs.length} programs`;


        refreshIcons();

    }


    function openAddProgramModal() {

        addProgramModal.classList.add(
            "active"
        );


        addProgramModal.setAttribute(
            "aria-hidden",
            "false"
        );


        setTimeout(
            () => {

                programNameInput.focus();

            },
            50
        );

    }


    function closeAddProgramModal() {

        addProgramModal.classList.remove(
            "active"
        );


        addProgramModal.setAttribute(
            "aria-hidden",
            "true"
        );


        resetAddProgramForm();

    }


    function resetAddProgramForm() {

        addProgramForm.reset();


        iconChoices.forEach(
            choice => {

                choice.classList.remove(
                    "selected"
                );

            }
        );


        const firstChoice =
            document.querySelector(
                ".icon-choice"
            );


        if (
            firstChoice
        ) {

            firstChoice.classList.add(
                "selected"
            );


            selectedIcon =
                firstChoice.dataset.icon ||
                "monitor-up";

        }

    }


    iconChoices.forEach(
        choice => {

            choice.addEventListener(
                "click",
                () => {

                    iconChoices.forEach(
                        item => {

                            item.classList.remove(
                                "selected"
                            );

                        }
                    );


                    choice.classList.add(
                        "selected"
                    );


                    selectedIcon =
                        choice.dataset.icon ||
                        "monitor-up";

                }
            );

        }
    );


    openAddProgramButton?.addEventListener(
        "click",
        openAddProgramModal
    );


    cancelAddProgramButton?.addEventListener(
        "click",
        closeAddProgramModal
    );


    addProgramModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                addProgramModal
            ) {

                closeAddProgramModal();

            }

        }
    );


    addProgramForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                programNameInput
                    .value
                    .trim();


            const code =
                data.normalizeCode(
                    programCodeInput.value
                );


            if (
                !name
            ) {

                alert(
                    "Please enter a program name."
                );


                programNameInput.focus();

                return;

            }


            if (
                !code
            ) {

                alert(
                    "Please enter a program code."
                );


                programCodeInput.focus();

                return;

            }


            const duplicate =
                data
                    .getPrograms()
                    .some(
                        program =>

                            data.normalizeCode(
                                program.code
                            ) ===
                            code

                            ||

                            String(
                                program.name ||
                                ""
                            )
                                .trim()
                                .toLowerCase() ===
                            name.toLowerCase()
                    );


            if (
                duplicate
            ) {

                alert(
                    "A program with this name or program code already exists."
                );

                return;

            }


            data.addProgram({

                name,

                code,

                icon:
                    selectedIcon

            });


            closeAddProgramModal();

            renderPrograms();

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape" &&

                addProgramModal.classList.contains(
                    "active"
                )
            ) {

                closeAddProgramModal();

            }

        }
    );


    data.load();

    resetAddProgramForm();

    renderPrograms();

})();