import os

from flask import send_from_directory
from flask.templating import render_template

from src import app

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