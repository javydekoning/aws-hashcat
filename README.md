# aws-hashcat
Hashcat v5.1.0 benchmarks on AWS instances. 

* `sudo nvidia-smi` output:
  * `NVIDIA-SMI 418.87.01    Driver Version: 418.87.01    CUDA Version: 10.1` 
* Deep Learning AMI (Amazon Linux 2) Version 26.0
* In NVDIA-DOCKER
  * Docker version 18.09.9-ce, build 039a7df


|Instance Type  |on-demand price* |GPU                   |No. GPU's  |
|---------------|-----------------|----------------------|-----------|
|p3.16xlarge    |$24.48           |NVIDIA Tesla V100 SXM2|8          |

## Instructions

Just launch latest Deeplearning AMI and run the following container (in benchmark mode): 

`nvidia-docker run -it dizcza/docker-hashcat /usr/bin/hashcat -b`
