import os

from flask import send_from_directory, request
from flask.templating import render_template

from src import app, config
from src.db import PGClient

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/view')
def view():
    return render_template('view.html')

@app.route('/test')
def test():
    return render_template('test.html')

@app.route('/static/<path:path>')
def render_static_assets(path):
    return send_from_directory(os.getcwd() + '/static/', path)

@app.route('/data')
def fetchData():
    dbc = PGClient(config.DB_USER, config.DB_PASSWORD, config.DB_NAME, config.DB_HOST, config.DB_PORT)
    return dbc.get(config.DB_TABLE_NAME, request.args.get('year'), 2.0, 9)
