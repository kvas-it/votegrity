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
	${MOPJS} tests/client-tests.html

test:
	make srv-test
	make cli-test
	make syntaxcheck
