#!/usr/bin/env bash
set -euo pipefail

KEY=/c/Users/yuan/.ssh/id_ed25519
HOST=ubuntu@106.55.2.197

cd /f/CodeFiles/YuanAbd-Web

# travel.html -> /var/www (local disk, plain scp fine)
scp -p -i "$KEY" -o BatchMode=yes demo/travel.html "$HOST:/var/www/travel-landing/travel.html"
echo TRAVEL_HTML_OK

# learn landing files -> /data (cosfs mount: scp unreliable, use ssh pipe)
cat demo/js/project.js | ssh -i "$KEY" -o BatchMode=yes "$HOST" 'cat > /data/learn-workbench/landing/js/project.js && chmod 755 /data/learn-workbench/landing/js/project.js && echo LEARN_JS_OK'
cat demo/learn.html | ssh -i "$KEY" -o BatchMode=yes "$HOST" 'cat > /data/learn-workbench/landing/learn.html && chmod 755 /data/learn-workbench/landing/learn.html && echo LEARN_HTML_OK'

echo DEPLOY_DONE
