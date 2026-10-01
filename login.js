document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async function (event) {

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

        try {

            // Connect to Laravel backend
            const response = await fetch(
                "https://improved-orbit-wvv7q6g6qrg2vx4-8000.app.github.dev/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        student_id: studentId,
                        password: password
                    })
                }
            );

            const data = await response.json();

            // Login failed
            if (!response.ok || !data.success) {
                alert(data.message || "Login failed.");
                return;
            }

            // Save login information
            sessionStorage.setItem("isLoggedIn", "true");
            sessionStorage.setItem("studentId", studentId);
            sessionStorage.setItem("userRole", data.user.role);
            sessionStorage.setItem("userName", data.user.name);

            // Save Laravel token
            sessionStorage.setItem("authToken", data.token);

            /*
             * FIRST LOGIN
             */
            if (data.first_login === true) {

                sessionStorage.setItem(
                    "firstLoginVerified",
                    "true"
                );

                // Learner password setup
                if (data.user.role === "learner") {
                    window.location.href = "student/setup.html";
                    return;
                }
            }

            /*
             * REDIRECT BASED ON ROLE
             */

            if (data.user.role === "instructor") {

                window.location.href = "teacher/dashboard.html";
                return;
            }

            if (data.user.role === "learner") {

                window.location.href = "student/classes.html";
                return;
            }

            if (data.user.role === "admin") {

                window.location.href = "Admin/dashboard.html";
                return;
            }

            alert("Unknown user role.");

        } catch (error) {

            console.error("Login error:", error);

            alert(
                "Unable to connect to the server. " +
                "Please make sure the Laravel backend is running."
            );
        }

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