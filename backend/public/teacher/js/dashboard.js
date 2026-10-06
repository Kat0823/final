document.addEventListener("DOMContentLoaded", function () {

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    */

    const API_URL = "http://localhost:8000/api";


    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const token = sessionStorage.getItem("token");


    if (!token) {

        alert(
            "Your session has expired. Please log in again."
        );

        window.location.href = "../index.html";

        return;
    }


    /*
    |--------------------------------------------------------------------------
    | ELEMENTS
    |--------------------------------------------------------------------------
    */

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");

    const mainContent =
        document.getElementById("mainContent");

    const profileButton =
        document.getElementById("profileButton");

    const profileMenu =
        document.getElementById("profileMenu");

    const logoutButton =
        document.getElementById("logoutButton");

    const profileModal =
        document.getElementById("profileModal");

    const closeProfile =
        document.getElementById("closeProfile");

    const cancelProfile =
        document.getElementById("cancelProfile");

    const profileForm =
        document.getElementById("profileForm");

    const avatarInput =
        document.getElementById("avatarInput");

    const profileImage =
        document.getElementById("profileImage");

    const headerAvatar =
        document.getElementById("headerAvatar");

    const searchInput =
        document.getElementById("searchInput");

    const studentTableBody =
        document.getElementById("studentTableBody");

    const toast =
        document.getElementById("toast");


    /*
    |--------------------------------------------------------------------------
    | LEARNER DATA
    |--------------------------------------------------------------------------
    */

    let learners = [];


    /*
    |--------------------------------------------------------------------------
    | API REQUEST
    |--------------------------------------------------------------------------
    */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const headers = {

            "Accept":
                "application/json",

            "Authorization":
                "Bearer " + token

        };


        /*
        |----------------------------------------------------------------------
        | Add JSON header when needed
        |----------------------------------------------------------------------
        */

        if (
            options.body &&
            !(options.body instanceof FormData)
        ) {

            headers["Content-Type"] =
                "application/json";
        }


        const response =
            await fetch(
                API_URL + endpoint,
                {
                    ...options,
                    headers: {
                        ...headers,
                        ...(options.headers || {})
                    }
                }
            );


        /*
        |----------------------------------------------------------------------
        | Authentication error
        |----------------------------------------------------------------------
        */

        if (response.status === 401) {

            sessionStorage.removeItem(
                "token"
            );

            sessionStorage.removeItem(
                "user"
            );

            alert(
                "Your session has expired. Please log in again."
            );

            window.location.href =
                "../index.html";

            return null;
        }


        /*
        |----------------------------------------------------------------------
        | Read response
        |----------------------------------------------------------------------
        */

        const data =
            await response.json()
                .catch(function () {
                    return null;
                });


        if (!response.ok) {

            throw new Error(
                data?.message ||
                "An error occurred while communicating with the server."
            );
        }


        return data;
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD DASHBOARD DATA
    |--------------------------------------------------------------------------
    */

    async function loadDashboard() {

        try {

            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-row">

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        <br>

                        Loading learners...

                    </td>
                </tr>
            `;


            const data =
                await apiRequest(
                    "/instructor/dashboard"
                );


            if (!data) {
                return;
            }


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load instructor dashboard."
                );
            }


            /*
            |------------------------------------------------------------------
            | Instructor information
            |------------------------------------------------------------------
            */

            if (data.instructor) {

                updateInstructorInformation(
                    data.instructor
                );
            }


            /*
            |------------------------------------------------------------------
            | Statistics
            |------------------------------------------------------------------
            */

            const statistics =
                data.statistics || {};


            document.getElementById(
                "totalLearners"
            ).textContent =
                statistics.total_learners ?? 0;


            document.getElementById(
                "totalClasses"
            ).textContent =
                statistics.total_classes ?? 0;


            document.getElementById(
                "totalModules"
            ).textContent =
                statistics.total_modules ?? 0;


            document.getElementById(
                "pendingSubmissions"
            ).textContent =
                statistics.pending_submissions ?? 0;


            /*
            |------------------------------------------------------------------
            | Learners
            |------------------------------------------------------------------
            */

            learners =
                data.learners || [];


            renderLearners(
                learners
            );


        } catch (error) {

            console.error(
                "Dashboard error:",
                error
            );


            studentTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="loading-row">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <br>

                        Unable to load dashboard.

                        <br>

                        <small>
                            ${escapeHtml(
                                error.message
                            )}
                        </small>

                    </td>
                </tr>
            `;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE INSTRUCTOR INFORMATION
    |--------------------------------------------------------------------------
    */

    function updateInstructorInformation(
        instructor
    ) {

        /*
        |----------------------------------------------------------------------
        | Header name
        |----------------------------------------------------------------------
        */

        const headerName =
            document.getElementById(
                "headerProfileName"
            );


        if (headerName) {

            headerName.textContent =
                instructor.name ||
                "Instructor";
        }


        /*
        |----------------------------------------------------------------------
        | Profile ID
        |----------------------------------------------------------------------
        */

        const instructorId =
            document.getElementById(
                "instructorId"
            );


        if (instructorId) {

            instructorId.value =
                instructor.school_id ||
                "";
        }


        /*
        |----------------------------------------------------------------------
        | Name
        |----------------------------------------------------------------------
        */

        const instructorName =
            document.getElementById(
                "instructorName"
            );


        if (instructorName) {

            instructorName.value =
                instructor.name ||
                "";
        }


        /*
        |----------------------------------------------------------------------
        | Email
        |----------------------------------------------------------------------
        */

        const instructorEmail =
            document.getElementById(
                "instructorEmail"
            );


        if (instructorEmail) {

            instructorEmail.value =
                instructor.email ||
                "";
        }


        /*
        |----------------------------------------------------------------------
        | Contact
        |----------------------------------------------------------------------
        */

        const instructorPhone =
            document.getElementById(
                "instructorPhone"
            );


        if (instructorPhone) {

            instructorPhone.value =
                instructor.contact ||
                "";
        }


        /*
        |----------------------------------------------------------------------
        | Program
        |----------------------------------------------------------------------
        */

        const instructorProgram =
            document.getElementById(
                "instructorProgram"
            );


        if (instructorProgram) {

            instructorProgram.value =
                instructor.program ||
                "";
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RENDER LEARNERS
    |--------------------------------------------------------------------------
    */

    function renderLearners(
        learnerList
    ) {

        if (!learnerList.length) {

            studentTableBody.innerHTML = `
                <tr>

                    <td
                        colspan="6"
                        class="loading-row">

                        <i class="fa-solid fa-users"></i>

                        <br>

                        No learners found.

                    </td>

                </tr>
            `;

            return;
        }


        studentTableBody.innerHTML =
            learnerList.map(
                function (learner) {

                    const progress =
                        Number(
                            learner.progress || 0
                        );


                    /*
                    |----------------------------------------------------------
                    | Progress class
                    |----------------------------------------------------------
                    */

                    let progressClass =
                        "progress-low";


                    if (progress >= 100) {

                        progressClass =
                            "progress-complete";

                    } else if (progress >= 50) {

                        progressClass =
                            "progress-medium";
                    }


                    /*
                    |----------------------------------------------------------
                    | Status class
                    |----------------------------------------------------------
                    */

                    let statusClass =
                        "status-pending";


                    if (
                        learner.status ===
                        "Completed"
                    ) {

                        statusClass =
                            "status-completed";

                    } else if (
                        learner.status ===
                        "Active"
                    ) {

                        statusClass =
                            "status-active";
                    }


                    /*
                    |----------------------------------------------------------
                    | Class code
                    |----------------------------------------------------------
                    */

                    const classCode =
                        learner.class_codes &&
                        learner.class_codes.length
                            ? learner.class_codes.join(", ")
                            : "N/A";


                    /*
                    |----------------------------------------------------------
                    | Return table row
                    |----------------------------------------------------------
                    */

                    return `

                        <tr>

                            <td>
                                ${escapeHtml(
                                    learner.school_id ||
                                    "N/A"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    learner.name ||
                                    "N/A"
                                )}
                            </td>


                            <td>
                                ${escapeHtml(
                                    classCode
                                )}
                            </td>


                            <td>
                                ${learner.modules_assigned ?? 0}
                            </td>


                            <td>

                                <div
                                    class="progress-container">

                                    <div
                                        class="progress-bar">

                                        <div
                                            class="progress-fill ${progressClass}"
                                            style="width: ${progress}%;">

                                        </div>

                                    </div>


                                    <span>
                                        ${progress}%
                                    </span>

                                </div>

                            </td>


                            <td>

                                <span
                                    class="status-badge ${statusClass}">

                                    ${escapeHtml(
                                        learner.status ||
                                        "Pending Plan"
                                    )}

                                </span>

                            </td>

                        </tr>

                    `;
                }
            )
            .join("");
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH LEARNERS
    |--------------------------------------------------------------------------
    */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                const searchTerm =
                    this.value
                        .trim()
                        .toLowerCase();


                if (!searchTerm) {

                    renderLearners(
                        learners
                    );

                    return;
                }


                const filteredLearners =
                    learners.filter(
                        function (learner) {

                            const name =
                                (
                                    learner.name ||
                                    ""
                                ).toLowerCase();


                            const schoolId =
                                (
                                    learner.school_id ||
                                    ""
                                ).toLowerCase();


                            const classCodes =
                                (
                                    learner.class_codes ||
                                    []
                                )
                                .join(" ")
                                .toLowerCase();


                            return (

                                name.includes(
                                    searchTerm
                                )

                                ||

                                schoolId.includes(
                                    searchTerm
                                )

                                ||

                                classCodes.includes(
                                    searchTerm
                                )

                            );
                        }
                    );


                renderLearners(
                    filteredLearners
                );
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | OPEN PROFILE
    |--------------------------------------------------------------------------
    */

    function openProfile() {

        if (!profileModal) {
            return;
        }


        profileModal.classList.add(
            "show"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE PROFILE
    |--------------------------------------------------------------------------
    */

    function closeProfileModal() {

        if (!profileModal) {
            return;
        }


        profileModal.classList.remove(
            "show"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | HEADER PROFILE
    |--------------------------------------------------------------------------
    */

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            openProfile
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SIDEBAR PROFILE
    |--------------------------------------------------------------------------
    */

    if (profileMenu) {

        profileMenu.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                openProfile();
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CLOSE BUTTON
    |--------------------------------------------------------------------------
    */

    if (closeProfile) {

        closeProfile.addEventListener(
            "click",
            closeProfileModal
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CANCEL BUTTON
    |--------------------------------------------------------------------------
    */

    if (cancelProfile) {

        cancelProfile.addEventListener(
            "click",
            closeProfileModal
        );
    }


    /*
    |--------------------------------------------------------------------------
    | CLICK OUTSIDE MODAL
    |--------------------------------------------------------------------------
    */

    if (profileModal) {

        profileModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    profileModal
                ) {

                    closeProfileModal();
                }
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SAVE PROFILE
    |--------------------------------------------------------------------------
    */

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const name =
                    document.getElementById(
                        "instructorName"
                    )
                    .value
                    .trim();


                const email =
                    document.getElementById(
                        "instructorEmail"
                    )
                    .value
                    .trim();


                const contact =
                    document.getElementById(
                        "instructorPhone"
                    )
                    .value
                    .trim();


                /*
                |----------------------------------------------------------------
                | Validate
                |----------------------------------------------------------------
                */

                if (!name) {

                    alert(
                        "Name is required."
                    );

                    return;
                }


                if (!email) {

                    alert(
                        "Email is required."
                    );

                    return;
                }


                try {

                    const data =
                        await apiRequest(
                            "/instructor/profile",
                            {

                                method:
                                    "PUT",

                                body:
                                    JSON.stringify({

                                        name:
                                            name,

                                        email:
                                            email,

                                        contact:
                                            contact

                                    })

                            }
                        );


                    if (
                        data &&
                        data.success
                    ) {

                        /*
                        |--------------------------------------------------------
                        | Update header
                        |--------------------------------------------------------
                        */

                        const headerName =
                            document.getElementById(
                                "headerProfileName"
                            );


                        if (headerName) {

                            headerName.textContent =
                                data.user.name;
                        }


                        /*
                        |--------------------------------------------------------
                        | Update sessionStorage user
                        |--------------------------------------------------------
                        */

                        const storedUser =
                            sessionStorage.getItem(
                                "user"
                            );


                        if (storedUser) {

                            try {

                                const user =
                                    JSON.parse(
                                        storedUser
                                    );


                                user.name =
                                    data.user.name;


                                user.email =
                                    data.user.email;


                                user.contact =
                                    data.user.contact;


                                sessionStorage.setItem(
                                    "user",
                                    JSON.stringify(
                                        user
                                    )
                                );

                            } catch (error) {

                                console.warn(
                                    "Unable to update stored user.",
                                    error
                                );
                            }
                        }


                        showToast(
                            "Profile information updated."
                        );


                        closeProfileModal();
                    }

                } catch (error) {

                    console.error(
                        "Profile update error:",
                        error
                    );


                    alert(
                        error.message ||
                        "Unable to update profile."
                    );
                }
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PROFILE IMAGE PREVIEW
    |--------------------------------------------------------------------------
    */

    if (avatarInput) {

        avatarInput.addEventListener(
            "change",
            function () {

                const file =
                    this.files[0];


                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Please select an image file."
                    );

                    this.value = "";

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        if (profileImage) {

                            profileImage.src =
                                event.target.result;
                        }


                        if (headerAvatar) {

                            headerAvatar.src =
                                event.target.result;
                        }
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SIDEBAR TOGGLE
    |--------------------------------------------------------------------------
    */

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            function () {

                sidebar.classList.toggle(
                    "collapsed"
                );


                mainContent.classList.toggle(
                    "expanded"
                );
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();


                const confirmLogout =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmLogout) {
                    return;
                }


                sessionStorage.removeItem(
                    "token"
                );


                sessionStorage.removeItem(
                    "user"
                );


                window.location.href =
                    "../logout.html";
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | TOAST
    |--------------------------------------------------------------------------
    */

    function showToast(message) {

        if (!toast) {
            return;
        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        setTimeout(
            function () {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
    }


    /*
    |--------------------------------------------------------------------------
    | ESCAPE HTML
    |--------------------------------------------------------------------------
    */

    function escapeHtml(value) {

        return String(value)

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


    /*
    |--------------------------------------------------------------------------
    | START DASHBOARD
    |--------------------------------------------------------------------------
    */

    loadDashboard();

});