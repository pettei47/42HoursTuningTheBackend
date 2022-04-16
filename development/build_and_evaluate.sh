#!/bin/bash

bash build.sh

(cd ../scoring && bash evaluate.sh)
