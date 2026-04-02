.PHONY: all clean

ifndef DATA_DIR
$(error DATA_DIR is not set. Set it to the directory containing data/ and where db.db will be created.)
endif

DB = $(DATA_DIR)/db.db

all: $(DB)

pugly.sql: schema.sql
	npx puglify $< > $@

load.sql: load.sql.in
	sed 's|__DATA_DIR__|$(DATA_DIR)|g' $< > $@

$(DB): schema.sql load.sql pugly.sql
	sqlite3 $@ < load.sql
	./load-workshops.js $@ $(DATA_DIR)/data/workshops.csv $(DATA_DIR)/data/multiperiod.csv
	./pad-choices.js $@

clean:
	rm -f $(DB)* pugly.sql load.sql
