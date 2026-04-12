FROM python:3.11-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y git

COPY . /app

WORKDIR /app

RUN pip install -r requirements.txt

RUN mkdir models
RUN wget -O models/RNAformer_32M_state_dict_biophysical.pth https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_state_dict_biophysical.pth
RUN wget -O models/RNAformer_32M_config_biophysical.yml https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_config_biophysical.yml
RUN wget -O models/RNAformer_32M_state_dict_bprna.pth https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_state_dict_bprna.pth
RUN wget -O models/RNAformer_32M_config_bprna.yml https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_config_bprna.yml
RUN wget -O models/RNAformer_32M_state_dict_intra_family_finetuned.pth https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_state_dict_intra_family_finetuned.pth
RUN wget -O models/RNAformer_32M_config_intra_family_finetuned.yml https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_config_intra_family_finetuned.yml
RUN wget -O models/RNAformer_32M_state_dict_inter_family_finetuned.pth https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_state_dict_inter_family_finetuned.pth
RUN wget -O models/RNAformer_32M_config_inter_family_finetuned.yml https://ml.informatik.uni-freiburg.de/research-artifacts/RNAformer/models/RNAformer_32M_config_inter_family_finetuned.yml

ENTRYPOINT ["python3", "infer_RNAformer.py"]
