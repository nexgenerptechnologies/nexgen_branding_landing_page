# -*- coding: utf-8 -*-
from __future__ import unicode_literals

app_name = "nexgen_branding"
app_title = "NexGen Branding"
app_publisher = "NexGen Enterprises"
app_description = "White-label branding for NexGen ERP, NexGen CRM, and NexGen HRMS — replaces all Frappe/ERPNext branding with NexGen identity."
app_email = "info@nexgenenterprises.com"
app_license = "MIT"
app_version = "1.0.0"

# ─────────────────────────────────────────────────────────
# FRAPPE v15 / v16  —  Asset Injection
# ─────────────────────────────────────────────────────────

# Inject into the Desk (back-office / admin interface)
app_include_css = "/assets/nexgen_branding/css/nexgen_desk.css"
app_include_js  = "/assets/nexgen_branding/js/nexgen_desk.js"

# Inject into all public Website pages (login, portal, www/)
web_include_css = "/assets/nexgen_branding/css/nexgen_web.css"
web_include_js  = "/assets/nexgen_branding/js/nexgen_web.js"

# ─────────────────────────────────────────────────────────
# Brand Logo  (used by Frappe Desk navbar in v15/v16)
# ─────────────────────────────────────────────────────────
app_logo_url = "/assets/nexgen_branding/images/nexgen_logo.svg"

# ─────────────────────────────────────────────────────────
# Boot Session Hook
# Runs once for every logged-in user right after login.
# We use this to overwrite frappe.boot branding data.
# ─────────────────────────────────────────────────────────
boot_session = "nexgen_branding.boot.boot_session"

# ─────────────────────────────────────────────────────────
# Website Context  (public/portal pages)
# ─────────────────────────────────────────────────────────
update_website_context = "nexgen_branding.boot.update_website_context"

# ─────────────────────────────────────────────────────────
# Override "Powered by Frappe" footer template
# ─────────────────────────────────────────────────────────
# Frappe checks for overriding templates in installed-app order.
# By placing our template at the same path it will be used instead.

# ─────────────────────────────────────────────────────────
# Jinja Filters  (optional — exposes helper in templates)
# ─────────────────────────────────────────────────────────
jinja = {
    "filters": []
}

# ─────────────────────────────────────────────────────────
# Fixtures  (to export/import configuration as JSON)
# ─────────────────────────────────────────────────────────
fixtures = []
