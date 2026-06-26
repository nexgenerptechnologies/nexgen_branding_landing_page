content = """[project]
name = "nexgen_branding"
version = "1.0.0"
authors = [
    { name = "NexGen Enterprises", email = "info@nexgenenterprises.com" }
]
description = "White-label branding for NexGen ERP"
requires-python = ">=3.10"
readme = "README.md"
dependencies = [
    "frappe"
]

[build-system]
requires = ["flit_core >=3.4,<4"]
build-backend = "flit_core.buildapi"
"""
with open('pyproject.toml', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
