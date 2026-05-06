#!/bin/sh
set -e

CONFIG=/app/public/config.js

cat > "$CONFIG" <<EOF
window.__APP_CONFIG__ = {
  EMPLOYEE_ONBOARDING_URL: "${EMPLOYEE_ONBOARDING_URL:-http://13.204.95.26:8001}",
  USER_MANAGEMENT_URL: "${USER_MANAGEMENT_URL:-http://13.204.95.26:8000}"
};
EOF

exec "$@"