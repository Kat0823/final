# Siknayan LMS: merged codebase

This folder combines two lines of work:

| Part | Taken from |
| --- | --- |
| Academic Admin portal (`academic-admin/`), System Admin portal (`system-admin/`), unified login (`index.html`), admin API, audit-log table, tests | `final.zip` (the newer upload) |
| Student portal (`student/`), Instructor portal (`instructor/`, formerly `teacher/`), instructor API controllers, learner submission/grade/notification behaviour | `final-main 4.zip` (the earlier upload) |

Nothing in this package has been run. The sandbox that built it has PHP 8.3 and could not reach Packagist, and your `composer.lock` needs PHP 8.4.1 or newer. What was checked is listed under "Checked" below.

## Folder layout

```
index.html            unified login (school ID + password, all roles)
api-config.js         the one place that sets the backend address; also defines siknayanLogout()
academic-admin/       Academic Administrator portal (the proposal's "Administrator")
system-admin/         System Administrator portal
student/              Learner portal
instructor/           Instructor portal (formerly teacher/)
Admin/, director/     early prototypes, kept only so nothing was lost; see "Still to do"
backend/              Laravel 13 API (Sanctum bearer tokens)
```

## What changed in the merge

Backend (`backend/`)
- `routes/api.php` rewritten as one file with 66 routes: login/logout, system-admin, learner, instructor and admin groups. Duplicate and conflicting routes in the newer upload were removed (for example, `/instructor/submissions` was registered twice).
- Instructor API controllers copied from the earlier upload: `InstructorCourseController`, `InstructorDashboardController`, `InstructorModuleController`, `InstructorNotificationController`, `InstructorProfileController`, `InstructorController`.
- `SubmissionController` and `GradeController` use the earlier upload's behaviour (private file storage, 409 on duplicate submission, notification only on first grade) plus the newer upload's progress tracking: a submission marks the module "in progress" (50%), grading marks it "completed" (100%).
- `Grade` model: `graded_at` added to `$fillable`. Before, Laravel silently dropped it and learners always saw `graded_at: null`.
- `Module` model: `name` is now returned as an alias of `title`. The learner pages read `module.name`; without this they show blank module titles. Casts for `module_order` and `is_published` restored.
- `NotificationController`: learner "mark one read" and "mark all read" added back (the admin notification actions from the newer upload are untouched).
- `ModuleController::material()` and `GET /api/student/modules/{id}/material`: enrolled learners can download the file an admin attached to a module. The path must start with `module-materials/` and is read from the private disk.
- Removed `app/Http/Controllers/InstructorController.php`, an unrouted duplicate that read a column (`student_id`) which no longer exists.
- `backend/CLAUDE.md` and `backend/AGENTS.md` were not copied. They tell an AI assistant to run `curl | bash` installers and add packages.

Frontend
- Every student and teacher page that called the API had a hard-coded `http://localhost:8000` or `http://127.0.0.1:8000`. They now read `window.SIKNAYAN_API_ORIGIN` / `SIKNAYAN_API_ROOT` from `api-config.js`, so one edit moves the whole site to a server.
- Logout now calls `POST /api/logout` first, which revokes the token on the server, then clears the browser. Wired into `student/logout.html`, `teacher/logout.html`, the sidebar logout in `teacher/class.html`, and the Academic Admin confirm dialog. The System Admin portal already did this.
- `teacher/logout.html`: the "Cancel" button went to `classes.html`, which does not exist in `teacher/`. It now goes to `dashboard.html`.
- `images/macross.jpg` restored; the System Admin pages reference it and the newer upload did not include it.

## Run it (not verified)

The pilot database is MySQL, as in the proposal.

**With Docker (recommended, runs MySQL, the API and the web pages together)**

```
cp .env.example .env                  # then put your own two passwords in .env
docker compose up --build             # first start installs PHP packages and runs migrations
docker compose exec backend php artisan db:seed     # first time only: creates ADMIN-001
```

Open `http://localhost:8080` for the portals. The API is at `http://localhost:8000/api`. MySQL is reachable from this computer only, on port 3306, for MySQL Workbench. Running `db:seed` again is safe: it never changes an existing `ADMIN-001`.

**Without Docker (XAMPP or any PHP 8.4.1+ with MySQL)**

```
# create an empty database first: CREATE DATABASE siknayan CHARACTER SET utf8mb4;
cd backend
composer install
cp .env.example .env                  # set DB_USERNAME / DB_PASSWORD if not root with no password
php artisan key:generate
php artisan migrate --seed
php artisan storage:link              # profile photos are served from the public disk
php artisan serve                     # http://localhost:8000
```

Serve the project root with any static server, for example `php -S localhost:8080` (local use only: it would also serve `backend/.env`), and open `http://localhost:8080/index.html`.

For a quick run without MySQL, `backend/.env.example` shows the SQLite alternative. PHPUnit always uses in-memory SQLite, so `php artisan test` needs no database.

If the API is not at `http://localhost:8000`, define `window.SIKNAYAN_API_ORIGIN` before `api-config.js` loads, or edit the default in that file.

The seeder creates one Academic Administrator, school ID `ADMIN-001`, with the password in `SIKNAYAN_SEED_ADMIN_PASSWORD` or, if that is empty, a random password it prints once. The account must choose a new password at first login.

Create a System Administrator with `php artisan siknayan:system-admin SYS-0001 --name="Your Name"` (asks for the password; add `--reset` to change it later).

### What changed in the Docker setup

- `backend/Dockerfile` was two Dockerfiles pasted together (two `FROM` lines), ended in `php -a`, and never installed packages. It is now one image with the MySQL, zip and gd extensions (the Excel import needs zip and gd).
- A new entrypoint (`backend/docker-entrypoint.sh`) creates `.env`, runs `composer install`, generates `APP_KEY`, waits for MySQL, runs migrations and links storage, then starts the server.
- `docker-compose.yml` no longer holds database passwords (they were in the public repo; change the old ones if they were ever used for anything real). It reads them from the untracked `.env`, refuses to start without them, and publishes MySQL on `127.0.0.1` only. A new `web` service (nginx) serves the portals and blocks `backend/`, dotfiles and `.sql`/`.log` files.
- `backend/.env.example` now defaults to MySQL.
- The migrations were read for MySQL problems and none were found. The only raw SQL in the app is `COUNT(*)`.
- Not tested: `docker compose config` accepts the file, and the entrypoint passes `sh -n`, but the sandbox has no Docker engine, so nothing was built or started.

## Checked

- All PHP files pass `php -l`.
- Every route in `routes/api.php` points to a controller method that exists (66 of 66).
- All inline and external JavaScript passes `node --check` (50 scripts).
- 686 local links and image paths were resolved; the broken ones are listed under "Known broken links".
- Every API path the frontend calls matches a registered route and HTTP method. The checker flagged two calls that I then confirmed by hand: the System Admin account form sends `POST` with `_method=PUT`, which Laravel accepts, and `academic-admin/js/class-details.js` builds its URLs across several lines (all six calls match a route).
- Six routes exist that no page calls: learner "mark all read", instructor module edit (`PUT /instructor/modules/{id}`), and the four Academic Admin notification actions.

Not checked: building or starting the containers, migrations, any request against the API, PHPUnit, any page opened in a browser, mobile layout.

## Left out on purpose

Your `final.zip` contained a `.env` (with `APP_KEY`), `database.sqlite`, `laravel.log` and `backup_before_admin_crud.sql`. None of them are in this package. If the repository is public, treat the `APP_KEY` and anything in the SQL dump as exposed: generate a new key and rotate any real passwords. `.gitignore` now blocks them.

## Known broken links

- `teacher/profile.html` and `teacher/reports.html` are leftovers: they link to pages that do not exist (`script.js`, `teacher.css`, `modules.html`, `grades.html`, `assessments.html`, `announcements.html`). The working instructor profile is the settings form on `teacher/dashboard.html`.
- `teacher/dashboard.html` shows `../images/profile.jpg` as the default avatar, but that file is in neither upload.
- `Admin/` and `director/` link to pages that do not exist.

## Still to do

The full review, with evidence, is in the Siknayan LMS audit document. In priority order:

1. Deleting a learner, instructor or class permanently erases submissions and grades (foreign keys cascade). Deactivate or soft-delete instead.
2. Learners and instructors created by hand are marked "password setup complete" with a password the admin typed, so they are never asked to change it. Imported accounts are handled correctly.
3. ~~Nothing creates a System Administrator.~~ Done: `php artisan siknayan:system-admin`.
4. Login has no rate limit, tokens never expire, and `.env.example` has `APP_DEBUG=true`.
5. System Admin: Audit Logs, Backup, Notifications and Profile are not connected to the backend (see the document).
6. Academic Admin: the Notifications page runs on browser storage and seeds demo events; it never calls the notification API.
7. Forgot/reset password pages are demos with a hard-coded account.
