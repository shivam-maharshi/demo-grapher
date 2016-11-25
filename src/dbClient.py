import sqlalchemy
from sqlalchemy import Table, Column, Integer, String, ForeignKey

from src import config

'''
DBClient for Postgres DB.

@author: shivam.maharshi
'''
class DBClient(object):
    
    def __init__(self, user, password, db='demographer', host='127.0.0.1', port=5432):
        self.url = 'postgresql://{}:{}@{}:{}/{}'.format('postgres', 'root', host, port, db)
        self.con = sqlalchemy.create_engine(self.url, client_encoding='utf8')
        self.meta = sqlalchemy.MetaData(bind=self.con, reflect=True)
    
    def execute(self):
        self.con.execute('SELECT version()')          
        ver = self.con.fetchone()
        print (ver)
        self.con.execute('SELECT * FROM "Student_residency"')
        ver = self.con.fetchone()
        print (ver)

c = DBClient(config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.DB_HOST, config.DB_PORT)
print(c.con)
for table in c.meta.tables:
    print (table)




