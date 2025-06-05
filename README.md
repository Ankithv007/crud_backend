
# Frontend Deployment on EC2 with Nginx ‚Äî Step-by-Step Guide

This README contains all essential commands and troubleshooting steps for deploying a React (or similar SPA) frontend on an EC2 Ubuntu instance with Nginx.

---

## 1. Connect to your EC2 instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

---

## 2. Clone your repository

```bash
cd ~
git clone https://github.com/Ankithv007/crud-app.git
cd crud-app/client
```

---

## 3. Install Node.js and npm

Update package lists and install:

```bash
sudo apt update
sudo apt install nodejs npm -y
```

Check versions:

```bash
node -v
npm -v
```

If Node.js version is too old, install a newer version (e.g., Node 18):

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 4. Build the frontend

```bash
npm install
npm run build
```

This creates a `dist/` folder with your compiled frontend files.

---

## 5. Install Nginx

```bash
sudo apt install nginx -y
```

---

## 6. Remove default Nginx site config

```bash
sudo rm /etc/nginx/sites-enabled/default
```

---

## 7. Create new Nginx config for your frontend

```bash
sudo nano /etc/nginx/sites-available/frontend
```

Paste this config and update IP/path as needed:

```nginx
server {
    listen 80;
    server_name your-ec2-ip;

    root /home/ubuntu/crud-app/client/dist;
    index index.html;

    # Proxy API requests to backend if applicable
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve frontend files and handle SPA routing
    location / {
        try_files $uri /index.html;
    }

    # Optional: serve static files properly
    location /static/ {
        expires 1y;
        access_log off;
    }
}
```

Save and exit (Ctrl+O, Enter, Ctrl+X).

---

## 8. Enable the new Nginx site

```bash
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/


```

---

## 9. Fix permissions to avoid Nginx permission errors

Nginx runs as `www-data` user on Ubuntu. Allow it to read your frontend files:

```bash
sudo chown -R www-data:www-data /home/ubuntu/crud-app/client/dist
sudo find /home/ubuntu/crud-app/client/dist -type d -exec chmod 755 {} \;
sudo find /home/ubuntu/crud-app/client/dist -type f -exec chmod 644 {} \;

# Also allow www-data access through parent folders
sudo chmod o+x /home/ubuntu
sudo chmod o+x /home/ubuntu/crud-app
sudo chmod o+x /home/ubuntu/crud-app/client
```

---

## 10. Test Nginx config and restart service

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---
## 10.1  Check  Nginx error logs for hints:
```bash
sudo tail -n 20 /var/log/nginx/error.log
```

## 11. Open port 80 in AWS Security Group

- Go to AWS Console ‚Üí EC2 ‚Üí Security Groups.
- Select the Security Group of your EC2 instance.
- Edit inbound rules to allow HTTP (port 80) from anywhere (0.0.0.0/0).

---

## 12. Access your frontend

Open your browser and go to:

```
http://your-ec2-ip
```

---

## Troubleshooting Tips

- If you get permission denied errors in Nginx logs (e.g., `stat() "/home/ubuntu/crud-app/client/dist/index.html" failed (13: Permission denied)`):

  Run:

  ```bash
  sudo chown -R www-data:www-data /home/ubuntu/crud-app/client/dist
  sudo find /home/ubuntu/crud-app/client/dist -type d -exec chmod 755 {} \;
  sudo find /home/ubuntu/crud-app/client/dist -type f -exec chmod 644 {} \;
  
  sudo chmod o+x /home
  sudo chmod o+x /home/ubuntu
  sudo chmod o+x /home/ubuntu/crud-app
  sudo chmod o+x /home/ubuntu/crud-app/client
  sudo systemctl restart nginx
  ```

- To check permissions of directories and files:

  ```bash
  ls -ld /home/ubuntu /home/ubuntu/crud-app /home/ubuntu/crud-app/client /home/ubuntu/crud-app/client/dist
  ls -l /home/ubuntu/crud-app/client/dist/index.html
  ```

- Make sure backend API server is running if you have API proxy set in Nginx.

---

This guide covers the full flow from setting up Node.js, building frontend, installing and configuring Nginx, fixing permissions, and opening firewall ports for a React frontend deployment on EC2.

------------------------------------------------------------------------------------------------

# For more understading 

# Ìª†Ô∏è React + Node.js Deployment on EC2 with Nginx

This guide explains how to deploy a full-stack React + Node.js application on an EC2 instance using Nginx.

---

## ‚úÖ Prerequisites

* Ubuntu EC2 instance (or any Linux-based VPS)
* Node.js and npm installed
* Nginx installed: `sudo apt install nginx`

---

## Ì∑© Project Structure

```
crud-app/
‚îú‚îÄ‚îÄ client/         # React frontend
‚îÇ   ‚îî‚îÄ‚îÄ dist/       # Production build after `npm run build`
‚îú‚îÄ‚îÄ server/         # Node.js backend
```

---

## Ì≥¶ Frontend Build

```bash
cd ~/crud-app/client
npm install
npm run build
```

The build output goes to: `client/dist/`

---

## Ì∫ö Move or Set Build Directory

You can either:

* Use `/var/www/crud-frontend/` (common practice), or
* Keep the build in `/home/ubuntu/crud-app/client/dist`

Make sure Nginx has permission:

```bash
sudo chown -R www-data:www-data /home/ubuntu/crud-app/client/dist
sudo chmod -R 755 /home/ubuntu/crud-app/client/dist
```

---

## ‚öôÔ∏è Nginx Configuration

### Path: `/etc/nginx/sites-available/frontend`

```nginx
server {
    listen 80;
    server_name YOUR_PUBLIC_IP;

    root /home/ubuntu/crud-app/client/dist;  # or /var/www/crud-frontend
    index index.html;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri /index.html;
    }

    location /static/ {
        expires 1y;
        access_log off;
    }
}
```

### Enable Site and Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# or
sudo mkdir -p /var/www/crud-frontend
sudo cp -r ~/crud-app/client/dist/* /var/www/crud-frontend/

```

---

## Ì∫Ä Start Node.js Backend

```bash
cd ~/crud-app/server
node index.js  # or use pm2/systemd for production
```

---

## Ì∑™ Useful Commands

### Check Nginx Logs

```bash
sudo tail -n 30 /var/log/nginx/error.log
```

### Restart Nginx

```bash
sudo systemctl restart nginx
```

### File Permissions Fix

```bash
sudo chown -R www-data:www-data /your/path
sudo chmod -R 755 /your/path
```

---

## ‚úÖ Final Notes

* You can place the React build **anywhere**, just match the `root` path in Nginx.
* Always make sure file permissions allow Nginx to read files.
* Start backend server separately or use **PM2/systemd** to manage it in production.

---
```

sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation



CREATE USER 'nodeuser'@'%' IDENTIFIED WITH mysql_native_password BY 'MySecurePass123!';
GRANT ALL PRIVILEGES ON crud.* TO 'nodeuser'@'%';
FLUSH PRIVILEGES;
EXIT;

CREATE DATABASE crud;
USE crud;

CREATE TABLE book (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publisher VARCHAR(255),
    name VARCHAR(255),
    date DATE
);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'nodeuser',
    password: 'MySecurePass123!',  // your password here
    database: 'crud',               // your actual database name
    dateStrings: 'date'
});

```
```
-- Create the user (only if it doesn't exist)
CREATE USER IF NOT EXISTS 'nodeuser'@'localhost' IDENTIFIED BY 'MySecurePass123!';

-- Grant permissions on your `crud` database
GRANT ALL PRIVILEGES ON crud.* TO 'nodeuser'@'localhost';

-- Save changes
FLUSH PRIVILEGES;


```
