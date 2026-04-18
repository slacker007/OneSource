.DEFAULT_GOAL := help

DOCKER_IMAGE ?= onesource:local
DOCKER_TARGET ?= runner
COMPOSE ?= docker compose

.PHONY: help docker-artifacts docker-build compose-up compose-up-detached compose-test-lint compose-test compose-test-build compose-test-e2e compose-down

help:
	@printf '%s\n' \
		'make docker-artifacts      Refresh local vendor cache archives when needed.' \
		'make docker-build          Refresh local archives, then build the Docker image.' \
		'make compose-up            Refresh local archives, then run docker compose up --build.' \
		'make compose-up-detached   Refresh local archives, then run docker compose up --build -d.' \
		'make compose-test-lint     Refresh local archives, then run compose lint.' \
		'make compose-test          Refresh local archives, then run compose unit tests.' \
		'make compose-test-build    Refresh local archives, then run compose production build validation.' \
		'make compose-test-e2e      Refresh local archives, then run compose Playwright Chromium tests.' \
		'make compose-down          Stop the compose stack.'

docker-artifacts:
	node scripts/prepare-docker-artifacts.mjs

docker-build: docker-artifacts
	docker build --target $(DOCKER_TARGET) -t $(DOCKER_IMAGE) .

compose-up: docker-artifacts
	$(COMPOSE) up --build

compose-up-detached: docker-artifacts
	$(COMPOSE) up --build -d

compose-test-lint: docker-artifacts
	SAM_GOV_USE_FIXTURES=true $(COMPOSE) --profile test run --rm --build test run lint

compose-test: docker-artifacts
	SAM_GOV_USE_FIXTURES=true $(COMPOSE) --profile test run --rm --build test

compose-test-build: docker-artifacts
	SAM_GOV_USE_FIXTURES=true $(COMPOSE) --profile test run --rm --build test run build

compose-test-e2e: docker-artifacts
	SAM_GOV_USE_FIXTURES=true $(COMPOSE) --profile test up --build --abort-on-container-exit --exit-code-from playwright playwright

compose-down:
	$(COMPOSE) down
