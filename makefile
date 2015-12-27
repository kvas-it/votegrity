.PHONY: clean install checksum syntaxcheck test

NPMBIN=node_modules/.bin

BOWER=${NPMBIN}/bower
JSCS=${NPMBIN}/jscs
JSHINT=${NPMBIN}/jshint
MOCHA=${NPMBIN}/mocha

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

test:
	${MOCHA} ${SERVER_TESTS}
	make syntaxcheck
