#!/bin/bash
docker build . -t cos-service:latest 
docker tag cos-service:latest registry.ng.bluemix.net/jiri/cos-service:latest
docker push registry.ng.bluemix.net/jiri/cos-service:latest
kubectl apply -f deployment.yml


