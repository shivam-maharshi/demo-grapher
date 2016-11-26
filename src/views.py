import json, os, urllib

from flask import send_from_directory, request
from flask.templating import render_template

from src import app, config
from src.db import PGClient

@app.route('/')
@app.route('/index')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/view.html', methods=['GET'])
def view():
    return render_template('view.html')

@app.route('/test.html')
def test():
    return render_template('test.html')

@app.route('/data', methods=['POST'])
def data():
    rb = urllib.parse.unquote(request.data.decode('utf8'))
    r = DataRequest(rb)
    dbc = PGClient(config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.DB_HOST, config.DB_PORT)
    return str(dbc.execute('SELECT * FROM "Student_residency" LIMIT 10'))

@app.route('/static/<path:path>')
def render_static_assets(path):
    return send_from_directory(os.getcwd() + '/static/', path)


class DataRequest(object):
    
    def __init__(self, j):
        self.__dict__ = json.loads(j)
