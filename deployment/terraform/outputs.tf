# deployment/terraform/outputs.tf

output "api_url" {
  description = "URL for the API endpoint"
  value       = "https://api.console-ext.com"
}

output "dashboard_url" {
  description = "URL for the dashboard application"
  value       = "https://dashboard.console-ext.com"
}

output "docdb_endpoint" {
  description = "Endpoint for the DocumentDB cluster"
  value       = aws_docdb_cluster.console_ext_db.endpoint
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.console_ext_cluster.name
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.console_ext_lb.dns_name
}

output "ecr_api_repository_url" {
  description = "URL of the ECR repository for the API"
  value       = aws_ecr_repository.api_repo.repository_url
}

output "ecr_dashboard_repository_url" {
  description = "URL of the ECR repository for the dashboard"
  value       = aws_ecr_repository.dashboard_repo.repository_url
}