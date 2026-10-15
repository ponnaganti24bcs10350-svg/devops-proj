# ==============================================================================
# CloudPulse Infrastructure as Code — AWS VPC + EKS Provisioning
# ==============================================================================
# Architecture:
# - High-Availability AWS VPC with public & private subnets across 2 Availability Zones
# - Internet Gateway + NAT Gateway for outbound egress from private subnets
# - AWS EKS Cluster with IAM Roles and Security Groups
# - Managed Worker Node Group with autoscaling and rolling updates
# ==============================================================================

locals {
  name_prefix = "cloudpulse-${var.environment}"
  common_tags = {
    Project     = "CloudPulse"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
