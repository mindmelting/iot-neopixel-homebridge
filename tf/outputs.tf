output "iot_homebridge_access_id" {
  value = aws_iam_access_key.iot_homebridge.id
}

output "iot_homebridge_access_secret" {
  value = aws_iam_access_key.iot_homebridge.secret
}