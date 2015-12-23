.PHONY: clean install checksum syntaxcheck

BOWER=node_modules/bower/bin/bower
JSCS=node_modules/jscs/bin/jscs
JSHINT=node_modules/jshint/bin/jshint

install:
	npm install
	${BOWER} install
	make checksum

clean:
	rm -Rf node_modules bower_components

checksum:
	shasum -c shasums.txt

syntaxcheck:
	${JSHINT} server client/js
	${JSCS} server client/js
