.PHONY: all

all: db.db

pugly.sql: schema.sql
	npx puglify $< > $@

db.db: schema.sql load.sql pugly.sql
	sqlite3 $@ < load.sql
	./load-workshops.js $@ data/workshops.csv data/multiperiod.csv
	./pad-choices.js $@

clean:
	rm -f db.db* pugly.sql
