.DEFAULT_GOAL := help

DOCKER_IMAGE ?= onesource:local
DOCKER_TARGET ?= runner
COMPOSE ?= docker compose
TEST_COMPOSE = $(COMPOSE) -p onesource-test -f docker-compose.test.yml

.PHONY: help docker-artifacts docker-build compose-up compose-up-detached compose-test-image compose-test-env-up compose-test-browser-image compose-test-browser-image-fresh compose-test-lint compose-test compose-test-build compose-test-bootstrap compose-test-e2e compose-down clean-dev-artifacts

help:
	@printf '%s\n' \
		'make docker-artifacts      Refresh optional local vendor fallback caches.' \
		'make docker-build          Build the Docker image.' \
		'make compose-up            Run docker compose up --build.' \
		'make compose-up-detached   Run docker compose up --build -d.' \
		'make compose-test-image    Rebuild the compose test runner image.' \
		'make compose-test-browser-image Rebuild the compose browser images with cache.' \
		'make compose-test-browser-image-fresh Rebuild the compose browser images without cache.' \
		'make compose-test-lint     Run compose lint.' \
		'make compose-test          Run compose unit tests.' \
		'make compose-test-build    Run compose production build validation.' \
		'make compose-test-bootstrap Start disposable test DB, then run migrate+seed in container.' \
		'make compose-test-e2e      Run compose Playwright Chromium tests.' \
		'make compose-down          Stop the compose stack.' \
		'make clean-dev-artifacts   Remove repo-local build, test, cache, dependency, and compose artifacts.'

docker-artifacts:
	node scripts/prepare-docker-artifacts.mjs

docker-build:
	docker build --target $(DOCKER_TARGET) -t $(DOCKER_IMAGE) .

compose-up:
	$(COMPOSE) up --build

compose-up-detached:
	$(COMPOSE) up --build -d

compose-test-image:
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) build test

compose-test-env-up:
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) up -d --wait db test

compose-test-browser-image:
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) build web playwright

compose-test-browser-image-fresh:
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) build --no-cache web playwright

compose-test-lint:
	$(MAKE) compose-test-env-up
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) exec -T test npm run lint

compose-test:
	$(MAKE) compose-test-env-up
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) exec -T test npm test

compose-test-build:
	$(MAKE) compose-test-env-up
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) exec -T test npm run build

compose-test-bootstrap:
	$(MAKE) compose-test-env-up
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) run --rm test ./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) run --rm test node prisma/seed.mjs

compose-test-e2e:
	-$(COMPOSE) down --remove-orphans
	-$(TEST_COMPOSE) down --remove-orphans
	$(MAKE) compose-test-bootstrap
	$(MAKE) compose-test-browser-image
	SAM_GOV_USE_FIXTURES=true $(TEST_COMPOSE) up --abort-on-container-exit --exit-code-from playwright playwright

compose-down:
	$(COMPOSE) down
	-$(TEST_COMPOSE) down --remove-orphans

clean-dev-artifacts:
	-$(COMPOSE) down --rmi local -v --remove-orphans
	-$(TEST_COMPOSE) down --rmi local -v --remove-orphans
	node scripts/clean-dev-artifacts.mjs
