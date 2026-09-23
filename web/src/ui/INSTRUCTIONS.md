# Shared presentation components

This folder contains visual components used across Astitva. Components accept content, state, and callbacks from feature screens; they do not call APIs or own Diet, Finance, or authentication business rules.

- Use semantic classes and tokens from `../styles.css`.
- Keep buttons, surfaces, headers, fields, badges, status messages, empty/loading states, confirmation dialogs, and the application shell accessible by keyboard.
- Use individually imported Lucide icons with `aria-hidden` when adjacent text already names the action. Icon-only controls require an accessible label and tooltip.
- Keep the desktop sidebar expanded. Keep the mobile drawer dismissible by its close button, overlay, navigation choice, and Escape, returning focus to the menu button.
