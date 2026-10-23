/* =========================================================
   SIKNAYAN - CLASS CARDS (shared by the Instructor and Learner
   Classes pages; styles in shared/class-cards.css)

   SiknayanClassCards.create({ id, href, code, name, meta, footer })
   returns an <a> card. The banner design (one of six) is picked from
   the class ID, so it looks random but a class always gets the same
   design, on both portals. Text is always set with textContent.
========================================================= */

(function () {
    "use strict";

    const DESIGNS = 6;

    /** 1..6, stable for a class ID (or code when there is no ID). */
    function designFor(id, code) {
        const key = String(id ?? code ?? "");
        let hash = 2166136261;

        for (let i = 0; i < key.length; i++) {
            hash ^= key.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        return (Math.abs(hash) % DESIGNS) + 1;
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    }

    function icon(className) {
        const node = element("i", className);
        node.setAttribute("aria-hidden", "true");
        return node;
    }

    /**
     * meta:   [{ icon: "fa-solid fa-...", text: "..." }]
     * footer: { progress: { label, done, total } }
     *         or { chips: [{ icon, text }], open: "Open class" }
     */
    function create(options) {
        const card = element("a", `sk-class-card`);
        card.href = options.href || "#";

        const banner = element("div", `sk-class-banner sk-art-${designFor(options.id, options.code)}`);
        const badge = element("span", "sk-class-badge");
        badge.setAttribute("aria-hidden", "true");
        badge.appendChild(icon(options.badgeIcon || "fa-solid fa-book-open"));
        banner.append(element("span", "sk-class-code", options.code || "CLASS"), badge);

        const body = element("div", "sk-class-body");
        body.appendChild(element("h3", "sk-class-title", options.name || "Unnamed Class"));

        (options.meta || []).forEach(item => {
            if (!item || !item.text) return;
            const row = element("div", "sk-class-meta");
            row.append(icon(item.icon), element("span", "", item.text));
            body.appendChild(row);
        });

        const footer = options.footer || {};
        const foot = element("div", "sk-class-footer");

        if (footer.progress) {
            const { label, done, total } = footer.progress;
            const percent = total > 0 ? Math.round((Math.min(done, total) / total) * 100) : 0;

            const labelRow = element("div", "sk-class-progress-label");
            labelRow.append(element("span", "", label || "Progress"), element("span", "", `${done} / ${total}`));

            const bar = element("div", "sk-class-progress");
            bar.setAttribute("role", "progressbar");
            bar.setAttribute("aria-label", label || "Progress");
            bar.setAttribute("aria-valuemin", "0");
            bar.setAttribute("aria-valuemax", "100");
            bar.setAttribute("aria-valuenow", String(percent));
            const fill = element("span");
            fill.style.width = `${percent}%`;
            bar.appendChild(fill);

            foot.append(labelRow, bar);
        } else {
            const chips = element("div", "sk-class-chips");
            (footer.chips || []).forEach(chip => {
                const node = element("span", "sk-class-chip");
                node.append(icon(chip.icon), document.createTextNode(chip.text));
                chips.appendChild(node);
            });
            if (footer.open) chips.appendChild(element("span", "sk-class-open", footer.open));
            foot.appendChild(chips);
        }

        body.appendChild(foot);
        card.append(banner, body);
        return card;
    }

    window.SiknayanClassCards = { create, designFor };
})();
