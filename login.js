document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const studentId = document
            .getElementById("studentId")
            .value
            .trim();

        const password = document
            .getElementById("password")
            .value;

        if (studentId === "" || password === "") {

            alert("Please enter your Student ID and Password.");
            return;

        }

        /*
         * FRONTEND DEMO ACCOUNT
         *
         * This will be replaced by Laravel + MySQL.
         */

        const demoStudent = {
            studentId: "26-00123",
            email: "arsel@gmail.com",
            temporaryPassword: "temporary123"
        };

        /*
         * Check Student ID
         */

        if (studentId !== demoStudent.studentId) {

            alert("Student ID not found.");
            return;

        }

        /*
         * Check whether the student has already
         * created a permanent password.
         */

        const passwordSetupComplete =
            localStorage.getItem("passwordSetupComplete");

        /*
         * FIRST LOGIN
         *
         * Student must use the temporary password.
         */

        if (passwordSetupComplete !== "true") {

            if (password !== demoStudent.temporaryPassword) {

                alert(
                    "Incorrect temporary password."
                );

                return;
            }

            /*
             * Remember that this is a valid
             * first login.
             */

            sessionStorage.setItem(
                "firstLoginVerified",
                "true"
            );

            sessionStorage.setItem(
                "studentId",
                studentId
            );

            window.location.href =
                "student/setup.html";

            return;
        }

        /*
         * EXISTING ACCOUNT
         *
         * Password was previously created.
         */

        const savedPassword =
            localStorage.getItem("studentPassword");

        if (!savedPassword) {

            alert(
                "Your account needs password setup."
            );

            window.location.href =
                "student/setup.html";

            return;
        }

        /*
         * Verify the student's password.
         */

        if (password !== savedPassword) {

            alert("Incorrect password.");
            return;

        }

        /*
         * Successful login
         */

        sessionStorage.setItem(
            "isLoggedIn",
            "true"
        );

        sessionStorage.setItem(
            "studentId",
            studentId
        );

        /*
         * Go to Classes after successful login.
         */

        window.location.href =
            "student/classes.html";

    });

});


/*
 * SHOW / HIDE LOGIN PASSWORD
 */

function toggleLoginPassword() {

    const password =
        document.getElementById("password");

    const icon =
        document.getElementById("passwordIcon");

    if (!password || !icon) {
        return;
    }

    if (password.type === "password") {

        password.type = "text";

        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");

    } else {

        password.type = "password";

        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");

    }

}