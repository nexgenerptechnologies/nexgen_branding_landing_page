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
    bootinfo.app_name            = brand_title          # used as navbar title fallback
    bootinfo.brand_html          = brand_title          # brand HTML in some themes
    bootinfo.app_title           = brand_title

    # System defaults (sysdefaults) – controls various UI labels
    if not hasattr(bootinfo, "sysdefaults"):
        bootinfo.sysdefaults = frappe._dict()

    bootinfo.sysdefaults.app_name   = brand_title
    bootinfo.sysdefaults.brand_html = brand_title

    # Patch the "apps" list that drives the app-switcher in v15/v16 Desk
    if hasattr(bootinfo, "apps") and isinstance(bootinfo.apps, list):
        for app in bootinfo.apps:
            original_title = (app.get("title") or "").lower()
            for key, brand in APP_BRAND_MAP.items():
                if key in original_title or key in (app.get("name") or "").lower():
                    app["title"] = brand["title"]
                    app["logo"]  = LOGO_URL

    # Sidebar / workspace module titles  (v15 sidebar_pages)
    if hasattr(bootinfo, "sidebar_pages"):
        _patch_sidebar(bootinfo.sidebar_pages)

    # Remove help links that reveal Frappe/ERPNext branding
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

    context["app_name"]       = brand_title
    context["brand_html"]     = brand_title
    context["app_logo_url"]   = LOGO_URL
    context["favicon"]        = FAVICON_URL
    context["powered_by"]     = ""          # blank out "Powered by Frappe"
    context["hide_powered_by"] = True
