#!/bin/bash
# cache busting: ?v=hash u CSS a JS
cd "$(dirname "$0")"
c=$(md5 -q style.css | cut -c1-8); j=$(md5 -q main.js | cut -c1-8)
sed -i '' -E "s/style\.css\?v=[A-Za-z0-9_]+/style.css?v=$c/; s/main\.js\?v=[A-Za-z0-9_]+/main.js?v=$j/" index.html
grep -o 'style.css?v=[^"]*\|main.js?v=[^"]*' index.html
