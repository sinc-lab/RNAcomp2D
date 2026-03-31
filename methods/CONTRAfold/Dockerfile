FROM mambaorg/micromamba:1.5.8

# Crear entorno con contrafold
RUN micromamba create -y -n rna_env \
    -c conda-forge -c bioconda \
    contrafold \
    && micromamba clean --all --yes

# Activar entorno automáticamente
ENV MAMBA_DEFAULT_ENV=rna_env
ENV PATH=/opt/conda/envs/rna_env/bin:$PATH

WORKDIR /data

CMD ["bash"]
