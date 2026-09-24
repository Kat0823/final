document.getElementById("loginForm").addEventListener("submit", function (e) {

    e.preventDefault();

    // Get user input
    const userId = document.getElementById("studentId").value.trim();
    const password = document.getElementById("password").value.trim();


    // STUDENT
    if (userId === "26-00123" && password === "student123") {
        window.location.href = "student/setup.html";

    }


    // TEACHER
    else if (userId === "teacher001" && password === "teacher123") {
        window.location.href = "teacher/dashboard.html";

    }


    // ADMIN
    else if (userId === "admin001" && password === "admin123") {
        window.location.href = "admin/dashboard.html";

    }


    // DIRECTOR
    else if (userId === "director001" && password === "director123") {
        window.location.href = "director/dashboard.html";

    }


    // INVALID ACCOUNT
    else {

        alert("Account not found! Please check your ID and password.");

    }

});