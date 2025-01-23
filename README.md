# Task Management System-Project

```

aws cloudformation create-stack --stack-name TaskManagement --template-body file://TaskManagementTable.yml --capabilities CAPABILITY_IAM

```

### To deploy the Development Environment

Run `./deployDev.sh`

To tear down the deployment then run `./cleanupDev.sh`

### To deploy the CI/CD Pipeline

Run `./createPipeline.sh`

To teardown the pipeline, run `./cleanupPipeline.sh`