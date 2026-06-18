# NexGen Branding — Frappe White-Label App

A custom Frappe application that replaces all ERPNext and Frappe branding with **NexGen** branding across the entire system.

| Original Brand | → | NexGen Brand |
|---|---|---|
| ERPNext | → | NexGen ERP |
| Frappe CRM | → | NexGen CRM |
| Frappe HRMS | → | NexGen HRMS |
| Frappe | → | NexGen |

## ✅ What Gets Replaced

- Login page logo, title, "Powered by Frappe" footer
- Navbar brand name & logo in Desk
- Browser tab titles on all pages
- Help menu Frappe/ERPNext links (hidden)
- About dialogs
- Favicon
- App Switcher module names
- Sidebar page titles
- Boot session metadata

## 🛠️ Requirements

- **Frappe v15** or **Frappe v16**
- ERPNext, Frappe CRM, or Frappe HRMS installed on the same bench
- SSH / CLI access to your Frappe Bench

## 📦 Installation

```bash
# From your frappe-bench directory

# Step 1 — Get the app
bench get-app nexgen_branding /path/to/nexgen_branding
# OR from GitHub:
# bench get-app https://github.com/your-org/nexgen_branding

# Step 2 — Install on your site
bench --site your-site.local install-app nexgen_branding

# Step 3 — Build assets
bench build --app nexgen_branding

# Step 4 — Clear cache and restart
bench clear-cache
bench restart
```

## 🎨 Replace Logo

To use your actual NexGen logo, replace:
```
nexgen_branding/public/images/nexgen_logo.svg
nexgen_branding/public/images/nexgen_favicon.ico
```
Then run `bench build --app nexgen_branding` again.

## 🔧 Additional Branding (Manual Steps)

After installation, also configure these in the Frappe admin:

1. **Website Settings** → Set App Name = "NexGen ERP", upload logo
2. **Email Domain** → Update email signatures
3. **System Settings** → Set Company Name

## 📜 License

MIT — © NexGen Enterprises
