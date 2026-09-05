pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        githubPush()
        // GitHub webhook is immediate; one-minute polling is the localhost fallback.
        pollSCM('* * * * *')
    }

    environment {
        NODE_IMAGE = 'node:20-bookworm-slim'
        IMAGE_NAME = 'sahyog/ui-workerportal'
        CONTAINER_NAME = 'sahyog-ui-workerportal'
        APP_PORT = '4200'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    def shortCommit = sh(script: 'git rev-parse --short=8 HEAD', returnStdout: true).trim()
                    currentBuild.displayName = "#${env.BUILD_NUMBER} ${shortCommit}"
                    currentBuild.description = "Commit ${env.GIT_COMMIT ?: shortCommit}"
                }
                sh '''
                    docker run --rm \
                      --user "$(id -u):$(id -g)" \
                      --volumes-from jenkins \
                      --volume sahyog-npm-cache:/root/.npm \
                      --workdir "${WORKSPACE}" \
                      --env CI=true \
                      "${NODE_IMAGE}" \
                      bash -ceu 'npm ci --no-audit --no-fund && npm run build'
                '''
            }
        }

        stage('Test') {
            steps {
                sh '''
                    docker run --rm \
                      --user "$(id -u):$(id -g)" \
                      --volumes-from jenkins \
                      --volume sahyog-npm-cache:/root/.npm \
                      --workdir "${WORKSPACE}" \
                      --env CI=true \
                      "${NODE_IMAGE}" \
                      npm test -- --watchAll=false --passWithNoTests
                '''
            }
        }

        stage('Package') {
            steps {
                archiveArtifacts artifacts: 'build/**', fingerprint: true
            }
        }

        stage('Build image') {
            when { expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' } }
            steps {
                sh 'docker build --pull --tag ${IMAGE_NAME}:${BUILD_NUMBER} --tag ${IMAGE_NAME}:latest .'
            }
        }

        stage('Deploy') {
            when { expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' } }
            steps {
                sh '''
                    docker rm --force "${CONTAINER_NAME}" 2>/dev/null || true
                    for attempt in 1 2 3 4 5 6; do
                      if docker run --detach \
                        --name "${CONTAINER_NAME}" \
                        --restart unless-stopped \
                        --publish "${APP_PORT}:${APP_PORT}" \
                        "${IMAGE_NAME}:${BUILD_NUMBER}"; then
                        exit 0
                      fi
                      docker rm --force "${CONTAINER_NAME}" 2>/dev/null || true
                      echo "Port ${APP_PORT} is not released yet; retrying deployment (${attempt}/6)..."
                      sleep 5
                    done
                    exit 1
                '''
            }
        }

        stage('Verify deployment') {
            when { expression { env.GIT_BRANCH == 'origin/main' || env.GIT_BRANCH == 'main' } }
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    sh '''
                        until [ "$(docker inspect --format='{{.State.Health.Status}}' "${CONTAINER_NAME}" 2>/dev/null)" = healthy ]; do
                          [ "$(docker inspect --format='{{.State.Status}}' "${CONTAINER_NAME}" 2>/dev/null)" = exited ] && docker logs "${CONTAINER_NAME}" && exit 1
                          sleep 3
                        done
                    '''
                }
            }
        }
    }

    post {
        cleanup { deleteDir() }
    }
}
