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
  baseUrl: "https://api.shinederu.lol/auth/index.php",
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
