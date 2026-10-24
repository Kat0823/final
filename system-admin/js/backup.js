/* =========================================================
   SIKNAYAN - SYSTEM ADMIN
   DATA BACKUP (backup.js)

   Make a backup (database + uploaded files in one zip, optionally
   password-protected), list saved backups, download or delete them.
   API: /api/system-admin/backups (System Admin only).
========================================================= */

(function () {
    "use strict";

    const $ = id => document.getElementById(id);
    if (!$("backupForm")) return;

    function token() {
        return sessionStorage.getItem("authToken") ||
            localStorage.getItem("siknayan_api_token") || "";
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    async function api(path, options = {}) {
        const headers = { Accept: "application/json", Authorization: `Bearer ${token()}` };
        if (options.body) headers["Content-Type"] = "application/json";

        let response;
        try {
            response = await fetch(`${window.SIKNAYAN_API_ROOT}/system-admin${path}`, {
                method: options.method || "GET",
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined
            });
        } catch (error) {
            throw new Error("Cannot reach the server. Check that the backend is running.");
        }

        if (response.status === 401 || response.status === 403) {
            if (typeof redirectToLogin === "function") redirectToLogin();
            throw new Error("Your session has ended. Please log in again.");
        }

        if (options.raw) {
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "The backup could not be downloaded.");
            }
            return response;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success === false) {
            const firstError = data.errors && Object.values(data.errors)[0];
            throw new Error((Array.isArray(firstError) ? firstError[0] : firstError) || data.message || "Something went wrong.");
        }

        return data;
    }

    function size(bytes) {
        const value = Number(bytes) || 0;
        if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
        if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
        return `${Math.max(1, Math.round(value / 1024))} KB`;
    }

    function when(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return { day: "—", time: "" };
        return {
            day: date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }),
            time: date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
        };
    }

    function message(text, type = "") {
        const box = $("backupMessage");
        box.textContent = text || "";
        box.className = `backup-message${type ? ` ${type}` : ""}`;
    }

    function icons() {
        if (window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }

    /* ---------------- Saved backups ---------------- */

    async function loadBackups() {
        const rows = $("backupRows");

        try {
            const data = await api("/backups");
            const backups = Array.isArray(data.backups) ? data.backups : [];

            if (!backups.length) {
                rows.innerHTML = '<tr><td colspan="6" class="backup-empty">No backups yet. Use "Run backup now" to make the first one.</td></tr>';
                return;
            }

            rows.innerHTML = backups.map(item => {
                const date = when(item.created_at);
                const counts = item.counts || {};
                const files = item.files || {};
                const contents = [
                    counts.users !== undefined ? `${counts.users} accounts` : "",
                    counts.submissions !== undefined ? `${counts.submissions} submissions` : "",
                    files.count !== undefined ? `${files.count} files` : ""
                ].filter(Boolean).join(" · ") || "—";

                return `
                    <tr data-backup-name="${escapeHtml(item.name)}">
                        <td><strong>${escapeHtml(date.day)}</strong><small>${escapeHtml(date.time)}</small></td>
                        <td>${escapeHtml(size(item.size))}</td>
                        <td>${escapeHtml(contents)}<small>${escapeHtml(item.name)}</small></td>
                        <td>${item.encrypted
                            ? '<span class="backup-lock yes"><i data-lucide="lock"></i> Protected</span>'
                            : '<span class="backup-lock no">None</span>'}</td>
                        <td>${escapeHtml(item.created_by || "—")}</td>
                        <td>
                            <div class="backup-row-actions">
                                <button type="button" class="secondary-button" data-backup-download>
                                    <i data-lucide="download"></i> Download
                                </button>
                                <button type="button" class="danger-button" data-backup-delete>
                                    <i data-lucide="trash-2"></i> Delete
                                </button>
                            </div>
                        </td>
                    </tr>`;
            }).join("");

            icons();
        } catch (error) {
            rows.innerHTML = `<tr><td colspan="6" class="backup-empty">${escapeHtml(error.message)}</td></tr>`;
        }
    }

    $("backupRows").addEventListener("click", async event => {
        const row = event.target.closest("[data-backup-name]");
        if (!row) return;
        const name = row.dataset.backupName;

        const download = event.target.closest("[data-backup-download]");
        if (download) {
            download.disabled = true;
            try {
                const response = await api(`/backups/${encodeURIComponent(name)}/download`, { raw: true });
                const url = URL.createObjectURL(await response.blob());
                const link = document.createElement("a");
                link.href = url;
                link.download = name;
                document.body.appendChild(link);
                link.click();
                link.remove();
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            } catch (error) {
                message(error.message, "error");
            } finally {
                download.disabled = false;
            }
            return;
        }

        const remove = event.target.closest("[data-backup-delete]");
        if (remove) {
            if (!window.confirm(`Delete the backup ${name}?\n\nOnly do this if you have a copy elsewhere. This can't be undone.`)) return;
            remove.disabled = true;
            try {
                await api(`/backups/${encodeURIComponent(name)}`, { method: "DELETE" });
                message("Backup deleted.", "success");
                await loadBackups();
            } catch (error) {
                message(error.message, "error");
                remove.disabled = false;
            }
        }
    });

    /* ---------------- Make a backup ---------------- */

    $("backupProtect").addEventListener("change", () => {
        const on = $("backupProtect").checked;
        $("backupPasswordFields").hidden = !on;
        if (on) $("backupPassword").focus();
        else {
            $("backupPassword").value = "";
            $("backupPasswordConfirm").value = "";
        }
    });

    $("backupForm").addEventListener("submit", async event => {
        event.preventDefault();
        message("");

        const protect = $("backupProtect").checked;
        const password = $("backupPassword").value;
        const confirmation = $("backupPasswordConfirm").value;

        if (protect) {
            if (password.length < 8) return message("The backup password must be at least 8 characters.", "error");
            if (password !== confirmation) return message("The two backup passwords do not match.", "error");
        }

        const button = $("runBackupButton");
        button.disabled = true;
        button.querySelector("span").textContent = "Making the backup...";
        message("Saving the database and uploaded files. This can take a minute.");

        try {
            const data = await api("/backups", {
                method: "POST",
                body: protect ? { password, password_confirmation: confirmation } : {}
            });

            $("backupPassword").value = "";
            $("backupPasswordConfirm").value = "";
            message(
                `Backup ready (${size(data.backup?.size)}). Download it and keep a copy away from this computer.` +
                (protect ? " Remember: it opens only with the password you just typed." : ""),
                "success"
            );
            await loadBackups();
        } catch (error) {
            message(error.message, "error");
        } finally {
            button.disabled = false;
            button.querySelector("span").textContent = "Run backup now";
        }
    });

    loadBackups();
})();
