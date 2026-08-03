/**
 * nexgen_desk.js
 * NexGen Branding â€” Frappe Desk (back-office) JS overrides
 * Compatible with Frappe v15 & v16
 *
 * Strategy:
 *  1. Override frappe.boot metadata (app name, logo, etc.)
 *  2. Replace visible text nodes containing Frappe/ERPNext branding
 *  3. Use MutationObserver to catch dynamically-rendered content
 *  4. Patch document.title on every route change
 */

(function () {
    "use strict";

    /* â”€â”€ Brand Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const BRAND_MAP = {
        "ERPNext"   : "NexGen ERP",
        "Frappe CRM": "NexGen CRM",
        "Frappe HRMS": "NexGen HRMS",
        "Frappe"    : "NexGen",
        "frappe"    : "NexGen",
        "erpnext"   : "nexgen-erp",
    };

    const LOGO_URL = "/assets/nexgen_branding/images/nexgen_logo.svg";

    /* â”€â”€ Determine primary brand from installed apps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function getPrimaryBrand() {
        if (!frappe || !frappe.boot) return "NexGen ERP";
        const apps = (frappe.boot.apps || []).map(a => (a.name || "").toLowerCase());
        if (apps.includes("crm"))   return "NexGen CRM";
        if (apps.includes("hrms"))  return "NexGen HRMS";
        return "NexGen ERP";
    }

    /* â”€â”€ Apply text brand â†’ displayed title map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function applyBrandTitle(text) {
        if (!text) return text;
        // Order matters: longest match first
        text = text.replace(/ERPNext/g,    "NexGen ERP");
        text = text.replace(/Frappe CRM/g, "NexGen CRM");
        text = text.replace(/Frappe HRMS/g,"NexGen HRMS");
        text = text.replace(/Frappe/g,     "NexGen");
        return text;
    }

    /* â”€â”€ Replace text nodes recursively â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function replaceTextNodes(node) {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            const orig = node.textContent;
            const patched = applyBrandTitle(orig);
            if (patched !== orig) node.textContent = patched;
            return;
        }
        // Skip script, style, input, textarea
        const tag = (node.tagName || "").toLowerCase();
        if (["script","style","input","textarea","code","pre"].includes(tag)) return;
        for (const child of node.childNodes) {
            replaceTextNodes(child);
        }
    }

    /* â”€â”€ Replace img src that points to frappe/erpnext logos â”€â”€â”€ */
    function replaceLogos(root) {
        const imgs = (root || document).querySelectorAll("img");
        imgs.forEach(img => {
            const src = img.getAttribute("src") || "";
            if (src.includes("frappe-logo") || src.includes("erpnext-logo") ||
                src.includes("frappe_logo") || src.includes("erpnext_logo")) {
                img.src = LOGO_URL;
                img.style.objectFit = "contain";
            }
        });
    }

    /* â”€â”€ Patch document.title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function patchTitle() {
        if (document.title) {
            document.title = applyBrandTitle(document.title);
        }
    }

    /* â”€â”€ Patch frappe.boot at startup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function patchBoot() {
        if (!window.frappe || !frappe.boot) return;

        const brand = getPrimaryBrand();

        frappe.boot.app_logo_url  = LOGO_URL;
        frappe.boot.app_name      = brand;
        frappe.boot.app_title     = brand;
        frappe.boot.brand_html    = brand;

        if (frappe.boot.sysdefaults) {
            frappe.boot.sysdefaults.app_name   = brand;
            frappe.boot.sysdefaults.brand_html = brand;
        }

        // Patch apps list used by app-switcher
        if (Array.isArray(frappe.boot.apps)) {
            frappe.boot.apps.forEach(app => {
                const n = (app.name || "").toLowerCase();
                if (n.includes("erpnext")) {
                    app.title = "NexGen ERP";
                    app.logo  = LOGO_URL;
                } else if (n.includes("crm")) {
                    app.title = "NexGen CRM";
                    app.logo  = LOGO_URL;
                } else if (n.includes("hrms")) {
                    app.title = "NexGen HRMS";
                    app.logo  = LOGO_URL;
                } else if (n.includes("frappe")) {
                    app.title = applyBrandTitle(app.title || "");
                }
            });
        }

        // Clear help_links to remove Frappe community references
        frappe.boot.help_links = [];
    }

    /* â”€â”€ Full page scan & replace â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function runBrandingPass(root) {
        cleanSidebarItems();
        replaceTextNodes(root || document.body);
        replaceLogos(root || document);
        patchTitle();
    }

    /* â”€â”€ MutationObserver â€” watch for DOM additions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function startObserver() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(m => {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        runBrandingPass(node);
                    }
                });
                // Also catch character data changes (direct text edits)
                if (m.type === "characterData") {
                    const node = m.target;
                    const patched = applyBrandTitle(node.textContent || "");
                    if (patched !== node.textContent) node.textContent = patched;
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    /* â”€â”€ Frappe route-change hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function hookFrappeRouter() {
        if (!window.frappe) return;

        // v15/v16 uses frappe.router.on("change")
        if (frappe.router && frappe.router.on) {
            frappe.router.on("change", () => {
                setTimeout(() => runBrandingPass(document.body), 150);
                patchTitle();
            });
        }

        // Fallback: hook frappe.pages events
        $(document).on("page-change", () => {
            setTimeout(() => runBrandingPass(document.body), 150);
            patchTitle();
        });
    }

    /* â”€â”€ Patch App-Switcher dialog (v15 feature) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function patchAppSwitcher() {
        if (!window.frappe) return;
        const orig = frappe.ui && frappe.ui.AppFrame && frappe.ui.AppFrame.prototype;
        if (orig && orig.set_title) {
            const _orig_set_title = orig.set_title.bind(orig);
            orig.set_title = function (title) {
                return _orig_set_title.call(this, applyBrandTitle(title));
            };
        }
    }

    /* â”€â”€ Override navbar brand text DOM element â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function patchNavbar() {
        const navbarBrand = document.querySelector(".navbar-brand");
        if (navbarBrand) {
            const textNode = [...navbarBrand.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
            if (textNode) textNode.textContent = applyBrandTitle(textNode.textContent);
        }

        // Attempt to set logo image
        const logoImg = document.querySelector(".navbar-brand img, .navbar-logo img");
        if (logoImg) {
            const src = logoImg.getAttribute("src") || "";
            if (src.includes("frappe") || src.includes("erpnext") || !src) {
                logoImg.src = LOGO_URL;
            }
        }
    }

                        /* Absolute brute-force sweeper for v16 Desktop Icons & Sidebar */
    function cleanSidebarItems() {
        const itemsToHide = ['Help', 'Delete Demo Data', 'Keyboard Shortcuts', 'System Health'];
        
        if (frappe.boot && Array.isArray(frappe.boot.nexgen_blocked_workspaces)) {
            itemsToHide.push(...frappe.boot.nexgen_blocked_workspaces);
        }

        // 1. Search every leaf text element on the page
        const allElements = document.querySelectorAll("span, div, a, p, h1, h2, h3, h4, h5, h6");
        
        allElements.forEach(el => {
            if (el.children.length === 0 && el.textContent) {
                const text = el.textContent.trim();
                
                if (itemsToHide.includes(text) || (text.startsWith("NexGen ER") && itemsToHide.includes("ERPNext Settings"))) {
                    let container = el.parentElement;
                    let hidden = false;
                    
                    // Walk up the DOM tree to find the widget card or sidebar item
                    while (container && container !== document.body) {
                        const classes = container.className || "";
                        if (typeof classes === 'string' && (
                            classes.includes('shortcut') || 
                            classes.includes('workspace') ||
                            classes.includes('desk-sidebar') ||
                            classes.includes('standard-sidebar') ||
                            classes.includes('widget') ||
                            classes.includes('hub-card') ||
                            classes.includes('sidebar-action') ||
                            classes.includes('card')
                        )) {
                            // Prevent hiding the entire page by checking component size
                            if (container.offsetWidth < 600 || classes.includes('desk-sidebar')) {
                                container.style.setProperty('display', 'none', 'important');
                                hidden = true;
                                
                                // Hide the parent grid column to prevent blank spaces
                                const col = container.parentElement;
                                if (col && typeof col.className === 'string' && col.className.includes('col-')) {
                                    col.style.setProperty('display', 'none', 'important');
                                }
                                break;
                            }
                        }
                        container = container.parentElement;
                    }
                    
                    // Fallback if no specific container class was found
                    if (!hidden) {
                        let link = el.closest('a') || el.closest('li') || el.closest('[data-name]');
                        if (link) link.style.setProperty('display', 'none', 'important');
                    }
                }
            }
        });
    }/* Override Help menu items */
    function cleanHelpMenu() {
        const helpLinks = document.querySelectorAll(
            ".help-links a, .dropdown-menu a[href*='frappe.io'], " +
            ".dropdown-menu a[href*='erpnext.com'], " +
            ".dropdown-menu a[href*='frappecloud.com']"
        );
        helpLinks.forEach(el => {
            const li = el.closest("li");
            if (li) li.style.display = "none";
        });
    }

    /* â”€â”€ About dialog override â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function patchAboutDialog() {
        $(document).on("shown.bs.modal", ".modal", function () {
            const modal = $(this);
            // Replace any Frappe/ERPNext text inside about dialogs
            const body = modal.find(".modal-body")[0];
            if (body) replaceTextNodes(body);
            replaceLogos(modal[0]);
        });
    }

    /* â”€â”€ Entry Point â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function init() {
        patchBoot();

        // Run immediately
        runBrandingPass(document.body);
        patchNavbar();
        cleanHelpMenu();
        patchAboutDialog();

        // Hook into Frappe router for SPA page changes
        hookFrappeRouter();
        patchAppSwitcher();

        // Start the observer AFTER initial pass
        startObserver();

        // Re-run after Frappe desk is fully ready
        if (window.frappe) {
            frappe.ready(function () {
                patchBoot();
                runBrandingPass(document.body);
                patchNavbar();
                cleanHelpMenu();
            });
            // v15/v16 uses frappe.after_ajax for post-AJAX updates
            if (frappe.after_ajax) {
                frappe.after_ajax(function () {
                    runBrandingPass(document.body);
                    patchNavbar();
                    patchTitle();
                });
            }
        }
    }

    // Run once DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();





