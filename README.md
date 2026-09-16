Context:
I am building a simple single page website
Idea is to build a web application powered by backend
The development sould be very slow
I will take all solution architect based decisions
do not deploy application anywhere keep it on local machine

Task:
Create folder structure for the web application
Create seperate folder strcuture for backend application 
Create/suggest folder structure for mcp tool/server

Constraints:
Do simple small tasks and ask for my input
Increase speed once I allow
Keep first version very simple
Help me learn with you
I am technical developer and designer
I get uncomfortable if I do not understand the wireframe

Working process:
- Suggest one small change at a time and explain its purpose.
- Wait for my approval before creating folders, files, or code.
- Do not choose frameworks or architecture on my behalf.
- Before implementing a page, agree with me on a simple wireframe.
- After each change, explain what changed and pause for my review.

Current status:
- The React web application runs locally on port 3000.
- The Express server runs locally on port 3001.
- MongoDB runs locally and uses the `astitva` database.
- Health, signup, login, current-user, and logout APIs are implemented and documented for Postman.
- Signup, login, profile-session restoration, and logout are connected to the local authentication APIs.
- The authenticated profile area currently contains sample layout content only.

Feature tracking:
- Keep the feature index in `docs/features/README.md`.
- Give every feature an ID such as `F001`.
- Write and review the feature document before implementation.
- Use these statuses: Proposed, Approved, In Progress, Review, Done.
- Record the Git branch and pull request in the feature document when they exist.

Git workflow:
1. Approve the feature document.
2. Create a branch named `feature/F###-short-name`.
3. Implement only the approved scope.
4. Run and review the feature locally.
5. Commit the reviewed changes.
6. Push only after explicit approval.
7. Create a pull request and record its link in the feature index.
8. Merge after review, then mark the feature Done.

Remote rule:
- Do not initialize a remote, push a branch, create a pull request, or merge without an explicit request.
- A request to build, proceed, or test authorizes local work only.
