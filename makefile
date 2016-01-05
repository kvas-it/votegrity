.PHONY: clean install checksum syntaxcheck srv-test cli-test test

NPMBIN=node_modules/.bin

BOWER=${NPMBIN}/bower
JSCS=${NPMBIN}/jscs
JSHINT=${NPMBIN}/jshint
MOCHA=${NPMBIN}/mocha
MOPJS=${NPMBIN}/mocha-phantomjs

SERVER_SRC=server
CLIENT_SRC=client/js
SOURCES=${SERVER_SRC} ${CLIENT_SRC}
SERVER_TESTS=tests/server
CLIENT_TESTS=tests/client
TESTS=${SERVER_TESTS} ${CLIENT_TESTS}
NODE=node
TS_CTL=tests/testServerCtl

install:
	npm install
	${BOWER} install
	make checksum

clean:
	rm -Rf node_modules bower_components

checksum:
	shasum -c shasums.txt

syntaxcheck:
	${JSHINT} ${SOURCES} ${TESTS}
	${JSCS} ${SOURCES} ${TESTS}

srv-test:
	${MOCHA} ${SERVER_TESTS}

cli-test:
	- ${TS_CTL} stop >/dev/null 2>&1
	${TS_CTL} start
	${MOPJS} --web-security=no tests/client-tests.html || ${TS_CTL} fail
	${TS_CTL} stop

test:
	@echo
	@echo === server tests ===
	@echo
	@make srv-test
	@echo
	@echo === client tests ===
	@echo
	@make cli-test
	@echo
	@echo === style checkers ===
	@echo
	@make syntaxcheck
