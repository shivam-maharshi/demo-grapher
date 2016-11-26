import sqlalchemy
from sqlalchemy.sql import text

from src import config

'''
Database client for Postgres SQL Server.

@author: shivam.maharshi
'''
class PGClient(object):
    
    def __init__(self, user, password, db='demographer', host='127.0.0.1', port=5432):
        self.url = 'postgresql://{}:{}@{}:{}/{}'.format('postgres', 'root', host, port, db)
        self.con = sqlalchemy.create_engine(self.url, client_encoding='utf8').connect()
        self.meta = sqlalchemy.MetaData(bind=self.con, reflect=True)
            
    def get(self, table, year, gender, race):
        table = self.meta.tables[table]
        stmt = table.select((table.c.Gender_code == gender) & (table.c.Ethnicity_code == race) & (table.c.Year == year))
        rs = stmt.execute()
        for row in rs:
            print (row)
        return rs
    
    def execute(self, sql):
        records = []
        rs = self.con.execute(sql)
        for row in rs:
            records.append(str(row))
        return records
        

    def print_all_columns(self, table):
        for col in self.meta.tables[table].c:
            print(col)

#dbc = PGClient(config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.DB_HOST, config.DB_PORT)
