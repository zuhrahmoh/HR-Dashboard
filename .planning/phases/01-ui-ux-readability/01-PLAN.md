---
phase: 01
name: UI/UX readability refresh
---

## Goal

Improve dashboard readability by updating global typography (font + sizing) and smoothing the dark color palette/contrast (especially navigation) using modern Google UI/readability best practices.

## Must-haves

- Use a readable sans-serif font and consistent font scale across the app.
- Improve contrast and reduce harsh “white block” active states in navigation.
- Keep changes global/minimal so pages/components benefit without large rewrites.

## Planned changes

- Add Inter font and global base typography styles in `hr-dashboard/app/assets/css/tailwind.css`.
- Extend Tailwind `fontFamily.sans` to include Inter in `hr-dashboard/tailwind.config.ts`.
- Update layout palette and nav active/hover states in `hr-dashboard/app/layouts/default.vue`.

