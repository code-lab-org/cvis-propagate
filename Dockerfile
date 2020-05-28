FROM continuumio/miniconda3

RUN apt-get update && apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash
RUN apt-get install -y nodejs

WORKDIR /app

COPY environment.yml .
RUN conda env create -f environment.yml

ENV PATH /opt/conda/envs/cvis-propagate/bin:$PATH
RUN /bin/bash -c "source activate cvis-propagate"

COPY package*.json ./
RUN npm install

COPY src/ ./src/
COPY webpack.*.js ./
COPY .env .
RUN npm run build

COPY cvis/ ./cvis/
COPY .flaskenv .
COPY app.py .

EXPOSE $PORT

ENTRYPOINT ["npm", "start"]
