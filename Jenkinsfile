pipeline {
    agent any

    environment {
        DIR_NAME = "file-management-nestjs"
        GCR_REGISTRY = "asia.gcr.io"
        GCR_PROJECT_ID = "goapptiv/file-management"
        GCR_IMAGE_NAME = "file-management-nestjs"
    }

    stages {
        stage("Checkout") {
            steps {
                checkout scm
                script {
                    env.TAG_NAME = sh(returnStdout: true, script: 'git tag --sort version:refname | tail -1').trim()
                }
            }
        }

        stage("Write secret file") {
            steps {
                // Read the secret file credential
                withCredentials([file(credentialsId: 'file-management-nestjs-env', variable: 'SECRET_FILE_PATH')]) {
                    // Write the secret file to disk
                    writeFile file: '.env', text: readFile(SECRET_FILE_PATH)
                }
            }
        }

        stage("Activate Service Account") {
            steps {
                // Read the service account credential
                withCredentials([file(credentialsId: 'proj-goapptiv-gcr-deployer-sa-key', variable: 'SERVICE_ACCOUNT')]) {
                    // Activate the service account
                    sh 'gcloud auth activate-service-account --key-file="${SERVICE_ACCOUNT}"'
                }
            }
        }

        stage("Build Docker Image") {
            steps {
                script {
                    def TAG_NAME = env.TAG_NAME
                    // Build Docker Image
                    withCredentials([string(credentialsId: 'goapptiv-npm-github-token', variable: 'NPM_GITHUB_TOKEN')]) {
                        sh 'docker build -t ${GCR_REGISTRY}/${GCR_PROJECT_ID}/${GCR_IMAGE_NAME}:${TAG_NAME} -t ${GCR_REGISTRY}/${GCR_PROJECT_ID}/${GCR_IMAGE_NAME}:latest . --build-arg NPM_GITHUB_TOKEN=${NPM_GITHUB_TOKEN}'
                    }
                }
            }
        }

        stage("Push Docker Image") {
            steps {
                sh 'gcloud auth configure-docker ${GCR_REGISTRY} -q'
                sh 'docker push -a ${GCR_REGISTRY}/${GCR_PROJECT_ID}/${GCR_IMAGE_NAME}'
            }
        }

        stage("Deploy to Compute Engine") {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'file-management-nestjs-vm-ssh', 
                                                   keyFileVariable: 'SSH_PRIVATE_KEY',
                                                   passphraseVariable: '', 
                                                   usernameVariable: 'SSH_USERNAME'),          
                                string(credentialsId: 'file-management-nestjs-vm-ip', variable: 'VM_IP')]) {
                    sh 'ssh -o StrictHostKeyChecking=no -i "${SSH_PRIVATE_KEY}" "${SSH_USERNAME}"@"${VM_IP}" "sudo gcloud auth configure-docker ${GCR_REGISTRY} -q && cd apps && sudo docker compose pull && sudo docker compose down && sudo docker compose up -d"'
                }
            }

            post {
                success {
                    // send success email notification
                    mail to: 'sagar.vaghela@goapptiv.com',
                         subject: "Pipeline Successful: ${env.JOB_NAME}",
                         body: "Your Jenkins pipeline ${env.JOB_NAME} has completed successfully. Here are the details:\n\n" +
                               "Build Number: ${env.BUILD_NUMBER}\n" +
                               "Duration: ${currentBuild.durationString}\n" +
                               "Status: SUCCESS"
                }
                failure {
                    // send failure email notification
                    mail to: 'sagar.vaghela@goapptiv.com',
                         subject: "Pipeline Failed: ${env.JOB_NAME}",
                         body: "Your Jenkins pipeline ${env.JOB_NAME} has failed. Please check the console output for details. Here are the details:\n\n" +
                               "Build Number: ${env.BUILD_NUMBER}\n" +
                               "Duration: ${currentBuild.durationString}\n" +
                               "Status: FAILURE"
                }
            }
        }

        stage("Cleanup") {
            steps {
                // Remove .env secret
                sh 'rm .env'

                // Remove all docker images
                sh 'docker image prune -f -a'
            }
        }
    }
}