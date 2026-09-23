# Server services

This folder contains integrations used by server routes. Email delivery is local-only and sends through Mailpit on SMTP port `1025`. Finance keeps its provider interface, Plaid Sandbox adapter, synchronization logic, and token encryption under `finance/`; provider secrets never belong in browser code or committed files.
