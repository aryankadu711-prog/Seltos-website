#!/bin/bash
# Re-map git origin remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/aryankadu711-prog/Seltos-website.git

# Stage and commit
git add .
git commit -m "deploy: initial commit for vercel" || echo "Working tree clean, continuing to push..."

# Set default branch and push
git branch -M main
git push -u origin main --force
