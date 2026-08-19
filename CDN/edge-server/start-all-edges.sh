#!/usr/bin/env bash
# Starts all 5 edge instances of the SAME codebase, each with its own
# .env file. Run `npm install` in edge-server/ once before this.
#
# Usage: ./start-all-edges.sh
# Stop with Ctrl+C (kills all background processes via trap below).

set -e
cd "$(dirname "$0")"

CITIES=(delhi mumbai kolkata bangalore )
PIDS=()

cleanup() {
  echo ""
  echo "Stopping all edge servers..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}
trap cleanup INT TERM

for city in "${CITIES[@]}"; do
  echo "Starting edge: $city"
  env $(cat "env-examples/.env.$city" | xargs) node src/server.js &
  PIDS+=($!)
  sleep 0.5
done

echo ""
echo "All 5 edges running. Ports: 5001 (Delhi) 5002 (Mumbai) 5003 (Kolkata) 5004 (Bangalore) 5005 (Chennai)"
echo "Press Ctrl+C to stop all."

wait
