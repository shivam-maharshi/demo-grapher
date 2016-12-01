.PHONY: install

install: ## Installs the libraries for development.
	sh scripts/dev_dependency.sh

run: ## Runs the web application.
	python run.py