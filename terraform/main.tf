locals {
  name_prefix = "cloudpulse-${var.environment}"
  common_tags = {
    Project     = "CloudPulse"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
