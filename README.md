# @shinederu/auth-core

Client d'authentification TypeScript reutilisable, sans dependance React.

## Installation

```bash
npm i @shinederu/auth-core
```

## Exemple rapide

```ts
import { createAuthClient } from "@shinederu/auth-core";

const auth = createAuthClient({
  baseUrl: "https://api.shinederu.lol/auth/index.php",
});

await auth.login({ username: "Theo", password: "***" });
const me = await auth.me();
console.log(me.data);
```

## API principale

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
- `invoke(method, action, payload)` pour les actions custom

## Evenements d'etat

```ts
auth.subscribe((state) => {
  console.log(state.isLoading, state.error, state.session.user);
});
```

## Stockage

Par defaut:
- navigateur: `localStorage`
- hors navigateur: stockage memoire

Tu peux injecter un stockage custom via `storage`.

## Build

```bash
npm run build
```
