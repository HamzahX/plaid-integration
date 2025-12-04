DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_YML := --file docker-compose.yml
ifneq ("$(wildcard docker-compose.local.yml)","")
DOCKER_COMPOSE_YML += --file docker-compose.local.yml
endif

language := node
FRONTEND_PORT := 4000
SUCCESS_MESSAGE := "✅ $(language) quickstart is running on https://localhost:$(FRONTEND_PORT)"

.PHONY: up up-prod
up: export REACT_APP_API_HOST = http://$(language):8000
up: export PLAID_REDIRECT_URI = https://localhost:$(FRONTEND_PORT)/
up:
	$(DOCKER_COMPOSE) \
		$(DOCKER_COMPOSE_YML) \
		$@ --build --detach --remove-orphans --force-recreate \
		$(language)
	@echo $(SUCCESS_MESSAGE)

up-prod: export REACT_APP_API_HOST = http://$(language):8000
up-prod: export PLAID_REDIRECT_URI = https://localhost:$(FRONTEND_PORT)/
up-prod:
	$(DOCKER_COMPOSE) \
		$(DOCKER_COMPOSE_YML) \
		--env-file .env \
		--env-file .env.prod \
		up --build --detach --remove-orphans --force-recreate \
		$(language)
	@echo $(SUCCESS_MESSAGE)

.PHONY: logs
logs:
	$(DOCKER_COMPOSE) \
		$@ --follow \
		$(language) frontend

.PHONY: stop build
stop build:
	$(DOCKER_COMPOSE) \
		$(DOCKER_COMPOSE_YML) \
		$@ \
		$(language) frontend

