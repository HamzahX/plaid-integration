DOCKER_COMPOSE := docker compose
DOCKER_COMPOSE_YML := --file docker-compose.yml
ifneq ("$(wildcard docker-compose.local.yml)","")
DOCKER_COMPOSE_YML += --file docker-compose.local.yml
endif

FRONTEND_PORT := 4000
SUCCESS_MESSAGE := "✅ Quickstart is running on https://localhost:$(FRONTEND_PORT)"

.PHONY: sandbox production
sandbox: export REACT_APP_API_HOST = http://backend:8000
sandbox: export PLAID_REDIRECT_URI = https://localhost:$(FRONTEND_PORT)/
sandbox:
	$(DOCKER_COMPOSE) \
		$(DOCKER_COMPOSE_YML) \
		up --build --detach --remove-orphans --force-recreate \
		backend
	@echo $(SUCCESS_MESSAGE)

production: export REACT_APP_API_HOST = http://backend:8000
production: export PLAID_REDIRECT_URI = https://localhost:$(FRONTEND_PORT)/
production:
	$(DOCKER_COMPOSE) \
		$(DOCKER_COMPOSE_YML) \
		--env-file .env \
		--env-file .env.prod \
		up --build --detach --remove-orphans --force-recreate \
		backend
	@echo $(SUCCESS_MESSAGE)

.PHONY: logs
logs:
	$(DOCKER_COMPOSE) \
		$@ --follow \
		backend frontend

.PHONY: stop build
stop build:
	$(DOCKER_COMPOSE) \
		$(DOCKER_COMPOSE_YML) \
		$@ \
		backend frontend

