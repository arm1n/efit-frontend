FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y \
        git \
        curl \
        python \
        libpng-dev \
        libgif-dev \
        libjpeg-dev \
        libtiff-dev \
        libvips-dev \
        build-essential

RUN mkdir -p /usr/local/nvm
ENV NODE_VERSION v10.16.3
ENV NVM_DIR /usr/local/nvm

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use --delete-prefix $NODE_VERSION"

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/bin
ENV PATH $NODE_PATH:$PATH

COPY package.json /app
RUN npm install

COPY bower.json /app
RUN npm install -g bower
RUN bower install --allow-root

EXPOSE 3000
CMD ["npm", "start"]
