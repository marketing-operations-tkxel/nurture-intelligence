#!/bin/bash
# =============================================================================
# NURTURE INTELLIGENCE — AUTO-VERIFY & FIX PIPELINE
# Usage:
#   bash scripts/verify-and-fix.sh           # test production
#   bash scripts/verify-and-fix.sh --local   # test localhost:3000
#   BASE=https://custom.url bash scripts/verify-and-fix.sh
# =============================================================================

set -e

VERIFY_SECRET="${VERIFY_SECRET:-ni-verify-2026}"
PASS=0
FAIL=0
FAILURES=()

# Determine base URL
if [[ "$1" == "--local" ]]; then
  BASE="http://localhost:3000"
else
  BASE="${BASE:-https://nurture-intelligence-qrikvm5xo.vercel.app}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        NURTURE INTELLIGENCE AUTO-VERIFY              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo "  Target: $BASE"
echo "  Time:   $(date)"
echo ""

# ── Helper: fetch JSON with auth bypass ─────────────────────────────────────
fetch() {
  curl -s --max-time 90 \
    --header "X-Verify-Secret: $VERIFY_SECRET" \
    --header "Accept: application/json" \
    "$1"
}

# ── Helper: extract value from JSON by dot-path ─────────────────────────────
extract() {
  local json="$1"
  local path="$2"
  echo "$json" | node --input-type=module <<EOF
import { createRequire } from 'module';
const input = \`$(echo "$json" | sed "s/\`/'/g")\`;
try {
  const j = JSON.parse(input);
  const keys = '$path'.split('.');
  let v = j;
  for (const k of keys) {
    if (v === null || v === undefined) break;
    if (k === 'length' && Array.isArray(v)) { v = v.length; break; }
    v = v[k];
  }
  if (Array.isArray(v)) process.stdout.write(String(v.length));
  else process.stdout.write(v !== null && v !== undefined ? String(v) : 'null');
} catch(e) { process.stdout.write('PARSE_ERROR:' + e.message); }
EOF
}

# ── Helper: evaluate a check ─────────────────────────────────────────────────
check() {
  local name="$1"
  local url="$2"
  local path="$3"
  local expected="$4"
  local response label status

  response=$(fetch "$url")

  # Detect redirect to login (HTML response)
  if echo "$response" | grep -q "<!DOCTYPE\|<html\|Redirecting"; then
    label="AUTH_REDIRECT"
    printf "  %-12s %-30s %s\n" "[$name]" "$path" "FAIL — got HTML redirect (auth not bypassed?)"
    FAIL=$((FAIL+1))
    FAILURES+=("$name/$path: got auth redirect — check VERIFY_SECRET env var on server")
    return
  fi

  local value
  value=$(extract "$response" "$path" 2>/dev/null || echo "EXTRACT_FAIL")

  # Evaluate condition
  if [[ "$expected" == ">0" ]]; then
    if node -e "process.exit(parseFloat('$value')>0?0:1)" 2>/dev/null; then
      status="PASS"
    else
      status="FAIL"
    fi
  elif [[ "$expected" == ">500" ]]; then
    if node -e "process.exit(parseFloat('$value')>500?0:1)" 2>/dev/null; then
      status="PASS"
    else
      status="FAIL"
    fi
  elif [[ "$expected" == ">100" ]]; then
    if node -e "process.exit(parseFloat('$value')>100?0:1)" 2>/dev/null; then
      status="PASS"
    else
      status="FAIL"
    fi
  else
    # Exact match
    if [[ "$value" == "$expected" ]]; then
      status="PASS"
    else
      status="FAIL"
    fi
  fi

  if [[ "$status" == "PASS" ]]; then
    printf "  \033[32m✓\033[0m %-12s %-35s = %s\n" "[$name]" "$path" "$value"
    PASS=$((PASS+1))
  else
    printf "  \033[31m✗\033[0m %-12s %-35s = %s  (expected: %s)\n" "[$name]" "$path" "$value" "$expected"
    FAIL=$((FAIL+1))
    FAILURES+=("$name/$path: got '$value' expected '$expected'")
  fi
}

# ── Endpoint checks ──────────────────────────────────────────────────────────
echo "--- API ENDPOINT CHECKS ---"
echo ""

echo "▸ /api/kpis"
KPI_RESP=$(fetch "$BASE/api/kpis")
echo "$KPI_RESP" | node --input-type=module <<'EOFN'
const d = await new Promise(r => { let b=''; process.stdin.on('data',c=>b+=c); process.stdin.on('end',()=>r(b)); });
try {
  const j = JSON.parse(d);
  console.log(`  sfConnected=${j.sfConnected}  pardotConnected=${j.pardotConnected}`);
  console.log(`  wonRevenue=${j.wonRevenue}  totalAudience=${j.totalAudience}  mqls=${j.mqls}  emailsSent=${j.emailsSent}`);
} catch(e) { console.log('  PARSE ERROR:', e.message, d.slice(0,200)); }
EOFN

check "KPIs"      "$BASE/api/kpis"      "wonRevenue"         ">0"
check "KPIs"      "$BASE/api/kpis"      "totalAudience"      ">500"
check "KPIs"      "$BASE/api/kpis"      "mqls"               ">0"
check "KPIs"      "$BASE/api/kpis"      "emailsSent"         ">0"
check "KPIs"      "$BASE/api/kpis"      "sfConnected"        "true"
check "KPIs"      "$BASE/api/kpis"      "pardotConnected"    "true"

echo ""
echo "▸ /api/funnel"
FUNNEL_RESP=$(fetch "$BASE/api/funnel")
echo "$FUNNEL_RESP" | node --input-type=module <<'EOFN'
const d = await new Promise(r => { let b=''; process.stdin.on('data',c=>b+=c); process.stdin.on('end',()=>r(b)); });
try {
  const j = JSON.parse(d);
  console.log(`  sfConnected=${j.sfConnected}  nurtureTotal=${j.nurtureTotal}  mqls=${j.mqls}  sqls=${j.sqls}  discoveryCalls=${j.discoveryCalls}`);
  console.log(`  stages=${j.stages?.length ?? 0}`);
} catch(e) { console.log('  PARSE ERROR:', e.message, d.slice(0,200)); }
EOFN

check "Funnel"    "$BASE/api/funnel"    "nurtureTotal"       ">0"
check "Funnel"    "$BASE/api/funnel"    "mqls"               ">100"
check "Funnel"    "$BASE/api/funnel"    "sqls"               ">0"
check "Funnel"    "$BASE/api/funnel"    "stages.length"      "7"

echo ""
echo "▸ /api/contacts"
CONTACTS_RESP=$(fetch "$BASE/api/contacts")
echo "$CONTACTS_RESP" | node --input-type=module <<'EOFN'
const d = await new Promise(r => { let b=''; process.stdin.on('data',c=>b+=c); process.stdin.on('end',()=>r(b)); });
try {
  const j = JSON.parse(d);
  console.log(`  connected=${j.connected}  total=${j.total}  prospects=${j.prospects?.length ?? 0}`);
  console.log(`  buckets: hot=${j.buckets?.hot} warm=${j.buckets?.warm} cold=${j.buckets?.cold} inactive=${j.buckets?.inactive}`);
  if (j.prospects?.[0]) {
    const p = j.prospects[0];
    console.log(`  first prospect: segment='${p.segment}' nurtureStep='${p.nurtureStep}'`);
  }
} catch(e) { console.log('  PARSE ERROR:', e.message, d.slice(0,200)); }
EOFN

check "Contacts"  "$BASE/api/contacts"  "connected"          "true"
check "Contacts"  "$BASE/api/contacts"  "total"              "6421"
check "Contacts"  "$BASE/api/contacts"  "buckets.hot"        ">0"
check "Contacts"  "$BASE/api/contacts"  "prospects.length"   ">0"

echo ""
echo "▸ /api/sequences"
SEQ_RESP=$(fetch "$BASE/api/sequences")
echo "$SEQ_RESP" | node --input-type=module <<'EOFN'
const d = await new Promise(r => { let b=''; process.stdin.on('data',c=>b+=c); process.stdin.on('end',()=>r(b)); });
try {
  const j = JSON.parse(d);
  console.log(`  connected=${j.connected}  sequences=${j.sequences?.length ?? 0}  subjectLines=${j.subjectLines?.length ?? 0}  prospectTitles=${j.prospectTitles?.length ?? 0}`);
  if (j.sequences?.[0]) {
    const s = j.sequences[0];
    console.log(`  top seq: "${s.name?.slice(0,50)}"  openRate=${s.openRate}  sent=${s.sent}  segmentLabel="${s.segmentLabel}"`);
  }
} catch(e) { console.log('  PARSE ERROR:', e.message, d.slice(0,200)); }
EOFN

check "Sequences" "$BASE/api/sequences" "connected"              "true"
check "Sequences" "$BASE/api/sequences" "sequences.length"       ">0"
check "Sequences" "$BASE/api/sequences" "subjectLines.length"    ">0"
check "Sequences" "$BASE/api/sequences" "prospectTitles.length"  ">0"

echo ""
echo "▸ /api/segments"
SEG_RESP=$(fetch "$BASE/api/segments")
echo "$SEG_RESP" | node --input-type=module <<'EOFN'
const d = await new Promise(r => { let b=''; process.stdin.on('data',c=>b+=c); process.stdin.on('end',()=>r(b)); });
try {
  const j = JSON.parse(d);
  console.log(`  pardotConnected=${j.pardotConnected}  sfConnected=${j.sfConnected}`);
  console.log(`  segments=${j.segments?.length ?? 0}  newsletter.members=${j.newsletter?.members}  industries=${j.industries?.length ?? 0}`);
  const withStats = (j.segments ?? []).filter(s => s.sent > 0);
  console.log(`  segments with email stats: ${withStats.length}`);
} catch(e) { console.log('  PARSE ERROR:', e.message, d.slice(0,200)); }
EOFN

check "Segments"  "$BASE/api/segments"  "pardotConnected"    "true"
check "Segments"  "$BASE/api/segments"  "segments.length"    "7"
check "Segments"  "$BASE/api/segments"  "newsletter.members" ">0"
check "Segments"  "$BASE/api/segments"  "industries.length"  ">0"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "══════════════════════════════════════════════"

if [[ ${#FAILURES[@]} -gt 0 ]]; then
  echo ""
  echo "FAILURES:"
  for f in "${FAILURES[@]}"; do
    echo "  ✗ $f"
  done
  echo ""
  exit 1
else
  echo ""
  echo "  All checks passed!"
  echo ""
  exit 0
fi
