#!/usr/bin/env bash
# Builds the server and deploys Rewind to AWS: a Lambda function with a public
# URL, a DynamoDB table, and access to Amazon Bedrock.
#
#   MISS_IT_DEVICE_KEY=<secret> infra/deploy.sh    (or put it in .env)
#
# Set NOVA_API_KEY too to write recaps with Amazon's direct Nova API instead.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then set -a; source .env; set +a; fi
STACK="${MISS_IT_STACK:-rewind}"
REGION="${AWS_REGION:-us-east-1}"
: "${MISS_IT_DEVICE_KEY:?Set MISS_IT_DEVICE_KEY to the key the Fire TV app sends}"

ACCOUNT="$(aws sts get-caller-identity --query Account --output text --region "$REGION")"
BUCKET="rewind-artifacts-$ACCOUNT-$REGION"
if ! aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" 2>/dev/null; then
  aws s3 mb "s3://$BUCKET" --region "$REGION"
fi

npm run build -w server
aws cloudformation package \
  --template-file infra/template.yaml \
  --s3-bucket "$BUCKET" \
  --output-template-file infra/packaged.yaml \
  --region "$REGION"
aws cloudformation deploy \
  --template-file infra/packaged.yaml \
  --stack-name "$STACK" \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides "DeviceKey=$MISS_IT_DEVICE_KEY" "NovaApiKey=${NOVA_API_KEY:-}" \
  --region "$REGION"
aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs" --output table
