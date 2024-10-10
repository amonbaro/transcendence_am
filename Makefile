# Variables
COMPOSE_FILE := ./srcs/docker-compose.yml

GREEN := \033[0;32m
NC := \033[0m

UNAME_S := $(shell uname -s)
POSTGRES_DIR := /Users/Shared/postgres
SITE_DIR := ./srcs/site
USERNAME := $$(whoami)
GROUPNAME = $$(whoami)

ifeq (${UNAME_S}, "Darwin")
	GROUPNAME = staff
endif

create-directories:
	@if [ ! -d "${POSTGRES_DIR}/data" ]; then \
		echo "${GREEN}\nCREATING DIRECTORY \"${POSTGRES_DIR}/data\" FOR DATABASE ${NC}"; \
		sudo mkdir -p ${POSTGRES_DIR}/data; \
	fi

set-permissions:
	@echo "${GREEN}\nSETTING PERMISSIONS FOR \"${POSTGRES_DIR}/data\" DATA DIRECTORY ${NC}"
	@if [ ${UNAME_S} = "Darwin" ]; then \
		sudo chown -R ${USERNAME}:${GROUPENAME} ${POSTGRES_DIR}/; \
	elif [ ${UNAME_S} = "Linux" ]; then \
		sudo chown -R 102:104 ${POSTGRES_DIR}/; \
	fi
	@sudo chmod -R 775 ${POSTGRES_DIR}/

dangling-images:
	@echo "${GREEN}\nCLEANING DANGLING IMAGES ${NC}"
	-@docker image prune -f > /dev/null 2>&1

dangling-networks:
	@echo "${GREEN}\nCLEANING DANGLING NETWORKS ${NC}"
	-@docker network prune -f > /dev/null 2>&1

dangling-volumes:
	@echo "${GREEN}\nCLEANING DANGLING VOLUMES ${NC}"
	-@docker volume prune -f > /dev/null 2>&1

dangling: dangling-images dangling-networks dangling-volumes

# Target to start all services
up:
	@echo "${GREEN}\nBUILDING IMAGES, (RE)CREATING, STARTING AND ATTACHING CONTAINERS FOR SERVICES ${NC}"
	@docker-compose -f $(COMPOSE_FILE) up --build -d

all: create-directories set-permissions up

# Target to stop and remove containers and networks
down:
	@echo "${GREEN}\nSTOPPING CONTAINERS AND REMOVING CONTAINERS AND NETWORKS ${NC}"
	@docker-compose -f $(COMPOSE_FILE) down

# Target to stop and remove containers, networks, images, and volumes
down-rmi:
	@echo "${GREEN}\nSTOPPING CONTAINERS AND REMOVING CONTAINERS, NETWORKS, IMAGES, AND VOLUMES USED BY SERVICES ${NC}"
	@docker-compose -f $(COMPOSE_FILE) down --rmi all --volumes

clean: down

# Target to remove all resources and data
fclean: down-rmi
	@$(MAKE) dangling
	@if [ -d "${POSTGRES_DIR}/" ]; then \
  		echo "${GREEN}\nREMOVING SAVED DATA IN HOST MACHINE ${NC}"; \
  		sudo chown -R ${USERNAME}:${GROUPENAME} ${POSTGRES_DIR}/; \
  		sudo chmod -R 775 ${POSTGRES_DIR}/; \
  		rm -rf ${POSTGRES_DIR}/*; \
  		if [ ${UNAME_S} = "Darwin" ]; then \
  			rmdir ${POSTGRES_DIR}; \
		fi; \
	fi
	@echo "${GREEN}\nCHANGING PERMISSIONS FOR "site/media",  "site/static" AND "/site/profile_photos" to ${USERNAME}:${GROUPNAME} ${NC}";
	@sudo chown -R ${USERNAME}:${GROUPENAME} ${SITE_DIR}/
	@echo "${GREEN}\nREMOVING IMAGES IN srcs/site/profile_photos ${NC}";
	rm -rf ${SITE_DIR}/profile_photos/users/*

re: clean all

ref: fclean all

# Secondary Commands

# Build images without starting containers
build:
	@echo "${GREEN}\nBUILDING IMAGES WITHOUT STARTING THE CONTAINERS ${NC}"
	@docker-compose -f $(COMPOSE_FILE) build
	@$(MAKE) dangling

# Start containers for services
start:
	@echo "${GREEN}\nSTARTS CONTAINERS FOR SERVICES ${NC}"
	@docker-compose -f $(COMPOSE_FILE) start

# Target to stop running containers without removing them
stop:
	@echo "${GREEN}\nSTOPPING RUNNING CONTAINERS WITHOUT REMOVING THEM ${NC}"
	@docker-compose -f $(COMPOSE_FILE) stop

logs:
	@echo "${GREEN}\nDISPLAYS LOG OUTPUT FROM SERVICES ${NC}"
	@docker-compose -f $(COMPOSE_FILE) logs

ps:
	@docker ps -a

image:
	@docker image -a

network:
	@docker network ls

.PHONY: build up down start stop logs clean fclean all ref down-rmi ps
