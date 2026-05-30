#!/bin/bash
set -e

echo "▶ Starting Ananya WebSocket server..."

# Start the WS server in background
npx tsx src/server.ts &
WS_PID=$!

# Wait for it to be ready
sleep 2

echo "▶ Starting ngrok tunnel on port 8080..."
# Start ngrok — exposes localhost:8080 as a public wss:// URL
ngrok http 8080 --log=stdout &
NGROK_PID=$!

sleep 3

# Get the public URL from ngrok API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | head -1 | cut -d'"' -f4)
WS_URL=$(echo $NGROK_URL | sed 's/https:/wss:/' | sed 's/http:/ws:/')

echo ""
echo "════════════════════════════════════════"
echo "  WebSocket server: ws://localhost:8080"
echo "  Public URL:       $WS_URL"
echo ""
echo "  ➜ Set this in Vercel env:"
echo "    WS_SERVER_URL = $WS_URL"
echo ""
echo "  ➜ Or run: vercel env add WS_SERVER_URL production"
echo "    then paste: $WS_URL"
echo "════════════════════════════════════════"
echo ""

# Keep running
wait $WS_PID
