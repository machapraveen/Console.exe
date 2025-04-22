# deployment/terraform/variables.tf

variable "aws_region" {
  description = "AWS region to deploy to"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  type        = string
  default     = "prod"
}

variable "db_username" {
  description = "Username for the database"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key for JWT token signing"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key for sensitive data"
  type        = string
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio Phone Number"
  type        = string
  sensitive   = true
}

variable "api_certificate_arn" {
  description = "ARN of the SSL certificate for the API domain"
  type        = string
}

variable "dashboard_certificate_arn" {
  description = "ARN of the SSL certificate for the Dashboard domain"
  type        = string
}

variable "alert_email" {
  description = "Email address to send alerts to"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "docdb_instance_class" {
  description = "Instance class for DocumentDB instances"
  type        = string
  default     = "db.r5.large"
}

variable "docdb_instance_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 2
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS tasks"
  type        = number
  default     = 512
}

variable "ecs_task_memory" {
  description = "Memory for ECS tasks in MiB"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired count of API service tasks"
  type        = number
  default     = 2
}