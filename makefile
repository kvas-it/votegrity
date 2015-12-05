.PHONY: clean install checksum

install:
	npm install

clean:
	rm -Rf node_modules

checksum:
	shasum -c shasums.txt
