# Base node image
FROM node:8.9
MAINTAINER wan <wan@nradiowifi.com>

# Change npm source
RUN npm config set registry https://registry.npm.taobao.org

# Set up work dir
RUN mkdir /app
WORKDIR /app

# Set ENV variables
ENV PORT=1883
EXPOSE $PORT

# Install packages
ADD package.json /app/package.json
RUN npm install

# Finally, add the rest of our app's code
# (this is done at the end so that changes to
# our app's code don't bust Docker's cache)
ADD . /app

# Start the web app
ENTRYPOINT ["/app/start.sh"]
CMD ["node","server.js"]
