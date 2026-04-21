CREATE DATABASE IF NOT EXISTS aviator;
CREATE USER IF NOT EXISTS 'aviator_user'@'localhost' IDENTIFIED BY 'aviator_password';
GRANT ALL PRIVILEGES ON aviator.* TO 'aviator_user'@'localhost';
FLUSH PRIVILEGES;
