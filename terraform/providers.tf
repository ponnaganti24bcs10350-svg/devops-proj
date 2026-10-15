provider "aws" {
  region                      = var.aws_region
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  default_tags {
    tags = {
      Project     = "CloudPulse"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}
