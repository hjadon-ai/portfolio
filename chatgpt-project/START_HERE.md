# Astitva ChatGPT Project setup

This folder contains the reusable context for a ChatGPT Project used for brainstorming. It does not give ChatGPT permission to change the repository.

## Create the ChatGPT Project

1. In ChatGPT, select **New project** from the sidebar.
2. Name it **Astitva — Product Brainstorming**.
3. If ChatGPT offers a memory choice, choose **project-only memory** so this project's discussions stay focused on Astitva.
4. Open the project's **•••** menu, choose **Project settings**, and paste the complete contents of `PROJECT_INSTRUCTIONS.md` into the project instructions.
5. Add `ASTITVA_CONTEXT.md` as a project source.
6. Optionally add or connect the GitHub repository for current code lookup. Treat GitHub as a read-only source; local unpushed work may be newer.
7. Start a new chat in the project with the starter message below.

## Starter message

```text
Read the Astitva project context. Summarize how I prefer to work in no more than eight bullets. Then ask what product idea I want to brainstorm. Do not design or implement a feature until I describe the idea.
```

## Typical brainstorming request

```text
I want to brainstorm a feature for [describe the problem or idea]. Help me clarify the user outcome, simple wireframe, API needs, MongoDB changes, scope, and open decisions. Keep it small. When the proposal is ready, give me one copy-ready prompt for Codex to add the Proposed feature documents for my review. Do not generate an implementation prompt until I explicitly approve the feature.
```

## Keeping the project current

Update `ASTITVA_CONTEXT.md` when the stack, working rules, feature index, or architecture changes, then replace the uploaded project source. If the GitHub repository is connected, ask ChatGPT to read `README.md`, `docs/INSTRUCTIONS.md`, and `docs/features/README.md` before creating an implementation prompt.
