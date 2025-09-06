# RNAcomp2D

**RNAcomp2D** is a web application for RNA secondary structure prediction and
comparison using multiple methods. You can try it out at the [web
server](https://webdemos.sinc.unl.edu.ar/RNAcomp2D/). For more information,
check out our [paper](ADD LINK TO PAPER).

RNAcomp2D allows you to upload a sequence or search it on
[RNAcentral](https://rnacentral.org/). Then, you can select one or more methods to predict the
secondary structure, compare the predictions, and download the results. At the
moment, the following methods are available:

- RNAfold ([paper](https://doi.org/10.1186/1748-7188-6-26))
- RNAstructure ([paper](https://doi.org/10.1186/1471-2105-11-129))
- LinearFold ([paper](https://doi.org/10.1093/bioinformatics/btz375))
- LinearPartition ([paper](https://doi.org/10.1093/bioinformatics/btaa460))
- sincFold ([paper](https://doi.org/10.1093/bib/bbae271))
- UFold ([paper](https://doi.org/10.1093/nar/gkab1074))
- REDfold ([paper](https://doi.org/10.1186/s12859-023-05238-8))

If reference structure is available at RNAcentral, it will be shown in the
results page with the predicted structures of the selected methods.

This repository contains the source code for the web application and
instructions to deploy it on your own server.

## Requirements

To install and run the web application, you need to have [Git](https://git-scm.com/),
[Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
installed. Follow the instructions in the official documentation to install
them and make sure you have Docker daemon running. After that, you can go to the next step.

## Installation

First, clone the repository and navigate to the root directory:

```
git clone https://github.com/sinc-lab/RNAcomp2D.git
cd RNAcomp2D
```

Then, run the following command to build and run the web application:

```
docker-compose -f docker-compose-no-proxy.yml up -d
```

This may take a few minutes. Once it's done, you can access the web application at
[http://localhost:8000](http://localhost:8000).

## Help

If you have any questions or need help, please send an email to
[rvitale@sinc.unl.edu.ar](mailto:rvitale@sinc.unl.edu.ar).

