console.log("Director pages loaded");


// ADD STUDENT BUTTON

function addStudent() {

    alert("Add Student feature will be available here.");

}


// VIEW STUDENT

function viewStudent(name) {

    alert("Viewing student: " + name);

}


// SEARCH STUDENT

function searchStudent() {

    const input = document.getElementById("searchStudent");

    const filter = input.value.toUpperCase();

    const table = document.getElementById("studentTable");

    const rows = table.getElementsByTagName("tr");


    for (let i = 1; i < rows.length; i++) {

        const studentName = rows[i].getElementsByTagName("td")[1];

        if (studentName) {

            const text = studentName.textContent || studentName.innerText;

            if (text.toUpperCase().indexOf(filter) > -1) {

                rows[i].style.display = "";

            } else {

                rows[i].style.display = "none";

            }

        }

    }

}

// ADD INSTRUCTOR

function addInstructor() {

    alert("Add Instructor feature will be available here.");

}


// VIEW INSTRUCTOR

function viewInstructor(name) {

    alert("Viewing instructor: " + name);

}


// SEARCH INSTRUCTOR

function searchInstructor() {

    const input = document.getElementById("searchInstructor");

    const filter = input.value.toUpperCase();

    const table = document.getElementById("instructorTable");

    const rows = table.getElementsByTagName("tr");


    for (let i = 1; i < rows.length; i++) {

        const instructorName = rows[i].getElementsByTagName("td")[1];

        if (instructorName) {

            const text =
                instructorName.textContent ||
                instructorName.innerText;


            if (text.toUpperCase().indexOf(filter) > -1) {

                rows[i].style.display = "";

            } else {

                rows[i].style.display = "none";

            }

        }

    }

}

// ADD MODULE

function addModule() {

    alert("Add Module feature will be available here.");

}


// VIEW MODULE

function viewModule(title) {

    alert("Viewing module: " + title);

}


// SEARCH MODULE

function searchModule() {

    const input = document.getElementById("searchModule");

    const filter = input.value.toUpperCase();

    const table = document.getElementById("moduleTable");

    const rows = table.getElementsByTagName("tr");


    for (let i = 1; i < rows.length; i++) {

        const moduleTitle = rows[i].getElementsByTagName("td")[1];

        if (moduleTitle) {

            const text =
                moduleTitle.textContent ||
                moduleTitle.innerText;


            if (text.toUpperCase().indexOf(filter) > -1) {

                rows[i].style.display = "";

            } else {

                rows[i].style.display = "none";

            }

        }

    }

}

// ADD ASSESSMENT

function addAssessment() {

    alert("Add Assessment feature will be available here.");

}


// VIEW ASSESSMENT

function viewAssessment(title) {

    alert("Viewing assessment: " + title);

}


// SEARCH ASSESSMENT

function searchAssessment() {

    const input = document.getElementById("searchAssessment");

    const filter = input.value.toUpperCase();

    const table = document.getElementById("assessmentTable");

    const rows = table.getElementsByTagName("tr");


    for (let i = 1; i < rows.length; i++) {

        const assessmentTitle =
            rows[i].getElementsByTagName("td")[1];


        if (assessmentTitle) {

            const text =
                assessmentTitle.textContent ||
                assessmentTitle.innerText;


            if (text.toUpperCase().indexOf(filter) > -1) {

                rows[i].style.display = "";

            } else {

                rows[i].style.display = "none";

            }

        }

    }

}

// DOWNLOAD REPORT

function downloadReport() {

    alert("Report download started!");

}

// POST ANNOUNCEMENT

const announcementForm = document.getElementById("announcementForm");

if (announcementForm) {

    announcementForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const title =
            document.getElementById("announcementTitle").value;

        const audience =
            document.getElementById("announcementAudience").value;

        const message =
            document.getElementById("announcementMessage").value;


        if (title == "" || message == "") {

            alert("Please complete all fields.");

            return;

        }


        const container =
            document.getElementById("announcementContainer");


        const newAnnouncement = document.createElement("div");

        newAnnouncement.className = "announcement-card";


        newAnnouncement.innerHTML = `

            <div class="announcement-icon">
                <i class="fa-solid fa-bullhorn"></i>
            </div>

            <div class="announcement-content">

                <div class="announcement-title">

                    <h3>${title}</h3>

                    <span class="status active-status">
                        ${audience}
                    </span>

                </div>

                <p>${message}</p>

                <small>
                    <i class="fa-solid fa-calendar"></i>
                    Posted Just Now
                </small>

            </div>

        `;


        // Add the announcement at the top
        container.prepend(newAnnouncement);


        // Clear the form
        announcementForm.reset();


        alert("Announcement posted successfully!");

    });

}

// ADD CALENDAR EVENT

const eventForm = document.getElementById("eventForm");

if (eventForm) {

    eventForm.addEventListener("submit", function(event) {

        event.preventDefault();

        const title = document.getElementById("eventTitle").value;

        const date = document.getElementById("eventDate").value;

        const type = document.getElementById("eventType").value;


        if (title == "" || date == "") {

            alert("Please complete all fields.");

            return;

        }


        const selectedDate = new Date(date);

        const day = selectedDate.getDate();

        const month = selectedDate
            .toLocaleString("en-US", {
                month: "short"
            })
            .toUpperCase();


        const container = document.getElementById("eventContainer");


        const newEvent = document.createElement("div");

        newEvent.className = "event-item";


        newEvent.innerHTML = `

            <div class="event-date">

                <strong>${day}</strong>

                <span>${month}</span>

            </div>

            <div>

                <h4>${title}</h4>

                <p>
                    <i class="fa-solid fa-calendar"></i>
                    ${type}
                </p>

            </div>

        `;


        // Add event at the top
        container.prepend(newEvent);


        // Clear form
        eventForm.reset();


        alert("Event added successfully!");

    });

}

function markAllRead() {

    const notifications =
        document.querySelectorAll(".notification-item");

    notifications.forEach(function(notification) {

        notification.classList.remove("unread");

    });

    alert("All notifications marked as read!");

}

function enableEditProfile() {

    document.getElementById("directorName").disabled = false;

    document.getElementById("directorEmail").disabled = false;

    document.getElementById("directorPosition").disabled = false;

    document.getElementById("saveProfileBtn").style.display = "inline-block";

}


const profileForm = document.getElementById("profileForm");

if (profileForm) {

    profileForm.addEventListener("submit", function(event) {

        event.preventDefault();


        const name =
            document.getElementById("directorName").value;

        const position =
            document.getElementById("directorPosition").value;


        document.getElementById("profileName").textContent = name;

        document.getElementById("profileRole").textContent = position;


        document.getElementById("directorName").disabled = true;

        document.getElementById("directorEmail").disabled = true;

        document.getElementById("directorPosition").disabled = true;


        document.getElementById("saveProfileBtn").style.display = "none";


        alert("Profile updated successfully!");

    });

}

const settingsForm = document.getElementById("settingsForm");

if (settingsForm) {

    settingsForm.addEventListener("submit", function(event) {

        event.preventDefault();

        alert("Settings saved successfully!");

    });

}


// CHANGE PASSWORD

const passwordForm = document.getElementById("passwordForm");

if (passwordForm) {

    passwordForm.addEventListener("submit", function(event) {

        event.preventDefault();


        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        if (newPassword == "" || confirmPassword == "") {

            alert("Please complete all password fields.");

            return;

        }


        if (newPassword !== confirmPassword) {

            alert("Passwords do not match!");

            return;

        }


        alert("Password changed successfully!");

        passwordForm.reset();

    });

}

// CANCEL LOGOUT

function goBack() {

    window.location.href = "dashboard.html";

}


// CONFIRM LOGOUT

function logout() {

    alert("You have successfully logged out.");

    // Go back to the main login page
    window.location.href = "../index.html";

}