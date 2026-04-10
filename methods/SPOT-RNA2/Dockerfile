FROM python:3.7-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN rm /bin/sh && ln -s /bin/bash /bin/sh
RUN apt-get update && apt-get install -y \
    wget \
    unzip \
    python3 \
    python3-pip \
    build-essential \
    libgomp1 \
    libstdc++6 \
    libglib2.0-0 \
    ca-certificates \
    cpanminus \
    gawk \
    git \
    mafft \
    && rm -rf /var/lib/apt/lists/*

RUN cpanm Graph

COPY . /SPOT-RNA2

WORKDIR /SPOT-RNA2

RUN wget -O utils/models_ckps.tar.xz 'https://www.dropbox.com/s/udzcsva76lh5wvq/models_ckps.tar.xz' || wget -O utils/models_ckps.tar.xz 'https://app.nihaocloud.com/f/586acb2658d74ccb92b8/?dl=1'
RUN tar -xvf utils/models_ckps.tar.xz -C utils/ && rm utils/models_ckps.tar.xz

RUN wget 'eddylab.org/infernal/infernal-1.1.3-linux-intel-gcc.tar.gz' && tar -xvzf infernal-*.tar.gz && rm infernal-*.tar.gz
RUN tar -xvzf infernal-*.tar.gz && rm infernal-*.tar.gz

RUN wget 'ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/LATEST/ncbi-blast-*+-x64-linux.tar.gz'
RUN tar -xvzf ncbi-blast-*+-x64-linux.tar.gz && rm ncbi-blast-*+-x64-linux.tar.gz

RUN git clone "https://github.com/sokrypton/GREMLIN_CPP" && cd GREMLIN_CPP && g++ -O3 -std=c++0x -o gremlin_cpp gremlin_cpp.cpp -fopenmp && cd ../
RUN git clone 'https://github.com/LinearFold/LinearPartition.git' && cd LinearPartition/ && make && cd ../

RUN cd SPOT-RNA
RUN wget 'https://www.dropbox.com/s/dsrcf460nbjqpxa/SPOT-RNA-models.tar.gz' || wget -O SPOT-RNA-models.tar.gz 'https://app.nihaocloud.com/f/fbf3315a91d542c0bdc2/?dl=1'
RUN tar -xvzf SPOT-RNA-models.tar.gz && rm SPOT-RNA-models.tar.gz && cd ../

# Instalar dependencias Python de SPOT-RNA2
RUN pip3 install numpy scipy pandas biopython

RUN pip3 install -r requirements.txt

# Evitar recompilaciones innecesarias
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1

RUN chmod +x /SPOT-RNA2/run_spotrna2_remote.sh

# Entrypoint to run SPOT-RNA2 with BLAST remote
ENTRYPOINT ["bash", "/SPOT-RNA2/run_spotrna2_remote.sh"]
