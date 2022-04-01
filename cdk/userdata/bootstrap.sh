#!/bin/bash
aws ssm get-parameter --name 'gitkey' --with-decryption --region us-east-1 | jq -r '.Parameter.Value' > ~/.ssh/id_rsa
chmod 0700 ~/.ssh/id_rsa
ssh -o StrictHostKeyChecking=no git@github.com
git clone git@github.com:javydekoning/aws-hashcat.git
cd aws-hashcat

# PULL IMAGES
nvidia-docker pull javydekoning/hashcat:cuda

# RUN CUDA
export HCVER=$(nvidia-docker run javydekoning/hashcat:cuda hashcat --version)
export FILE=$(curl http://169.254.169.254/latest/meta-data/instance-type).$HCVER.cuda.txt
nvidia-smi > $FILE
nvidia-docker run javydekoning/hashcat:cuda hashcat -I >> $FILE
nvidia-docker run javydekoning/hashcat:cuda hashcat -b >> $FILE

# Add files to git repo, commit and push
git add $FILE
git commit -a -m "Adding $FILE"
git push

#Terminate delayed one minute
shutdown +1