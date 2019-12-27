# aws-hashcat
Hashcat v5.1.0 benchmarks on AWS instances. 

Tested using `NVIDIA-SMI 418.87.01    Driver Version: 418.87.01    CUDA Version: 10.1` on Amazon Linux 2, deeplearning AMI v26.


|Instance Type  |on-demand price* |GPU                   |No. GPU's  |
|---------------|-----------------|----------------------|-----------|
|p3.16xlarge    |$24.48           |NVIDIA Tesla V100 SXM2|8          |

## Instructions

Just launch latest Deeplearning AMI and run the following container (in benchmark mode): 

`nvidia-docker run -it dizcza/docker-hashcat /usr/bin/hashcat -b`
