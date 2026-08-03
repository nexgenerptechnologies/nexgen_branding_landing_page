# -*- coding: utf-8 -*-
"""
nexgen_branding/boot.py
-----------------------
Boot-session and website-context hooks for NexGen Branding.

boot_session(bootinfo)      – runs for every authenticated user login.
update_website_context(ctx) – runs for every public website page render.
"""

import frappe


# ─────────────────────────────────────────────────────────────
# Brand map  (used by both hooks)
# ─────────────────────────────────────────────────────────────
BRAND_NAME = "NexGen"

APP_BRAND_MAP = {
    "erpnext": {
        "title": "NexGen ERP",
        "short": "NexGen ERP",
    },
    "crm": {
        "title": "NexGen CRM",
        "short": "NexGen CRM",
    },
    "hrms": {
        "title": "NexGen HRMS",
        "short": "NexGen HRMS",
    },
}

LOGO_URL      = "/assets/nexgen_branding/images/nexgen_logo.svg"
FAVICON_URL   = "/assets/nexgen_branding/images/nexgen_favicon.ico"
DEFAULT_TITLE = "NexGen ERP"


def _get_installed_app_brand():
    """Return the NexGen brand title based on installed Frappe apps."""
    installed = frappe.get_installed_apps()
    for key, brand in APP_BRAND_MAP.items():
        if key in installed:
            return brand["title"]
    return DEFAULT_TITLE


# ─────────────────────────────────────────────────────────────
# boot_session  –  Desk / authenticated users
# ─────────────────────────────────────────────────────────────
def boot_session(bootinfo):
    """
    Called by Frappe after a user's session is loaded.
    Overrides frappe.boot.* keys that drive Desk branding.
    Compatible with Frappe v15 and v16.
    """
    brand_title = _get_installed_app_brand()

    # Core branding fields read by the Desk JS runtime
    bootinfo.app_logo_url        = LOGO_URL
    bootinfo.app_name            = brand_title
    bootinfo.brand_html          = brand_title
    bootinfo.app_title           = brand_title

    if not hasattr(bootinfo, "sysdefaults"):
        bootinfo.sysdefaults = frappe._dict()

    bootinfo.sysdefaults.app_name   = brand_title
    bootinfo.sysdefaults.brand_html = brand_title

    if hasattr(bootinfo, "apps") and isinstance(bootinfo.apps, list):
        for app in bootinfo.apps:
            original_title = (app.get("title") or "").lower()
            for key, brand in APP_BRAND_MAP.items():
                if key in original_title or key in (app.get("name") or "").lower():
                    app["title"] = brand["title"]
                    app["logo"]  = LOGO_URL

    if hasattr(bootinfo, "sidebar_pages"):
        _patch_sidebar(bootinfo.sidebar_pages)
        _filter_blocked_workspaces(bootinfo.sidebar_pages)
        
    if hasattr(bootinfo, "allowed_workspaces"):
        _filter_blocked_workspaces(bootinfo.allowed_workspaces)

    # NEW: Inject blocked workspace titles for JS to hide forcibly
    bootinfo.nexgen_blocked_workspaces = _get_blocked_workspace_titles(frappe.session.user)

    bootinfo.help_links = []


def _patch_sidebar(sidebar_pages):
    """Recursively rename any sidebar item that contains ERPNext / Frappe."""
    replacements = {
        "ERPNext": "NexGen ERP",
        "Frappe CRM": "NexGen CRM",
        "Frappe HRMS": "NexGen HRMS",
        "Frappe": "NexGen",
    }
    for page in (sidebar_pages or []):
        title = page.get("title") or ""
        for old, new in replacements.items():
            title = title.replace(old, new)
        page["title"] = title
        # Recurse into children
        _patch_sidebar(page.get("items") or [])


# ─────────────────────────────────────────────────────────────
# update_website_context  –  public website / portal pages
# ─────────────────────────────────────────────────────────────
def update_website_context(context):
    """
    Called by Frappe for every public page render.
    Overrides template context variables used in base layouts.
    Compatible with Frappe v15 and v16.
    """
    brand_title = _get_installed_app_brand()

    context["powered_by"]     = ""          # blank out "Powered by Frappe"
    context["hide_powered_by"] = True


def _filter_blocked_workspaces(sidebar_items):
    """
    Option 2: Filter out workspaces if their linked Module is unchecked
    in the User's 'Allow Modules' profile.
    """
    if frappe.session.user == "Administrator":
        return
        
    try:
        user = frappe.get_doc("User", frappe.session.user)
        blocked_modules = [d.module for d in user.get("block_modules", [])]
        
        if not blocked_modules:
            return

        workspaces = frappe.get_all("Workspace", fields=["name", "module"])
        ws_module_map = {w.name: w.module for w in workspaces}
        
        # Hardcoded fallback map because Frappe v15 standard workspaces 
        # often leave the 'module' database field blank!
        FALLBACK_MAP = {
            "Accounting": "Accounts",
            "Accounts": "Accounts",
            "Assets": "Assets",
            "Buying": "Buying",
            "CRM": "CRM",
            "HR": "HR",
            "India Compliance": "GST India",
            "Manufacturing": "Manufacturing",
            "Projects": "Projects",
            "Quality": "Quality Management",
            "Selling": "Selling",
            "Stock": "Stock",
            "Subcontracting": "Subcontracting",
            "Support": "Support",
            "Organization": "Core",
            "Settings": "Setup",
            "ERPNext Settings": "Setup",
            "NexGen ERP Settings": "Setup",
            "Website": "Website",
            "Integrations": "Integrations",
            "Customization": "Custom",
            "Build": "Custom"
        }

        def filter_recursive(items):
            filtered = []
            for item in items:
                ws_name = item.get("name")
                ws_title = item.get("title")
                
                # 1. Try DB module field
                ws_module = ws_module_map.get(ws_name)
                
                # 2. Try fallback mapping by name or title
                if not ws_module:
                    ws_module = FALLBACK_MAP.get(ws_name) or FALLBACK_MAP.get(ws_title)
                
                # 3. Direct match if title is exactly the module name
                if not ws_module:
                    ws_module = ws_title
                
                if ws_module and ws_module in blocked_modules:
                    continue
                    
                if item.get("items"):
                    filter_recursive(item["items"])
                    
                filtered.append(item)
            items[:] = filtered

        filter_recursive(sidebar_items)
        
    except Exception as e:
        frappe.log_error(title="NexGen Branding Workspace Filter", message=str(e))



def get_workspace_query_condition(user):
    """
    Enforce 'Allow Modules' at the database level for the Workspace API.
    Frappe Desk fetches Desktop icons dynamically via API; this hook intercepts
    the SQL query to permanently hide blocked workspaces.
    """
    if not user or user == "Administrator":
        return ""

    try:
        user_doc = frappe.get_doc("User", user)
        blocked_modules = [d.module for d in user_doc.get("block_modules", [])]
        if not blocked_modules:
            return ""

        workspaces = frappe.get_all("Workspace", fields=["name", "module", "title"])
        
        FALLBACK_MAP = {
            "Accounting": "Accounts",
            "Accounts": "Accounts",
            "Assets": "Assets",
            "Buying": "Buying",
            "CRM": "CRM",
            "HR": "HR",
            "India Compliance": "GST India",
            "Manufacturing": "Manufacturing",
            "Projects": "Projects",
            "Quality": "Quality Management",
            "Selling": "Selling",
            "Stock": "Stock",
            "Subcontracting": "Subcontracting",
            "Support": "Support",
            "Organization": "Core",
            "Settings": "Setup",
            "ERPNext Settings": "Setup",
            "NexGen ERP Settings": "Setup",
            "Website": "Website",
            "Integrations": "Integrations",
            "Customization": "Custom",
            "Build": "Custom"
        }

        blocked_names = []
        for w in workspaces:
            ws_mod = w.module or FALLBACK_MAP.get(w.name) or FALLBACK_MAP.get(w.title) or w.title
            if ws_mod in blocked_modules:
                blocked_names.append(w.name)

        if blocked_names:
            # Format safely for SQL IN clause
            safe_names = []
            for n in blocked_names:
                safe_n = str(n).replace("'", "''")
                safe_names.append(f"'{safe_n}'")
            return f"\	abWorkspace\.name NOT IN ({', '.join(safe_names)})"

    except Exception as e:
        frappe.log_error("NexGen Workspace Query Error", str(e))

    return ""

def _get_blocked_workspace_titles(user):
    if not user or user == "Administrator":
        return []
    try:
        doc = frappe.get_doc("User", user)
        blocked_modules = [d.module for d in doc.get("block_modules", [])]
        if not blocked_modules:
            return []
            
        workspaces = frappe.get_all("Workspace", fields=["name", "module", "title"])
        FALLBACK_MAP = {
            "Accounting": "Accounts", "Accounts": "Accounts", "Assets": "Assets",
            "Buying": "Buying", "CRM": "CRM", "HR": "HR", "India Compliance": "GST India",
            "Manufacturing": "Manufacturing", "Projects": "Projects", "Quality": "Quality Management",
            "Selling": "Selling", "Stock": "Stock", "Subcontracting": "Subcontracting",
            "Support": "Support", "Organization": "Core", "Settings": "Setup",
            "ERPNext Settings": "Setup", "NexGen ERP Settings": "Setup", "Website": "Website",
            "Integrations": "Integrations", "Customization": "Custom", "Build": "Custom"
        }
        
        blocked_titles = []
        for w in workspaces:
            ws_mod = w.module or FALLBACK_MAP.get(w.name) or FALLBACK_MAP.get(w.title) or w.title
            if ws_mod in blocked_modules:
                blocked_titles.append(w.title or w.name)
        return blocked_titles
    except Exception:
        return []
