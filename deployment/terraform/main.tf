// deployment/terraform/main.tf
# AWS Provider Configuration
provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "console_ext_vpc" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  
  tags = {
    Name = "console-ext-vpc"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id            = aws_vpc.console_ext_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "console-ext-public-subnet-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.console_ext_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "console-ext-public-subnet-2"
    Environment = var.environment
  }
}

# Private Subnets
resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.console_ext_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"
  
  tags = {
    Name = "console-ext-private-subnet-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.console_ext_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"
  
  tags = {
    Name = "console-ext-private-subnet-2"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.console_ext_vpc.id
  
  tags = {
    Name = "console-ext-igw"
    Environment = var.environment
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.console_ext_vpc.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  
  tags = {
    Name = "console-ext-public-rt"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
# MongoDB Security Group
resource "aws_security_group" "mongodb_sg" {
  name        = "console-ext-mongodb-sg"
  description = "Security group for MongoDB"
  vpc_id      = aws_vpc.console_ext_vpc.id
  
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "console-ext-mongodb-sg"
    Environment = var.environment
  }
}

# Application Security Group
resource "aws_security_group" "app_sg" {
  name        = "console-ext-app-sg"
  description = "Security group for API application"
  vpc_id      = aws_vpc.console_ext_vpc.id
  
  ingress {
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "console-ext-app-sg"
    Environment = var.environment
  }
}

# Load Balancer Security Group
resource "aws_security_group" "lb_sg" {
  name        = "console-ext-lb-sg"
  description = "Security group for load balancer"
  vpc_id      = aws_vpc.console_ext_vpc.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "console-ext-lb-sg"
    Environment = var.environment
  }
}

# DocumentDB Cluster
resource "aws_docdb_cluster" "console_ext_db" {
  cluster_identifier      = "console-ext-db-${var.environment}"
  engine                  = "docdb"
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "02:00-04:00"
  skip_final_snapshot     = true
  db_subnet_group_name    = aws_docdb_subnet_group.default.name
  vpc_security_group_ids  = [aws_security_group.mongodb_sg.id]
  
  tags = {
    Name = "console-ext-db"
    Environment = var.environment
  }
}

resource "aws_docdb_subnet_group" "default" {
  name       = "console-ext-docdb-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
  
  tags = {
    Name = "console-ext-docdb-subnet-group"
    Environment = var.environment
  }
}

resource "aws_docdb_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "console-ext-db-${var.environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.console_ext_db.id
  instance_class     = "db.r5.large"
}

# ECS Cluster
resource "aws_ecs_cluster" "console_ext_cluster" {
  name = "console-ext-cluster-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = {
    Name = "console-ext-cluster"
    Environment = var.environment
  }
}

# ECR Repositories
resource "aws_ecr_repository" "api_repo" {
  name = "console-ext/api"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "console-ext-api-repo"
    Environment = var.environment
  }
}

resource "aws_ecr_repository" "dashboard_repo" {
  name = "console-ext/dashboard"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "console-ext-dashboard-repo"
    Environment = var.environment
  }
}

# Load Balancer
resource "aws_lb" "console_ext_lb" {
  name               = "console-ext-lb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
  
  enable_deletion_protection = true
  
  tags = {
    Name = "console-ext-lb"
    Environment = var.environment
  }
}

# API Target Group
resource "aws_lb_target_group" "api_tg" {
  name     = "console-ext-api-tg-${var.environment}"
  port     = 4000
  protocol = "HTTP"
  vpc_id   = aws_vpc.console_ext_vpc.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/api/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name = "console-ext-api-tg"
    Environment = var.environment
  }
}

# Dashboard Target Group
resource "aws_lb_target_group" "dashboard_tg" {
  name     = "console-ext-dashboard-tg-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.console_ext_vpc.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    interval            = 30
    path                = "/"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }
  
  tags = {
    Name = "console-ext-dashboard-tg"
    Environment = var.environment
  }
}

# HTTPS Listener for API
resource "aws_lb_listener" "api_https" {
  load_balancer_arn = aws_lb.console_ext_lb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.api_certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_tg.arn
  }
}

# HTTP to HTTPS Redirect
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.console_ext_lb.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ECS Task Definition for API
resource "aws_ecs_task_definition" "api_task" {
  family                   = "console-ext-api-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  
  container_definitions = jsonencode([
    {
      name      = "console-ext-api"
      image     = "${aws_ecr_repository.api_repo.repository_url}:latest"
      essential = true
      
      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "4000"
        },
        {
          name  = "MONGODB_URI"
          value = "mongodb://${var.db_username}:${var.db_password}@${aws_docdb_cluster.console_ext_db.endpoint}:27017/console-ext?retryWrites=false"
        },
        {
          name  = "CORS_ORIGINS"
          value = "https://api.console-ext.com,https://dashboard.console-ext.com"
        }
      ]
      
      secrets = [
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "ENCRYPTION_KEY"
          valueFrom = aws_ssm_parameter.encryption_key.arn
        },
        {
          name      = "TWILIO_ACCOUNT_SID"
          valueFrom = aws_ssm_parameter.twilio_account_sid.arn
        },
        {
          name      = "TWILIO_AUTH_TOKEN"
          valueFrom = aws_ssm_parameter.twilio_auth_token.arn
        },
        {
          name      = "TWILIO_PHONE_NUMBER"
          valueFrom = aws_ssm_parameter.twilio_phone_number.arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/console-ext-api"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
          "awslogs-create-group"  = "true"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:4000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])
  
  tags = {
    Name = "console-ext-api-task"
    Environment = var.environment
  }
}

# ECS Service for API
resource "aws_ecs_service" "api_service" {
  name            = "console-ext-api-service-${var.environment}"
  cluster         = aws_ecs_cluster.console_ext_cluster.id
  task_definition = aws_ecs_task_definition.api_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_groups = [aws_security_group.app_sg.id]
  }
  
  load_balancer {
    target_group_arn = aws_lb_target_group.api_tg.arn
    container_name   = "console-ext-api"
    container_port   = 4000
  }
  
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  
  tags = {
    Name = "console-ext-api-service"
    Environment = var.environment
  }
  
  depends_on = [aws_lb_listener.api_https]
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "console-ext-ecs-execution-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "console-ext-ecs-execution-role"
    Environment = var.environment
  }
}

resource "aws_iam_role" "ecs_task_role" {
  name = "console-ext-ecs-task-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Name = "console-ext-ecs-task-role"
    Environment = var.environment
  }
}

# IAM Policies
resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ssm_parameter_policy" {
  name        = "console-ext-ssm-parameter-policy-${var.environment}"
  description = "Allow read access to SSM parameters"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:DescribeParameters"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/console-ext-*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_parameter_policy_attachment" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = aws_iam_policy.ssm_parameter_policy.arn
}

# SSM Parameters for Secrets
resource "aws_ssm_parameter" "jwt_secret" {
  name        = "/console-ext-${var.environment}/jwt-secret"
  description = "JWT Secret for Console.ext"
  type        = "SecureString"
  value       = var.jwt_secret
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "encryption_key" {
  name        = "/console-ext-${var.environment}/encryption-key"
  description = "Encryption Key for Console.ext"
  type        = "SecureString"
  value       = var.encryption_key
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "twilio_account_sid" {
  name        = "/console-ext-${var.environment}/twilio-account-sid"
  description = "Twilio Account SID for Console.ext"
  type        = "SecureString"
  value       = var.twilio_account_sid
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "twilio_auth_token" {
  name        = "/console-ext-${var.environment}/twilio-auth-token"
  description = "Twilio Auth Token for Console.ext"
  type        = "SecureString"
  value       = var.twilio_auth_token
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "twilio_phone_number" {
  name        = "/console-ext-${var.environment}/twilio-phone-number"
  description = "Twilio Phone Number for Console.ext"
  type        = "SecureString"
  value       = var.twilio_phone_number
  
  tags = {
    Environment = var.environment
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "api_cpu_high" {
  alarm_name          = "console-ext-api-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  
  dimensions = {
    ClusterName = aws_ecs_cluster.console_ext_cluster.name
    ServiceName = aws_ecs_service.api_service.name
  }
  
  alarm_description = "This metric monitors API service CPU utilization"
  alarm_actions     = [aws_sns_topic.alerts.arn]
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_memory_high" {
  alarm_name          = "console-ext-api-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  
  dimensions = {
    ClusterName = aws_ecs_cluster.console_ext_cluster.name
    ServiceName = aws_ecs_service.api_service.name
  }
  
  alarm_description = "This metric monitors API service memory utilization"
  alarm_actions     = [aws_sns_topic.alerts.arn]
  
  tags = {
    Environment = var.environment
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "console-ext-alerts-${var.environment}"
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Data Sources
data "aws_caller_identity" "current" {}

# Variables
variable "aws_region" {
  description = "AWS region to deploy to"
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., prod, staging)"
  default     = "prod"
}

variable "db_username" {
  description = "Username for the database"
  sensitive   = true
}

variable "db_password" {
  description = "Password for the database"
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret key for JWT token signing"
  sensitive   = true
}

variable "encryption_key" {
  description = "Encryption key for sensitive data"
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  sensitive   = true
}

variable "twilio_phone_number" {
  description = "Twilio Phone Number"
  sensitive   = true
}

variable "api_certificate_arn" {
  description = "ARN of the SSL certificate for the API domain"
}

variable "dashboard_certificate_arn" {
  description = "ARN of the SSL certificate for the Dashboard domain"
}

variable "alert_email" {
  description = "Email address to send alerts to"
}

# Outputs
output "api_url" {
  value = "https://api.console-ext.com"
}

output "dashboard_url" {
  value = "https://dashboard.console-ext.com"
}

output "docdb_endpoint" {
  value = aws_docdb_cluster.console_ext_db.endpoint
}