FROM python:3.11

# Install debian packages
RUN apt-get update && apt-get install -y \
	git \
	build-essential \
	default-jre

# Copy project files (including code, requirements, etc.)
RUN mkdir -p /Project
COPY . /Project
WORKDIR /Project

# Install python packages
RUN pip install --upgrade pip
RUN pip install --default-timeout=100 -r requirements.txt

# Install methods
## RNAfold
#COPY ./methods/RNAfold/viennarna_2.7.0-1_amd64.deb /Project/methods/RNAfold/viennarna_2.7.0-1_amd64.deb
RUN apt install -y ./methods/RNAfold/viennarna_2.7.0-1_amd64.deb

## REDfold
#COPY ./methods/REDfold/redfold-1.14a0-py2.py3-none-any.whl /Project/methods/REDfold/redfold-1.14a0-py2.py3-none-any.whl
RUN pip install --default-timeout=100 methods/REDfold/redfold-1.14a0-py2.py3-none-any.whl
#COPY ./methods/REDfold/redfold /Project/methods/REDfold/redfold
RUN cp -r methods/REDfold/redfold/ /usr/local/lib/python3.11/site-packages/

## RNAstructure
## RNAstructure was compiled from source and the binaries are in the folder
## ./methods/RNAstructure
## They will be accessible when the volume is mounted

## LinearFold and LinearPartition
## The binaries will be accessible when the volume is mounted

## UFold
## Require java to run (installed from debian repository)
## Python script and model will be accessible when the volume is mounted

## SincFold
## Install sincfold from https://github.com/sinc-lab/sincFold
RUN git clone https://github.com/sinc-lab/sincFold
RUN pip install ./sincFold

# Port for Flask
EXPOSE 8000

# Start Application
CMD ["python", "app.py --use_proxy"]

