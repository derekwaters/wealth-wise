# Wealth Wise Serverless Setup

## Prerequisites

### KNative CLI

Ensure you install the KNative CLI tool (KNative is the upstream open source project that OpenShift Serverless is derived from):

[KNative CLI Setup](https://knative.dev/docs/client/install-kn/)

### Quay.io Account

You will need a container registry to transfer serverless images to your OpenShift environment. Sign up at [quay.io](https://quay.io)

### Access to OpenShift

You will need access to an OpenShift cluster with sufficient resources, and the oc CLI tool to configure it. Ensure you're logged in to your OpenShift cluster with oc.

### An OpenAI API Key

You will need to obtain an API key from [OpenAI](https://platform.openai.com/account/api-keys)

## Setting Up The Environment for Serverless

Start by cloning this project to your local environment.

### Build and Push the Container Images

Use KNative CLI to build and push all of the serverless container images to your quay.io registry. Ensure that docker is logged in to quay.io before you run these commands.

```sh
kn func build --path advisor-history --builder s2i --image quay.io/<your-quay-account>/ww-advisor-history:latest --push
kn func build --path financial-advisor --builder s2i --image quay.io/<your-quay-account>/ww-financial-advisor:latest --push
kn func build --path investment-advisor --builder s2i --image quay.io/<your-quay-account>/ww-investment-advisor:latest --push
kn func build --path ww-frontend --builder s2i --image quay.io/<your-quay-account>/ww-frontend:latest --push
kn func build --path add-history --builder s2i --image quay.io/<your-quay-account>/ww-add-history:latest --push
````

### Create a dedicated project for your serverless workloads

```sh
oc new-project wealthwise
```

### Create the required secrets

Firstly, create a secret for your OpenAI API key:

```sh
oc create secret generic openai-token \
    --from-literal=OPENAI_API_KEY=<your-openai-key> -n wealthwise
```

Then create a database access secret:

```sh
oc create secret generic db-credentials \  --from-literal=QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://wealthwise.ww-serverless.svc.cluster.local:5432/wealthwise \  --from-literal=QUARKUS_DATASOURCE_USERNAME=devuser \  --from-literal=QUARKUS_DATASOURCE_PASSWORD=devpass \  -n wealthwise
```

Then create app config secrets for the financial advisor and investment advisor functions:

```sh
oc create secret generic financial-advisor-app-properties --from-file=financial-advisor/src/main/resources/application.properties -n wealthwise
oc create secret generic investment-advisor-app-properties --from-file=investment-advisor/src/main/resources/application.properties -n wealthwise
```

### Deploy the PostGreSQL Database

OpenShift provides a ready-made PostgreSQL template that you can deploy through the Developer Console or CLI. When configuring it, make sure the DB credentials match those stored in your db-credentials secret. Also ensure that the postgresql version is 12 (or higher) as this is a requirement of the default JDBC binding library used in the Quarkus applications. Ensure that the database server name is wealthwise, the database name is wealthwise, and the username and password are devuser and devpass.

## Deploy OpenShift Serverless and Apache Kafka into the OpenShift Environment

Use the Operators to deploy both OpenShift Serverless and Streams for Apache Kafka. Ensure that you deploy the KNative Serving, KNative Eventing and KNative Kafka Eventing API objects into their relevant namespaces.

### Create the Kafka Cluster

Create the cluster using the Kubernetes resource definition:

```sh
oc apply -f k8s-resources/kafka/kafka-cluster.yaml
oc apply -f k8s-resources/kafka/kafka-topics.yaml
```

### Deploy the backend functions

```sh
oc project wealthwise
oc apply -f k8s-resources/services/financial-advisor-service.yaml
oc apply -f k8s-resources/services/investment-advisor-service.yaml
oc apply -f k8s-resources/services/advisor-history-service.yaml
oc apply -f k8s-resources/services/add-history-service.yaml
```

### Deploy the frontend function

```sh
oc apply -f k8s-resources\\services\\frontend-service.yaml
```

### Get the route to the new application

Run the command:

```sh
kn service describe frontend
```

to find out the URL to the frontend of the Wealthwise website. Open the link in a browser and have fun!
