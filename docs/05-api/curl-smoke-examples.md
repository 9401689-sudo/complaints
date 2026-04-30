# Curl Smoke Examples

```bash
# Public health
curl -i https://complaints-api.doorsvip.ru/complaints_m/api/health

# Login
curl -i -X POST https://complaints-api.doorsvip.ru/complaints_m/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nickname":"<user>","password":"<password>"}'

# Me (replace TOKEN)
curl -i https://complaints-api.doorsvip.ru/complaints_m/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Public directories as guest
curl -i https://complaints-api.doorsvip.ru/complaints_m/api/institutions
curl -i https://complaints-api.doorsvip.ru/complaints_m/api/templates

# Protected cases list
curl -i https://complaints-api.doorsvip.ru/complaints_m/api/cases \
  -H "Authorization: Bearer TOKEN"
```
