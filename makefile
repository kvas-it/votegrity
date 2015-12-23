.PHONY: clean install checksum syntaxcheck test

NPMBIN=node_modules/.bin

BOWER=${NPMBIN}/bower
JSCS=${NPMBIN}/jscs
JSHINT=${NPMBIN}/jshint
MOCHA=${NPMBIN}/mocha

SOURCES=server client/js tests

install:
	npm install
	${BOWER} install
	make checksum

clean:
	rm -Rf node_modules bower_components

checksum:
	shasum -c shasums.txt

syntaxcheck:
	${JSHINT} ${SOURCES}
	${JSCS} ${SOURCES}

test:
	${MOCHA} tests
	make syntaxcheck
