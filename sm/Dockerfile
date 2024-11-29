FROM node:14-alpine

WORKDIR /sm

COPY package*.json ./

RUN npm install

COPY . .
CMD [ "npm", "run", "start"]

# docker build --tag smart-unlock .

# -------------------------------------------------
# docker run -p 8080:8080 -d smart-unlock
#docker stop <id>
#docker rename abc_xyz smart_unlock

#docker stop $(docker ps -a -q)