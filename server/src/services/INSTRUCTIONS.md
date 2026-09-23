# Server services

This folder contains integrations used by server routes. Email delivery is local-only and sends through Mailpit on SMTP port `1025`. Finance keeps its provider interface, Plaid adapter, synchronization logic, and token encryption under `finance/`. The validated runtime selects only the allowlisted Sandbox or Production host; provider secrets never belong in browser code or committed files.
