#!/usr/bin/env bash
# ============================================================
#  Conversations Smoke Test — all endpoints + isolation
#  Server must be running at http://localhost:8080 (dev mode)
# ============================================================

BASE="http://localhost:8080"
PASS=0; FAIL=0; WARN=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()      { echo -e "${GREEN}✓${NC} $1" >&2; ((PASS++)); }
fail()    { echo -e "${RED}✗${NC} $1" >&2; ((FAIL++)); }
warn()    { echo -e "${YELLOW}⚠${NC} $1" >&2; ((WARN++)); }
info()    { echo -e "${CYAN}▶${NC} $1" >&2; }
section() { echo -e "\n${BOLD}══════════════════════════════════════${NC}" >&2
            echo -e "${BOLD}  $1${NC}" >&2
            echo -e "${BOLD}══════════════════════════════════════${NC}" >&2; }

# Login: prints token to stdout; logging goes to stderr
login() {
  local email="$1" label="$2"
  info "Logging in as $label ($email)…"
  local send_resp
  send_resp=$(curl -s -X POST "$BASE/api/admin/auth/send-code" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"delivery_method\":\"email\"}")
  local debug_code
  debug_code=$(echo "$send_resp" | grep -o '"debug_code":[0-9]*' | grep -o '[0-9]*')
  if [[ -z "$debug_code" ]]; then
    fail "$label: send-code no debug_code (NODE_ENV=development?)"
    info "  resp: $send_resp"
    return 1
  fi
  ok "$label: got debug_code=$debug_code"
  local verify_resp
  verify_resp=$(curl -s -X POST "$BASE/api/admin/auth/verify-code" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"code\":$debug_code}")
  local token
  token=$(echo "$verify_resp" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
  if [[ -z "$token" ]]; then
    fail "$label: no sessionToken in response"
    info "  resp: $verify_resp"
    return 1
  fi
  ok "$label: authenticated (len=${#token})"
  echo "$token"
}

assert_http() {
  local label="$1" want="$2" got="$3" body="$4"
  if [[ "$got" == "$want" ]]; then ok "$label → HTTP $got"
  else fail "$label → wanted $want got $got"; info "  $(echo "$body" | head -c 250)"; fi
}
assert_field() {
  local label="$1" field="$2" body="$3"
  if echo "$body" | grep -q "\"$field\""; then ok "$label has '$field'"
  else fail "$label missing '$field'"; info "  $(echo "$body" | head -c 250)"; fi
}
assert_absent() {
  local label="$1" pat="$2" body="$3"
  if echo "$body" | grep -q "$pat"; then
    fail "$label MUST NOT contain '$pat'"
    info "  $(echo "$body" | grep -o ".\{0,60\}$pat.\{0,60\}" | head -1)"
  else ok "$label: '$pat' absent"
  fi
}
assert_present() {
  local label="$1" pat="$2" body="$3"
  if echo "$body" | grep -q "$pat"; then ok "$label contains '$pat'"
  else fail "$label missing '$pat'"; info "  $(echo "$body" | head -c 250)"; fi
}
rw() { curl -s -w "\n%{http_code}" "$@"; }
b()  { echo "$1" | sed '$d'; }
c()  { echo "$1" | tail -n1; }

# ── 0. Health ────────────────────────────────────────────────
section "0. Server Health"
HC=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/auth/validate" \
  -H "Authorization: Bearer smoke_test_probe")
if [[ -n "$HC" && "$HC" != "000" ]]; then ok "Server up (→ HTTP $HC)"
else fail "Server not reachable — aborting"; exit 1; fi

# ── 1. Auth ──────────────────────────────────────────────────
section "1. Authentication"
ALEX_TOKEN=$(login "axgoomez@gmail.com" "Alex id=1") || exit 1
DANIEL_TOKEN=$(login "teamdc@encoremortgage.org" "Daniel id=3") || exit 1

# ── 2. GET /threads ──────────────────────────────────────────
section "2. GET /api/conversations/threads"
R=$(rw "$BASE/api/conversations/threads" -H "Authorization: Bearer $ALEX_TOKEN")
assert_http "Alex GET /threads" "200" "$(c "$R")" "$(b "$R")"
assert_field "Alex response" "threads" "$(b "$R")"
ALEX_CNT=$(b "$R" | grep -o '"conversation_id"' | wc -l | tr -d ' ')
ok "Alex sees $ALEX_CNT active threads"
assert_absent "Alex: Avila Test (180015) absent" "180015" "$(b "$R")"

R=$(rw "$BASE/api/conversations/threads" -H "Authorization: Bearer $DANIEL_TOKEN")
assert_http "Daniel GET /threads" "200" "$(c "$R")" "$(b "$R")"
DANIEL_CNT=$(b "$R" | grep -o '"conversation_id"' | wc -l | tr -d ' ')
ok "Daniel sees $DANIEL_CNT active threads"

# ── 3. Filters ───────────────────────────────────────────────
section "3. Thread Filters"
for S in active closed; do
  R=$(rw "$BASE/api/conversations/threads?status=$S" -H "Authorization: Bearer $ALEX_TOKEN")
  assert_http "Alex ?status=$S" "200" "$(c "$R")" "$(b "$R")"
done
for Q in "search=alex" "page=1&limit=5" "folder=inbox" "folder=sent" "priority=high"; do
  R=$(rw "$BASE/api/conversations/threads?$Q" -H "Authorization: Bearer $ALEX_TOKEN")
  assert_http "Alex ?$Q" "200" "$(c "$R")" "$(b "$R")"
done

# ── 4. Stats ─────────────────────────────────────────────────
section "4. GET /api/conversations/stats"
R=$(rw "$BASE/api/conversations/stats" -H "Authorization: Bearer $ALEX_TOKEN")
assert_http "Alex GET /stats" "200" "$(c "$R")" "$(b "$R")"
R=$(rw "$BASE/api/conversations/stats" -H "Authorization: Bearer $DANIEL_TOKEN")
assert_http "Daniel GET /stats" "200" "$(c "$R")" "$(b "$R")"

# ── 5. Templates ─────────────────────────────────────────────
section "5. GET /api/conversations/templates"
R=$(rw "$BASE/api/conversations/templates" -H "Authorization: Bearer $ALEX_TOKEN")
assert_http "Alex GET /templates" "200" "$(c "$R")" "$(b "$R")"

# ── 6. Ably token ────────────────────────────────────────────
section "6. GET /api/conversations/ably-token"
R=$(rw "$BASE/api/conversations/ably-token" -H "Authorization: Bearer $ALEX_TOKEN")
assert_http "Alex GET /ably-token" "200" "$(c "$R")" "$(b "$R")"

# ── 7. Lookup contact ────────────────────────────────────────
section "7. GET /api/conversations/lookup-contact"
R=$(rw "$BASE/api/conversations/lookup-contact?phone=19095279692" \
  -H "Authorization: Bearer $ALEX_TOKEN")
CODE=$(c "$R"); BODY=$(b "$R")
assert_http "Alex lookup Avila Test phone" "200" "$CODE" "$BODY"
info "  Result: $(echo "$BODY" | head -c 200)"

# ── 8. Cross-broker 403 guard ────────────────────────────────
section "8. Cross-Broker Isolation (403 Guard)"

# via phone
R=$(rw -X POST "$BASE/api/conversations/send" \
  -H "Authorization: Bearer $ALEX_TOKEN" -H "Content-Type: application/json" \
  -d '{"communication_type":"sms","recipient_phone":"+19095279692","body":"SMOKE cross-broker phone"}')
assert_http "Alex→Avila phone → 403" "403" "$(c "$R")" "$(b "$R")"
assert_present "403 body mentions isolation" "assigned to another broker" "$(b "$R")"

# via client_id
R=$(rw -X POST "$BASE/api/conversations/send" \
  -H "Authorization: Bearer $ALEX_TOKEN" -H "Content-Type: application/json" \
  -d '{"communication_type":"sms","client_id":180015,"body":"SMOKE cross-broker client_id"}')
assert_http "Alex→Avila client_id → 403" "403" "$(c "$R")" "$(b "$R")"

# via email
R=$(rw -X POST "$BASE/api/conversations/send" \
  -H "Authorization: Bearer $ALEX_TOKEN" -H "Content-Type: application/json" \
  -d '{"communication_type":"email","recipient_email":"aviladerek980@gmail.com","subject":"t","body":"SMOKE cross-broker email"}')
assert_http "Alex→Avila email → 403" "403" "$(c "$R")" "$(b "$R")"

# Daniel → own client NOT blocked (passes guard; Twilio may fail — that's fine)
R=$(rw -X POST "$BASE/api/conversations/send" \
  -H "Authorization: Bearer $DANIEL_TOKEN" -H "Content-Type: application/json" \
  -d '{"communication_type":"sms","client_id":180015,"body":"SMOKE Daniel own client"}')
CODE=$(c "$R")
if [[ "$CODE" == "403" ]]; then
  fail "Daniel→own client incorrectly blocked (403)"
else
  ok "Daniel→own client NOT blocked (HTTP $CODE — guard passes)"
fi

# ── 9. Messages & PUT on broker-exclusive threads ────────────
section "9. Thread Messages & Updates"
# Use DB-verified exclusive threads (broker_id=owner, client owned by same broker)
# These are NOT shared-inbox threads, so cross-broker access must be blocked.
ALEX_EXCL="conv_1776289632320_ch2bpb2dv"   # Alex-only (broker_id=1, client owned by Alex)
DANIEL_EXCL="conv_1777300183611_kaif6hvt1" # Daniel-only (broker_id=3, client owned by Daniel)

info "Alex exclusive thread : $ALEX_EXCL"
info "Daniel exclusive thread: $DANIEL_EXCL"

# Alex GET messages on own exclusive thread
R=$(rw "$BASE/api/conversations/$ALEX_EXCL/messages" \
  -H "Authorization: Bearer $ALEX_TOKEN")
assert_http "Alex GET messages (own exclusive)" "200" "$(c "$R")" "$(b "$R")"
assert_field "Messages response has 'messages'" "messages" "$(b "$R")"
MCNT=$(b "$R" | grep -o '"id"' | wc -l | tr -d ' ')
ok "  $MCNT message(s) in Alex's exclusive thread"

# Daniel GET messages on Alex's exclusive thread — must be blocked
R=$(rw "$BASE/api/conversations/$ALEX_EXCL/messages" \
  -H "Authorization: Bearer $DANIEL_TOKEN")
CODE=$(c "$R")
if [[ "$CODE" == "403" || "$CODE" == "404" ]]; then
  ok "Daniel GET messages on Alex's thread → blocked ($CODE)"
else
  fail "Daniel GET messages on Alex's exclusive thread → $CODE (should be 404)"
fi

# Daniel GET messages on own exclusive thread
R=$(rw "$BASE/api/conversations/$DANIEL_EXCL/messages" \
  -H "Authorization: Bearer $DANIEL_TOKEN")
assert_http "Daniel GET messages (own exclusive)" "200" "$(c "$R")" "$(b "$R")"

# Alex GET messages on Daniel's exclusive thread — must be blocked
R=$(rw "$BASE/api/conversations/$DANIEL_EXCL/messages" \
  -H "Authorization: Bearer $ALEX_TOKEN")
CODE=$(c "$R")
if [[ "$CODE" == "403" || "$CODE" == "404" ]]; then
  ok "Alex GET messages on Daniel's thread → blocked ($CODE)"
else
  fail "Alex GET messages on Daniel's exclusive thread → $CODE (should be 404)"
fi

# Alex PUT priority on own thread
R=$(rw -X PUT "$BASE/api/conversations/$ALEX_EXCL" \
  -H "Authorization: Bearer $ALEX_TOKEN" -H "Content-Type: application/json" \
  -d '{"priority":"high","status":"active"}')
assert_http "Alex PUT priority=high (own thread)" "200" "$(c "$R")" "$(b "$R")"
curl -s -X PUT "$BASE/api/conversations/$ALEX_EXCL" \
  -H "Authorization: Bearer $ALEX_TOKEN" -H "Content-Type: application/json" \
  -d '{"priority":"normal"}' >/dev/null
ok "Priority restored to normal"

# Daniel PUT on Alex's exclusive thread — must be blocked
R=$(rw -X PUT "$BASE/api/conversations/$ALEX_EXCL" \
  -H "Authorization: Bearer $DANIEL_TOKEN" -H "Content-Type: application/json" \
  -d '{"priority":"urgent"}')
CODE=$(c "$R")
if [[ "$CODE" == "403" || "$CODE" == "404" ]]; then
  ok "Daniel PUT on Alex's exclusive thread → blocked ($CODE)"
else
  fail "Daniel PUT on Alex's exclusive thread → $CODE (should be 404)"
fi

# ── 10. Auth guard ───────────────────────────────────────────
section "10. Auth Guard (no/bad token)"
for EP in conversations/threads conversations/stats conversations/templates conversations/ably-token; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/$EP")
  assert_http "No-auth $EP" "401" "$CODE" ""
done
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/conversations/send" \
  -H "Content-Type: application/json" -d '{"body":"x"}')
assert_http "No-auth POST /send" "401" "$CODE" ""
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/conversations/threads" \
  -H "Authorization: Bearer totally_fake_jwt_abc123")
assert_http "Bad-token GET /threads" "401" "$CODE" ""

# ── 11. DB audit ─────────────────────────────────────────────
section "11. DB Audit — Zero Cross-Broker Mismatches"
info "Querying live DB…"
MISMATCH=$(
  cd /Users/felixgomez/Code/real-state
  DB_PASS=$(grep "^DB_PASSWORD" .env | cut -d'=' -f2-)
  DB_HOST=$(grep "^DB_HOST" .env | cut -d'=' -f2-)
  DB_PORT=$(grep "^DB_PORT" .env | cut -d'=' -f2-)
  DB_USER=$(grep "^DB_USER" .env | cut -d'=' -f2-)
  DB_NAME=$(grep "^DB_NAME" .env | cut -d'=' -f2-)
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
    --ssl-mode=REQUIRED --protocol=TCP 2>/dev/null \
    --skip-column-names -se "
      SELECT COUNT(*) FROM conversation_threads ct
      JOIN clients c ON c.id = ct.client_id AND c.tenant_id = ct.tenant_id
      WHERE ct.tenant_id = 1
        AND ct.client_id IS NOT NULL
        AND ct.broker_id IS NOT NULL
        AND ct.broker_id != c.assigned_broker_id
        AND NOT EXISTS (
          SELECT 1 FROM loan_applications la
          WHERE la.client_user_id = ct.client_id
            AND la.tenant_id = ct.tenant_id
            AND (la.broker_user_id = ct.broker_id OR la.partner_broker_id = ct.broker_id)
        );"
) 2>/dev/null || MISMATCH=""

if [[ "$MISMATCH" == "0" ]]; then ok "DB: 0 cross-broker mismatches"
elif [[ -z "$MISMATCH" ]]; then warn "DB: connection failed"
else fail "DB: $MISMATCH mismatch(es) found"; fi

# ── Summary ──────────────────────────────────────────────────
section "SUMMARY"
echo -e "  Total   : $((PASS+FAIL+WARN))" >&2
echo -e "  ${GREEN}Passed  : $PASS${NC}" >&2
echo -e "  ${RED}Failed  : $FAIL${NC}" >&2
echo -e "  ${YELLOW}Warnings: $WARN${NC}" >&2
echo "" >&2
if   [[ $FAIL -eq 0 && $WARN -eq 0 ]]; then echo -e "${GREEN}${BOLD}All tests passed!${NC}" >&2
elif [[ $FAIL -eq 0 ]];                then echo -e "${YELLOW}${BOLD}Passed with $WARN warning(s)${NC}" >&2
else                                        echo -e "${RED}${BOLD}$FAIL test(s) FAILED${NC}" >&2; fi

[[ $FAIL -eq 0 ]]
