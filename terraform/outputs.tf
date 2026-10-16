output "vpc_id" {
  description = "The ID of the provisioned CloudPulse VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets for EKS worker nodes"
  value       = aws_subnet.private[*].id
}

output "eks_cluster_name" {
  description = "The name of the EKS cluster"
  value       = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  description = "The Kubernetes API server endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "eks_cluster_arn" {
  description = "The Amazon Resource Name (ARN) of the cluster"
  value       = aws_eks_cluster.main.arn
}

output "eks_node_group_arn" {
  description = "The ARN of the primary EKS managed worker node group"
  value       = aws_eks_node_group.main.arn
}

output "kubeconfig_command" {
  description = "Command to configure kubectl context locally"
  value       = "aws eks --region ${var.aws_region} update-kubeconfig --name ${aws_eks_cluster.main.name}"
}
