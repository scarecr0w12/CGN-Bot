FROM node:20.18-bookworm

# Create app directory
WORKDIR /usr/src/app

# Install build tools for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Install dependencies - force rebuild of native modules from source
# Add cache-bust argument to force fresh install
ARG CACHEBUST=1
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --build-from-source

# Bundle app source
COPY . .

# Expose ports
EXPOSE 8080 443

CMD [ "npm", "start" ]
