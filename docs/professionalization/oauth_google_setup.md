# Google OAuth Setup: HomePlus

**Fecha:** 2026-06-30  
**Ejecución:** GOOGLE-001  
**Estado:** Configuración completada  

---

## 1. Estado Final

| Componente | Estado |
|------------|--------|
| **Google Cloud** | ✓ Configurado |
| **Supabase Google Provider** | ✓ Configurado |
| **Redirect URI** | ✓ Configurado |
| **Client ID** | ✓ Configurado (fuera de repo) |
| **Client Secret** | ✓ Configurado (fuera de repo) |
| **Frontend funcional** | ✗ No tocado (pendiente GOOGLE-002) |
| **Backend** | ✗ No tocado |
| **Supabase DB** | ✗ No tocado |

**Veredicto:** GOOGLE-001 **LISTO** para continuar con implementación frontend.

---

## 2. Google Cloud Console

### 2.1 Proyecto
- **Proyecto usado:** HomePlus (seleccionado/creado)
- **OAuth consent screen:** Configurado
- **Nombre visible:** HomePlus
- **Usuario de soporte:** Configurado

### 2.2 Credenciales
- **Tipo de aplicación:** Web application
- **Nombre del cliente:** HomePlus Supabase Auth
- **Client ID:** Configurado ✓
- **Client Secret:** Configurado ✓ (valor no expuesto)

### 2.3 Scopes Configurados
- `openid`
- `email`
- `profile`

### 2.4 Authorized Redirect URI
```
https://pkidoxngqdwoummbdlop.supabase.co/auth/v1/callback
```

### 2.5 Seguridad
- [x] Client Secret NO está en frontend
- [x] Client Secret NO está en repo
- [x] Client Secret NO fue commiteado
- [x] Credenciales guardadas en lugar seguro

---

## 3. Supabase Dashboard

### 3.1 Google Provider
- **Authentication → Providers → Google:** Abierto
- **Sign in with Google:** Activado ✓
- **Client ID cargado:** Sí ✓
- **Client Secret cargado:** Sí ✓ (valor no expuesto)
- **Skip nonce checks:** Apagado
- **Allow users without an email:** Apagado

### 3.2 Callback URL
```
https://pkidoxngqdwoummbdlop.supabase.co/auth/v1/callback
```

### 3.3 URL Configuration
- **Site URL:** Revisado/actualizado
- **Redirect URL agregada:** `homeplus://auth/callback` ✓

### 3.4 Verificaciones
- [x] Provider activo
- [x] Supabase DB no tocada
- [x] Migraciones no tocadas
- [x] service_role no usado
- [x] .env no tocado

---

## 4. Redirect Final

### Flujo OAuth
```
Usuario → Botón Google → Google Cloud → Browser (autenticación)
→ Supabase callback (https://pkidoxngqdwoummbdlop.supabase.co/auth/v1/callback)
→ Deep link (homeplus://auth/callback?access_token=xxx&refresh_token=xxx)
→ AuthContext handleIncomingUrl()
→ supabase.auth.setSession()
→ loadAuthMe(access_token)
→ /api/auth/me
→ Navegación según authMe.navigation.next
```

### Redirect URI Configurado
```
homeplus://auth/callback
```

---

## 5. Seguridad

### Cosas Prohibidas (Cumplidas)
- [x] Client Secret NO en frontend
- [x] Client Secret NO en repo
- [x] service_role NO usado
- [x] tokens NO en logs
- [x] .env NO tocado
- [x] Supabase DB NO tocada
- [x] Migraciones NO tocadas
- [x] Frontend funcional NO tocado (Login.tsx, AuthContext, AppNavigator intactos)
- [x] Backend NO tocado

### Almacenamiento de Credenciales
- Client ID: Guardado fuera del repo (gestor de secretos/.env no versionado)
- Client Secret: Guardado fuera del repo (gestor de secretos/.env no versionado)
- **Nunca** pegados en código fuente
- **Nunca** commiteados a Git

---

## 6. Riesgos Identificados

| Riesgo | Mitigación |
|--------|------------|
| Redirect mal configurado | Verificado: `homeplus://auth/callback` configurado en Supabase |
| Google autentica pero no vuelve a la app | Callback de Supabase configurado en Google Cloud |
| Supabase provider activo pero frontend no implementado | Pendiente GOOGLE-002 (implementación frontend) |
| Expo Go no representa flujo final | Se requiere development build para testing real (DEVBUILD-001 completado) |

---

## 7. Archivos Modificados

**Ningún archivo de código fue modificado.**

Solo documentación agregada:
- `docs/professionalization/oauth_google_setup.md` (este archivo)
- `docs/professionalization/checklist_google_oauth.md` (checklist de tarea)

---

## 8. Próximos Pasos

### GOOGLE-002 — Google OAuth Frontend Implementation
**Objetivo:** Implementar botón de Google Login en Login.tsx

**Tareas:**
1. Agregar botón "Sign in with Google" en Login.tsx
2. Implementar handler `handleGoogleSignIn()`
3. Llamar `supabase.auth.signInWithOAuth({ provider: 'google' })`
4. Configurar `redirectTo` con `homeplus://auth/callback`
5. Testear con development build
6. Verificar flujo completo: Google → Supabase → Deep link → AuthContext → /api/auth/me → Navegación

**No incluir:**
- Client Secret en código
- Cambios a AuthContext (ya maneja OAuth callbacks)
- Cambios a AppNavigator (ya decide navegación vía /api/auth/me)

---

## 9. Verificación Final

### Comandos Ejecutados
```bash
# Working tree limpio antes de empezar
git status --short
# Resultado: (no output) - limpio

# Después de documentación
git status --short
# Resultado esperado: ?? docs/professionalization/oauth_google_setup.md
```

### Archivos Nuevos
- `docs/professionalization/oauth_google_setup.md`

### Archivos Modificados
- Ninguno

### Archivos No Tocados
- `front/mi-front-limpio/Login.tsx`
- `front/mi-front-limpio/contexts/AuthContext.tsx`
- `front/mi-front-limpio/navigators/AppNavigator.tsx`
- `back/` (backend)
- `.env`
- Migraciones DB

---

## 10. Conclusión

**GOOGLE-001: LISTO**

Google OAuth provider configurado exitosamente en:
- Google Cloud Console ✓
- Supabase Dashboard ✓

Configuración externa completada sin tocar código funcional.

**Listo para continuar con:** GOOGLE-002 — Google OAuth frontend implementation

---

**Documento creado:** 2026-06-30  
**Última actualización:** 2026-06-30  
**Próxima revisión:** Al completar GOOGLE-002