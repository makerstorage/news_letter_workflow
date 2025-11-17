FROM node:20-bullseye

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    curl ca-certificates fonts-liberation libwoff1 libx11-6 libxcb1 libxcomposite1 libxdamage1 \
    libxrandr2 libasound2 libatk1.0-0 libgtk-3-0 libnss3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package.json

# Use npm install because we don't have package-lock.json
RUN npm install --no-audit --no-fund

# Install Chromium for Playwright
RUN npx playwright install --with-deps chromium

COPY index.js index.js
CMD ["node", "index.js"]
