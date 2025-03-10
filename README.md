# Event Registration App

This project is a web application for event registration, allowing users to register for events and providing an admin dashboard for managing event details and registrations. The application is designed to be easily deployable on Azure Kubernetes Service (AKS) and utilizes Redis for data storage.

## Project Structure

```
event-registration-app
├── src
│   ├── index.html          # Main registration page
│   ├── admin.html          # Admin dashboard
│   ├── css
│   │   └── styles.css      # Styles for the application
│   ├── js
│   │   ├── main.js         # Client-side logic for registration
│   │   ├── admin.js        # Client-side logic for admin dashboard
│   │   └── server.js       # Node.js server
├── kubernetes
│   ├── deployment.yaml      # Deployment configuration for the web app
│   ├── service.yaml         # Service configuration for the web app
│   ├── ingress.yaml         # Ingress rules for external access
│   └── secrets.yaml         # Secrets for Redis and email service
├── redis
│   ├── deployment.yaml      # Deployment configuration for Redis
│   └── service.yaml         # Service configuration for Redis
├── Dockerfile                # Instructions to build the Docker image
├── README.md                 # Documentation for the project
├── azure-pipelines.yaml      # Azure DevOps pipeline configuration
└── package.json              # Node.js dependencies and scripts
```

## Features

- **User Registration**: Users can fill out a form to register for events and receive email confirmations with event details.
- **Admin Dashboard**: Admins can insert event details, view registered users, and edit the registration table live. The admin page is password-protected.
- **Email Notifications**: Utilizes Azure Communication Services for sending email notifications.

## Deployment Instructions

1. **Build the Docker Image**:
   Run the following command in the project root:
   ```sh
   docker build -t event-registration-app .
   ```

2. **Deploy to AKS**:
   - Apply the Kubernetes configurations:
     ```sh
     kubectl apply -f kubernetes/secrets.yaml
     kubectl apply -f kubernetes/deployment.yaml
     kubectl apply -f kubernetes/service.yaml
     kubectl apply -f kubernetes/ingress.yaml
     ```
   - Deploy Redis:
     ```sh
     kubectl apply -f redis/deployment.yaml
     kubectl apply -f redis/service.yaml
     ```

3. **Access the Application**:
   Use the ingress URL to access the registration page and the admin dashboard.

4. **Delete the Deployment**:
   To remove the application after the event:
   ```sh
   kubectl delete -f kubernetes/deployment.yaml
   kubectl delete -f kubernetes/service.yaml
   kubectl delete -f kubernetes/ingress.yaml
   kubectl delete -f redis/deployment.yaml
   kubectl delete -f redis/service.yaml
   ```

## Usage

- Navigate to the registration page to register for an event.
- Admins can log in to the admin dashboard to manage events and registrations.

## License

This project is licensed under the MIT License.