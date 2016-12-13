module.exports = {
  region: 'us-west-2',
  handler: 'index.handler',
  role: 'arn:aws:iam::530484336193:role/service-role/lambda',
  functionName: 'blackBeardApiAiWebhook',
  timeout: 300,
  memorySize: 128,
  publish: true, // default: false,
  runtime: 'nodejs4.3' // default: 'nodejs',
}
