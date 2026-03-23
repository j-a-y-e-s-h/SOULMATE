# Soulmate Email Templates

This folder contains the full Supabase email-template bundle for Soulmate.

## Files

- `index.html`: visual catalog of every template
- `dashboard-map.json`: simple dashboard-slot to file mapping
- `supabase-template-manifest.json`: exact Supabase Management API key mapping
- `build-supabase-management-patch.ps1`: generates the ready-to-send PATCH payload JSON

## Generate the PATCH payload

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\email-templates\build-supabase-management-patch.ps1
```

This writes:

```text
email-templates\supabase-management-api-patch.json
```

## Apply with the Supabase Management API

```powershell
$env:SUPABASE_ACCESS_TOKEN="your-access-token"
$env:PROJECT_REF="your-project-ref"

Invoke-RestMethod `
  -Method Patch `
  -Uri "https://api.supabase.com/v1/projects/$env:PROJECT_REF/config/auth" `
  -Headers @{
    Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN"
    "Content-Type" = "application/json"
  } `
  -Body (Get-Content ".\email-templates\supabase-management-api-patch.json" -Raw)
```

## Official reference

Supabase email template docs:

- `https://supabase.com/docs/guides/auth/auth-email-templates`
