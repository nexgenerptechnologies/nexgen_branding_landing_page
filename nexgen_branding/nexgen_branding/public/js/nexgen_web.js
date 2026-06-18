/**
 * nexgen_web.js
 * NexGen Branding — Public Website / Login Page JS overrides
 * Compatible with Frappe v15 & v16
 */

(function () {
    "use strict";

    const LOGO_URL   = "/assets/nexgen_branding/images/nexgen_logo.svg";
    const BRAND_NAME = "NexGen ERP";

    function applyBrandTitle(text) {
        if (!text) return text;
        text = text.replace(/ERPNext/g,     "NexGen ERP");
        text = text.replace(/Frappe CRM/g,  "NexGen CRM");
        text = text.replace(/Frappe HRMS/g, "NexGen HRMS");
        text = text.replace(/Frappe/g,      "NexGen");
        return text;
    }

    function replaceTextNodes(node) {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const orig    = node.textContent;
            const patched = applyBrandTitle(orig);
            if (patched !== orig) node.textContent = patched;
            return;
        }
        const tag = (node.tagName || "").toLowerCase();
        if (["script","style","input","textarea"].includes(tag)) return;
        for (const child of node.childNodes) replaceTextNodes(child);
    }

    function replaceLogos() {
        document.querySelectorAll("img").forEach(img => {
            const src = img.getAttribute("src") || "";
            if (src.includes("frappe") || src.includes("erpnext")) {
                img.src = LOGO_URL;
                img.style.objectFit = "contain";
                img.style.maxHeight = "48px";
            }
        });
    }

    function patchTitle() {
        document.title = applyBrandTitle(document.title);
    }

    function hidePoweredBy() {
        document.querySelectorAll(
            ".footer-powered, .powered-by, a[href*='frappe.io'], a[href*='erpnext.com']"
        ).forEach(el => {
            el.style.display = "none";
        });
    }

    function init() {
        replaceTextNodes(document.body);
        replaceLogos();
        patchTitle();
        hidePoweredBy();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    // MutationObserver for any dynamic content
    const obs = new MutationObserver(muts => {
        muts.forEach(m => {
            m.addedNodes.forEach(n => {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    replaceTextNodes(n);
                }
            });
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    });

})();
