# aws-hashcat

Hashcat benchmarks on AWS instances. Files are in the format of `${INSTANCETYPE}.${HASHCATVERSION}`.

Benchmarks are run using:

* Hashcat compiled from source
* [AWS Deep Learning AMI GPU CUDA 11.3 (Amazon Linux 2)](https://aws.amazon.com/releasenotes/aws-deep-learning-ami-gpu-cuda-11-3-amazon-linux-2/)
* In NVDIA-DOCKER

## Instructions

Benchmarks in this repo are automatically run once a month. If you want to do this on your own, refer to the [userdata script](https://github.com/javydekoning/aws-hashcat/blob/master/cdk/userdata/bootstrap.sh)

## Docker file

The docker files used can be found in this repository:

[![Docker Hub](http://dockeri.co/image/javydekoning/hashcat)](https://hub.docker.com/r/javydekoning/hashcat/)

Use tags `:opencl` for OpenCL, `:cuda` for CUDA.

[![](https://images.microbadger.com/badges/version/javydekoning/hashcat.svg)](https://microbadger.com/images/javydekoning/hashcat "Get your own version badge on microbadger.com")
[![](https://images.microbadger.com/badges/image/javydekoning/hashcat.svg)](https://microbadger.com/images/javydekoning/hashcat "Get your own image badge on microbadger.com")
