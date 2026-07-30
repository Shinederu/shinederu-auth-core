# @shinederu/auth-core

Client d'authentification TypeScript reutilisable et framework-agnostic.

## Installation

```bash
npm i @shinederu/auth-core
```

## Objectif

Centraliser les actions auth (`login`, `me`, `logout`, etc.) pour les partager entre projets React et non-React.

## Exemple minimal

```ts
import { createAuthClient } from "@shinederu/auth-core";

const auth = createAuthClient({
  baseUrl: "https://api.shinederu.ch/auth/index.php",
  defaultCredentials: "include",
});

await auth.login({ username: "demo", password: "demo" });
const me = await auth.me();
console.log(me.ok, me.data);
```

## API exposee

- `login(credentials)`
- `register(payload)`
- `me()`
- `logout()`
- `logoutAll()`
- `requestPasswordReset(email)`
- `resetPassword(token, password, passwordConfirm)`
- `requestEmailUpdate(email, emailConfirm)`
- `confirmEmailUpdate(token)`
- `verifyEmail(token)`
- `revokeRegister(token)`
- `revokeEmailUpdate(token)`
- `updateProfile(username)`
- `updateAvatar(file)`
- `deleteAccount(password)`
- `invoke(method, action, payload)`

## Droits projet

`me()` peut renvoyer `user.project_access`, expose par l'API Auth:

- `project_access.is_global_admin`
- `project_access.roles`
- `project_access.permissions`

Le package type ce payload (`AuthProjectAccess`, `AuthProjectPermissions`) mais ne fournit pas encore de helper public `hasPermission`.
Les permissions backend utilisent des cles pointees (`users.manage`,
`catalog.manage`, `devices.shutdown`); l'API Auth les expose aux frontends en
cles compatibles objet (`users_manage`, `catalog_manage`,
`devices_shutdown`).
Les frontends peuvent lire ces champs ou appeler `invoke()` pour des endpoints metier; les verifications de securite restent cote backend PHP via `ProjectAccessService`.

## Points techniques

- Gestion session integree (`subscribe`, `getSession`, `restoreSession`)
- Stockage configurable (`localStorage`/memoire/custom)
- `fetch` robuste (support multi-runtime, message clair si absent)
- Build ESM autonome (imports internes `.js`)

## Scripts

```bash
npm run build
npm run clean
```
