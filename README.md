# 📁 hover-explainer — Understand Your Project at a Glance

`hover-explainer` is a lightweight VS Code extension that shows contextual tooltips on hover over files and folders in the Explorer. Ideal for large teams, onboarding, and open source contributors.

### 🛠 Features

- 📝 Hover over any file/folder to see its description
- ⚙️ `.fileDescriptions.json` is auto-maintained:
  - Automatically adds new files/folders
  - Removes deleted ones
  - Updates on rename
- ✅ Simple JSON-based config, easily version-controlled
- 🔍 Helps you understand codebase structure at a glance

### 📂 How it Works

1. On first use, the extension creates a `.fileDescriptions.json` file in your root directory.
2. When files/folders are created, renamed, or deleted, the file is updated automatically.
3. Add or edit descriptions manually in that JSON file.

### 📸 Screenshot

> _Include a screenshot or gif here showing the tooltip hover in the file explorer._

### 🚀 Installation

Search for `hover-docs` in the VS Code Marketplace or install via CLI:

```bash
code --install-extension ayan-de.hover-docs
```
