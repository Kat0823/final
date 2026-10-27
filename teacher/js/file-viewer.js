/* =========================================================
   SIKNAYAN - INSTRUCTOR PORTAL
   FILE VIEWER (file-viewer.js)

   "View" shows a file in the new tab instead of downloading it:
   - PDF and images open directly;
   - Word .docx is turned into a readable page (mammoth library);
   - other files (for example old .doc) can't be shown by a browser,
     so the tab says so and offers a Download link.
   Converted Word content is shown in a sandboxed frame, so links or
   code inside a learner's file can't reach this signed-in page.

   SiknayanFileViewer.show(blob, fileName, tab)
     tab: a window opened with window.open("about:blank") before the
     download started (so the browser doesn't block it).
========================================================= */

(function () {
    "use strict";

    const MAMMOTH_URL = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";

    const TYPES = {
        pdf: "application/pdf",
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        gif: "image/gif",
        webp: "image/webp",
        // Videos and audio play in the browser.
        mp4: "video/mp4",
        m4v: "video/mp4",
        webm: "video/webm",
        mov: "video/quicktime",
        mp3: "audio/mpeg",
        wav: "audio/wav"
    };

    let mammothLoading = null;

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[character]));
    }

    function extensionOf(fileName) {
        const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
        return match ? match[1] : "";
    }

    function loadMammoth() {
        if (window.mammoth) return Promise.resolve(window.mammoth);

        mammothLoading = mammothLoading || new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = MAMMOTH_URL;
            script.onload = () => (window.mammoth ? resolve(window.mammoth) : reject(new Error("Word viewer unavailable.")));
            script.onerror = () => {
                mammothLoading = null;
                reject(new Error("The Word viewer could not be loaded. Check the internet connection."));
            };
            document.head.appendChild(script);
        });

        return mammothLoading;
    }

    /** A simple page in the new tab: title bar, body HTML. */
    function writePage(tab, fileName, bodyHtml) {
        tab.document.open();
        tab.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(fileName)}</title>
<style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2ef; color: #1f2a24; font-family: "Segoe UI", Arial, sans-serif; }
    .bar { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 12px; padding: 12px 20px;
           background: #08683c; color: #fff; border-bottom: 3px solid #e2ac2f; }
    .bar strong { font-size: 15px; overflow-wrap: anywhere; }
    .bar a { margin-left: auto; padding: 7px 14px; border-radius: 6px; background: #fff; color: #08683c;
             font-size: 13px; font-weight: 700; text-decoration: none; white-space: nowrap; }
    .paper { max-width: 900px; margin: 24px auto; background: #fff; border-radius: 8px;
             box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1); overflow: hidden; }
    .paper iframe { display: block; width: 100%; height: calc(100vh - 120px); border: 0; }
    .message { max-width: 560px; margin: 60px auto; padding: 28px; background: #fff; border-radius: 10px;
               text-align: center; box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08); line-height: 1.6; }
    .message a { display: inline-block; margin-top: 12px; padding: 9px 18px; border-radius: 6px;
                 background: #08683c; color: #fff; font-weight: 700; text-decoration: none; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`);
        tab.document.close();
    }

    function documentFrame(html) {
        const page = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
            body { margin: 0; padding: 40px 48px; font-family: Calibri, "Segoe UI", Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111; }
            img { max-width: 100%; height: auto; }
            table { border-collapse: collapse; margin: 12px 0; }
            td, th { border: 1px solid #ccc; padding: 6px 8px; vertical-align: top; }
            h1, h2, h3 { line-height: 1.3; }
        </style></head><body>${html || "<p><em>This document has no text.</em></p>"}</body></html>`;

        // No allow-scripts: nothing inside the learner's file can run.
        return `<div class="paper"><iframe sandbox="allow-popups allow-popups-to-escape-sandbox" srcdoc="${escapeHtml(page)}" title="Document"></iframe></div>`;
    }

    async function show(blob, fileName, tab) {
        const name = fileName || "file";
        let extension = extensionOf(name);

        // No usable extension in the name: use the type the server sent.
        if (!TYPES[extension] && extension !== "docx" && extension !== "doc") {
            const fromType = Object.keys(TYPES).find(key => TYPES[key] === String(blob.type).toLowerCase());
            if (fromType) extension = fromType;
            else if (/wordprocessingml/.test(blob.type)) extension = "docx";
        }
        const downloadUrl = URL.createObjectURL(blob);
        const downloadLink = `<a href="${downloadUrl}" download="${escapeHtml(name)}">Download</a>`;

        setTimeout(() => URL.revokeObjectURL(downloadUrl), 600000);

        if (!tab) {
            throw new Error("The browser blocked the new tab. Allow pop-ups for this site and try again.");
        }

        // The new tab must not be able to reach this page.
        try { tab.opener = null; } catch (error) { /* ignore */ }

        // PDF and images: the browser shows them itself.
        if (TYPES[extension]) {
            const url = URL.createObjectURL(new Blob([blob], { type: TYPES[extension] }));
            tab.location.href = url;
            setTimeout(() => URL.revokeObjectURL(url), 600000);
            return;
        }

        if (extension === "docx") {
            writePage(tab, name, `<div class="bar"><strong>${escapeHtml(name)}</strong>${downloadLink}</div>
                <div class="message">Opening the document...</div>`);

            try {
                const mammoth = await loadMammoth();
                const result = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() });
                writePage(tab, name, `<div class="bar"><strong>${escapeHtml(name)}</strong>${downloadLink}</div>${documentFrame(result.value)}`);
            } catch (error) {
                writePage(tab, name, `<div class="bar"><strong>${escapeHtml(name)}</strong></div>
                    <div class="message"><p>${escapeHtml(error.message || "This document could not be shown.")}</p>
                    <p>You can download it and open it in Word instead.</p>${downloadLink}</div>`);
            }
            return;
        }

        // Old .doc and other types: browsers can't show them.
        writePage(tab, name, `<div class="bar"><strong>${escapeHtml(name)}</strong></div>
            <div class="message">
                <p><strong>This file can't be shown in the browser.</strong></p>
                <p>${extension === "doc"
                    ? "It is an older Word (.doc) file. Download it and open it in Word."
                    : "Download it and open it on your computer."}</p>
                ${downloadLink}
            </div>`);
    }

    window.SiknayanFileViewer = { show };
})();
