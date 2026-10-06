/* =====================================================
   SIKNAYAN LOGIN
   Laravel API Authentication
===================================================== */

const API_BASE_URL = "http://localhost:8000";


/* =====================================================
   LOGIN FORM
===================================================== */

const loginForm = document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        /*
         * Prevent the normal HTML form submission.
         *
         * This prevents the browser from putting the
         * School ID and password into the URL.
         */
        event.preventDefault();


        /* =================================================
           GET FORM ELEMENTS
        ================================================= */

        const userIdElement =
            document.getElementById("studentId");

        const passwordElement =
            document.getElementById("password");

        const termsElement =
            document.getElementById("terms");


        if (!userIdElement || !passwordElement) {

            alert(
                "Login form fields are missing."
            );

            return;
        }


        /* =================================================
           GET VALUES
        ================================================= */

        const userId =
            userIdElement.value.trim();

        const password =
            passwordElement.value.trim();


        /* =================================================
           VALIDATION
        ================================================= */

        if (!userId || !password) {

            alert(
                "Please enter your ID and password."
            );

            return;
        }


        /* =================================================
           TERMS
        ================================================= */

        if (
            termsElement &&
            !termsElement.checked
        ) {

            alert(
                "Please accept the User Terms of Service and Privacy Policy."
            );

            return;
        }


        /* =================================================
           LOGIN BUTTON
        ================================================= */

        const loginButton =
            loginForm.querySelector(
                "button[type='submit']"
            );


        const originalButtonText =
            loginButton
                ? loginButton.innerHTML
                : "Login";


        if (loginButton) {

            loginButton.disabled = true;

            loginButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Logging in...
            `;
        }


        try {

            /* =================================================
               TRY LEARNER LOGIN
            ================================================= */

            console.log(
                "Checking learner account..."
            );


            let response = await fetch(
                `${API_BASE_URL}/api/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        school_id:
                            userId,

                        password:
                            password

                    })
                }
            );


            let data = await response.json();


            console.log(
                "Learner login response:",
                response.status,
                data
            );


            /* =================================================
               LEARNER SUCCESS
            ================================================= */

            if (
                response.ok &&
                data.success &&
                data.user &&
                data.user.role === "learner"
            ) {

                saveLoginSession(data);


                /* -----------------------------------------
                   FIRST LOGIN
                ----------------------------------------- */

                if (data.first_login) {

                    window.location.href =
                        "/student/setup.html";

                    return;
                }


                /* -----------------------------------------
                   NORMAL LOGIN
                ----------------------------------------- */

                window.location.href =
                    "/student/classes.html";

                return;
            }


            /* =================================================
               TRY INSTRUCTOR LOGIN
            ================================================= */

            console.log(
                "Checking instructor account..."
            );


            response = await fetch(
                `${API_BASE_URL}/api/instructor/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({

                        instructor_id:
                            userId,

                        password:
                            password

                    })
                }
            );


            data = await response.json();


            console.log(
                "Instructor login response:",
                response.status,
                data
            );


            /* =================================================
               INSTRUCTOR SUCCESS
            ================================================= */

            if (
                response.ok &&
                data.success &&
                data.user &&
                data.user.role === "instructor"
            ) {

                saveLoginSession(data);


                /* -----------------------------------------
                   FIRST LOGIN
                ----------------------------------------- */

                if (data.first_login) {

                    window.location.href =
                        "/teacher/setup.html";

                    return;
                }


                /* -----------------------------------------
                   NORMAL LOGIN
                ----------------------------------------- */

                window.location.href =
                    "/teacher/dashboard.html";

                return;
            }


            /* =================================================
               BOTH LOGINS FAILED
            ================================================= */

            alert(
                data.message ||
                "Invalid ID or password."
            );

        }


        /* =====================================================
           CONNECTION ERROR
        ===================================================== */

        catch (error) {

            console.error(
                "Login error:",
                error
            );


            alert(
                "Unable to connect to the Siknayan server."
            );
        }


        /* =====================================================
           RESTORE LOGIN BUTTON
        ===================================================== */

        finally {

            if (loginButton) {

                loginButton.disabled = false;

                loginButton.innerHTML =
                    originalButtonText;
            }
        }

    });
}


/* =====================================================
   SAVE LOGIN SESSION
===================================================== */

function saveLoginSession(data) {

    if (
        !data ||
        !data.token ||
        !data.user
    ) {

        console.error(
            "Invalid login response:",
            data
        );

        return false;
    }


    /* =================================================
       SAVE TOKEN
    ================================================= */

    /*
     * Instructor dashboard uses:
     *
     * sessionStorage.getItem("token")
     */

    sessionStorage.setItem(
        "token",
        data.token
    );


    /*
     * Keep authToken as well because other
     * Siknayan pages may use it.
     */

    sessionStorage.setItem(
        "authToken",
        data.token
    );


    /* =================================================
       SAVE USER
    ================================================= */

    sessionStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );


    /* =================================================
       SAVE ROLE
    ================================================= */

    if (data.user.role) {

        sessionStorage.setItem(
            "role",
            data.user.role
        );
    }


    /* =================================================
       SAVE FIRST LOGIN
    ================================================= */

    sessionStorage.setItem(
        "firstLogin",
        data.first_login
            ? "true"
            : "false"
    );


    console.log(
        "Login session saved."
    );

    console.log(
        "User:",
        data.user
    );


    return true;
}


/* =====================================================
   PREVENT BACK BUTTON AFTER LOGOUT
===================================================== */

window.addEventListener(
    "pageshow",
    function (event) {

        if (event.persisted) {

            window.location.reload();
        }
    }
);